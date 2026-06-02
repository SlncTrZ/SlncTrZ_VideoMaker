import express from "express";
import u from "@/utils";
import { error, success } from "@/lib/responseFormat";
import fs from "fs";
import path from "path";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
const router = express.Router();

// Add visual manual
export default router.post(
  "/",
  validateFields({
    name: z.string(),
    images: z.array(z.string()),
    stylePath: z.string(),
    data: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
        data: z.string(),
      }),
    ),
  }),
  async (req, res) => {
    try {
      const { name, images, data, stylePath } = req.body as {
        name: string;
        images: string[];
        data: { label: string; value: string; data: string }[];
        stylePath: string;
      };

      // Security check: disallow path separators or pure numbers to prevent directory traversal or accidental project deletion
      if (name.includes("/") || name.includes("\\") || name === "." || name === ".." || /^\d+$/.test(name)) {
        res.status(400).send(error("Name cannot contain path separators or be purely numeric"));
        return;
      }
      const mainPath = u.getPath(["skills", "art_skills", stylePath]);
      if (fs.existsSync(mainPath)) {
        return res.status(400).send(error("Visual manual with this name already exists"));
      }
      // Field mapping table (consistent with getVisualManual)
      const DATA_MAP: { value: string; subDir?: string }[] = [
        { value: "README" },
        { value: "prefix" },
        { value: "art_character", subDir: "art_prompt" },
        { value: "art_character_derivative", subDir: "art_prompt" },
        { value: "art_prop", subDir: "art_prompt" },
        { value: "art_prop_derivative", subDir: "art_prompt" },
        { value: "art_scene", subDir: "art_prompt" },
        { value: "art_scene_derivative", subDir: "art_prompt" },
        { value: "director_storyboard", subDir: "driector_skills" },
        { value: "art_storyboard_video", subDir: "art_prompt" },
        { value: "director_planning_style", subDir: "driector_skills" },
        { value: "director_storyboard_table_style", subDir: "driector_skills" },
      ];

      // Build value -> subDir mapping from DATA_MAP
      const SUB_DIR_MAP = new Map(DATA_MAP.map(({ value, subDir }) => [value, subDir ?? ""]));

      // Valid value set for validation
      const VALID_KEYS = new Set(DATA_MAP.map(({ value }) => value));

      for (const item of data) {
        if (!VALID_KEYS.has(item.value)) continue;

        const subDir = SUB_DIR_MAP.get(item.value)!;
        const dirArr = subDir ? [mainPath, subDir] : [mainPath];
        const filePath = u.getPath([...dirArr, `${item.value}.md`]);

        const fileDir = path.dirname(filePath);
        // Recursively create directory if it doesn't exist
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        fs.writeFileSync(filePath, item.data, "utf-8");
      }
      const imagesDir = path.join(mainPath, "images");

      let existingFiles: string[] = [];
      try {
        const allFiles = fs.readdirSync(imagesDir);
        existingFiles = allFiles.filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f));
      } catch {}

      const retainedFileNames = new Set(images.filter((item) => item.startsWith("http")).map((url) => path.basename(new URL(url).pathname)));

      for (const file of existingFiles) {
        if (!retainedFileNames.has(file)) {
          const filePath = path.join(imagesDir, file);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }

      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      for (const item of images) {
        if (!item.startsWith("http")) {
          const fileName = `${u.uuid()}.jpg`;
          const targetPath = path.join(imagesDir, fileName);
          const buffer = Buffer.from(item.replace(/^data:[^;]+;base64,/, ""), "base64");
          fs.writeFileSync(targetPath, buffer);
        }
      }

      res.status(200).send(success());
    } catch (err) {
      res.status(500).send({ error: String(err) });
    }
  },
);
