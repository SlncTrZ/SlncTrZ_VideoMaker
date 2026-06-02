import express from "express";
import u from "@/utils";
import { z } from "zod";
import sharp from "sharp";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    storyboardIds: z.array(z.number()),
  }),
  async (req, res) => {
    const { storyboardIds } = req.body;
    const storyboardImage = await u.db("o_storyboard").whereIn("id", storyboardIds).select("id", "filePath");

    // Build filePath mapping in storyboardIds order
    const filePathMap: Record<number, string> = {};
    storyboardImage.forEach((i) => {
      filePathMap[i.id!] = i.filePath || "";
    });
    const orderedFilePaths = storyboardIds.map((id: number) => filePathMap[id]);

    // Read all image buffers and get metadata
    const loaded = await Promise.all(
      orderedFilePaths.map(async (filePath: string) => {
        if (!filePath) return null;
        const buffer = await u.oss.getFile(filePath);
        const metadata = await sharp(buffer).metadata();
        return { buffer, width: metadata.width || 0, height: metadata.height || 0 };
      }),
    );

    // Filter out invalid images
    const validImages = loaded.filter((img): img is NonNullable<typeof img> => img !== null && img.width > 0 && img.height > 0);
    if (validImages.length === 0) {
      return res.status(200).send(success(null));
    }

    // Scale each image to a reasonable size, max width 512px
    const maxThumbWidth = 512;
    const resizedImages = await Promise.all(
      validImages.map(async (img) => {
        if (img.width <= maxThumbWidth) {
          return img;
        }
        const scale = maxThumbWidth / img.width;
        const newWidth = maxThumbWidth;
        const newHeight = Math.round(img.height * scale);
        const buffer = await sharp(img.buffer).resize(newWidth, newHeight).toBuffer();
        return { buffer, width: newWidth, height: newHeight };
      }),
    );

    // Calculate grid layout
    const cols = Math.min(5, resizedImages.length);
    const rows = Math.ceil(resizedImages.length / cols);

    const colWidths: number[] = Array(cols).fill(0);
    const rowHeights: number[] = Array(rows).fill(0);
    resizedImages.forEach((img, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      colWidths[c] = Math.max(colWidths[c], img.width);
      rowHeights[r] = Math.max(rowHeights[r], img.height);
    });

    const canvasWidth = colWidths.reduce((a, b) => a + b, 0);
    const canvasHeight = rowHeights.reduce((a, b) => a + b, 0);

    // Generate composite layer with labels for each image
    const compositeInputs: sharp.OverlayOptions[] = [];

    for (let i = 0; i < resizedImages.length; i++) {
      const img = resizedImages[i];
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = colWidths.slice(0, c).reduce((a, b) => a + b, 0);
      const y = rowHeights.slice(0, r).reduce((a, b) => a + b, 0);

      // Add image layer
      compositeInputs.push({
        input: img.buffer,
        left: x,
        top: y,
      });

      // Generate label SVG
      const label = `S${String(i + 1).padStart(2, "0")}`;
      const fontSize = Math.max(14, Math.min(img.width, img.height) * 0.06);
      const padding = Math.round(fontSize * 0.4);
      // Estimate text width (monospace approximation)
      const textWidth = Math.round(label.length * fontSize * 0.65);
      const bgW = textWidth + padding * 2;
      const bgH = Math.round(fontSize) + padding * 2;

      const labelSvg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${bgW}" height="${bgH}">
          <rect x="0" y="0" width="${bgW}" height="${bgH}" rx="4" ry="4" fill="rgba(0,0,0,0.55)"/>
          <text x="${padding}" y="${padding + fontSize * 0.85}" font-family="Arial, sans-serif" font-weight="bold" font-size="${fontSize}" fill="#fff">${label}</text>
        </svg>`,
      );

      compositeInputs.push({
        input: labelSvg,
        left: x + 4,
        top: y + 4,
      });
    }

    // Create and composite canvas using sharp
    const resultBuffer = await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite(compositeInputs)
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64 = resultBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return res.status(200).send(success(dataUrl));
  },
);
