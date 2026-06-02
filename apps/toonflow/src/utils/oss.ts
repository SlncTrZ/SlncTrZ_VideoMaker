import isPathInside from "is-path-inside";
import getPath, { isEletron } from "@/utils/getPath";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Normalize path: remove leading slashes, convert separators to system format
function normalizeUserPath(userPath: string): string {
  // Remove leading / or \
  const trimmedPath = userPath.replace(/^[/\\]+/, "");
  // Replace all / with system path separator (path.sep)
  // On Windows becomes \, on Unix stays /
  return trimmedPath.split("/").join(path.sep);
}

// Validate path
function resolveSafeLocalPath(userPath: string, rootDir: string): string {
  const safePath = normalizeUserPath(userPath);
  const absPath = path.join(rootDir, safePath);
  if (!isPathInside(absPath, rootDir)) {
    throw new Error(`${userPath} is not inside OSS root directory`);
  }
  return absPath;
}

class OSS {
  private rootDir: string;
  private initPromise: Promise<void>;

  constructor() {
    this.rootDir = getPath("oss");
    // Auto-create root directory on init
    this.initPromise = fs.mkdir(this.rootDir, { recursive: true }).then(() => {});
  }

  /**
   * Wait for root directory initialization. Ensures all file operations execute after directory creation.
   * @private
   */
  private async ensureInit() {
    await this.initPromise;
  }

  /**
   * Get the access URL for a file at the given relative path.
   * @param userRelPath User-provided relative file path (using / as separator)
   * @returns HTTP URL of the file (local service address)
   */
  async getFileUrl(userRelPath: string, prefix?: string): Promise<string> {
    if (!prefix) prefix = "oss";
    await this.ensureInit();
    const safePath = normalizeUserPath(userRelPath);
    // URL always uses /, so convert system separator back to /
    let url = `/${prefix}/`;
    if (process.env.ossURL && process.env.ossURL !== "") url = process.env.ossURL + `/${prefix}/`;
    if (process.env.NODE_ENV == "dev") url = `http://localhost:10588/${prefix}/`;
    if (isEletron()) url = `http://localhost:${process.env.PORT}/${prefix}/`;
    return `${url}${safePath.split(path.sep).join("/")}`;
  }

  /**
   * Read file content as Buffer from the given relative path.
   * @param userRelPath User-provided relative file path (using / as separator)
   * @returns Buffer of file content
   * @throws If path is outside OSS root or file does not exist
   */
  async getFile(userRelPath: string): Promise<Buffer> {
    await this.ensureInit();
    return fs.readFile(resolveSafeLocalPath(userRelPath, this.rootDir));
  }

  /**
   * Read image file and convert to base64-encoded Data URL.
   * @param userRelPath User-provided relative file path (using / as separator)
   * @returns Base64-encoded Data URL (e.g. data:image/png;base64,iVBORw0KGgo...)
   * @throws If path is outside root, file doesn't exist, or not an image
   */
  async getImageBase64(userRelPath: string): Promise<string> {
    await this.ensureInit();
    const absPath = resolveSafeLocalPath(userRelPath, this.rootDir);

    // Check if file exists and is a file
    const stat = await fs.stat(absPath);
    if (!stat.isFile()) {
      throw new Error(`${userRelPath} is not a file`);
    }

    // Get file extension and determine MIME type
    const ext = path.extname(userRelPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".tiff": "image/tiff",
      ".tif": "image/tiff",
      ".mp4": "video/mp4",
      ".mp3": "audio/mpeg",
    };

    const mimeType = mimeTypes[ext];
    if (!mimeType) {
      throw new Error(`Unsupported image format: ${ext}. Supported: ${Object.keys(mimeTypes).join(", ")}`);
    }

    // Read file and convert to base64
    const data = await fs.readFile(absPath);
    const base64 = data.toString("base64");

    // Return full Data URL
    return `data:${mimeType};base64,${base64}`;
  }
  /**
   * Delete a file at the given relative path.
   * @param userRelPath User-provided relative file path (using / as separator)
   * @throws If path is outside root or file does not exist
   */
  async deleteFile(userRelPath: string): Promise<void> {
    await this.ensureInit();
    await fs.unlink(resolveSafeLocalPath(userRelPath, this.rootDir));
  }

  /**
   * Delete a directory and all its contents at the given relative path.
   * @param userRelPath User-provided relative folder path (using / as separator)
   * @throws If path is outside root, not a directory, or is a file
   */
  async deleteDirectory(userRelPath: string): Promise<void> {
    await this.ensureInit();
    const absPath = resolveSafeLocalPath(userRelPath, this.rootDir);
    const stat = await fs.stat(absPath);
    if (!stat.isDirectory()) {
      throw new Error(`${userRelPath} is not a directory`);
    }
    await fs.rm(absPath, { recursive: true, force: true });
  }

  /**
   * Write data to a file at the given relative path, creating or overwriting.
   * Auto-creates parent directories before writing.
   * @param userRelPath User-provided relative file path (using / as separator)
   * @param data Data to write (Buffer or string)
   * @throws If path is outside root
   */
  async writeFile(userRelPath: string, data: Buffer | string): Promise<void> {
    await this.ensureInit();
    const absPath = resolveSafeLocalPath(userRelPath, this.rootDir);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    // If data is a string, treat as base64, decode before writing
    // Auto-strip potential Data URL prefix (e.g. "data:image/png;base64,")
    const buffer = typeof data === "string" ? Buffer.from(data.replace(/^data:[^;]+;base64,/, ""), "base64") : data;
    await fs.writeFile(absPath, buffer);
  }

  /**
   * Check if a file exists at the given relative path.
   * @param userRelPath User-provided relative file path (using / as separator)
   * @returns true if file exists, false otherwise
   */
  async fileExists(userRelPath: string): Promise<boolean> {
    await this.ensureInit();
    try {
      const stat = await fs.stat(resolveSafeLocalPath(userRelPath, this.rootDir));
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Get thumbnail URL for an image (max dimension 512px, proportional scaling).
   * Thumbnail is saved in the smallImage subdirectory next to the original.
   * If thumbnail exists, return its URL; otherwise generate and save synchronously.
   * Returns original image URL if generation fails.
   * @param userRelPath User-provided relative file path (using / as separator)
   * @returns Thumbnail URL (existing or newly generated) or original URL on failure
   */
  async getSmallImageUrl(userRelPath: string): Promise<string> {
    // Construct thumbnail relative path: insert smallImage before original path
    // e.g.: 123/abc.jpg => smallImage/123/abc.jpg
    const smallImageRelPath = `smallImage/${userRelPath.replace(/^[/\\]+/, "")}`;

    if (await this.fileExists(smallImageRelPath)) {
      return this.getFileUrl(smallImageRelPath);
    }

    // Thumbnail doesn't exist: generate synchronously, fallback to original on failure
    const originalUrl = await this.getFileUrl(userRelPath);

    try {
      await this.ensureInit();
      const srcAbsPath = resolveSafeLocalPath(userRelPath, this.rootDir);
      const dstAbsPath = resolveSafeLocalPath(smallImageRelPath, this.rootDir);
      await fs.mkdir(path.dirname(dstAbsPath), { recursive: true });
      await sharp(srcAbsPath)
        .resize(512, 512, { fit: "inside", withoutEnlargement: true })
        .toFile(dstAbsPath);
      console.info(`[${dstAbsPath}] thumbnail written successfully`);
      return this.getFileUrl(smallImageRelPath);
    } catch (e) {
      // On failure return original
      console.warn("[OSS] thumbnail generation failed:", e);
      return originalUrl;
    }
  }
}

export default new OSS();
