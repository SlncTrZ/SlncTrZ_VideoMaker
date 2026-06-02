import express from "express";
import u from "@/utils";
import fs from "node:fs/promises";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// Delete director manual
export default router.post(
  "/",
  validateFields({
    name: z.string(),
  }),
  async (req, res) => {
    try {
      const { name } = req.body as { name: string };

      // Security check: disallow path separators or pure numbers to prevent directory traversal or accidental project deletion
      if (name.includes("/") || name.includes("\\") || name === "." || name === ".." || /^\d+$/.test(name)) {
        res.status(400).send(error("Name cannot contain path separators or be purely numeric"));
        return;
      }

      const artPromptsDir = u.getPath(["skills", "story_skills", name]);

      try {
        const stat = await fs.stat(artPromptsDir);
        if (!stat.isDirectory()) {
          throw new Error(`${artPromptsDir} is not a directory`);
        }
        await fs.rm(artPromptsDir, { recursive: true, force: true });
      } catch (e) {
        console.error("[DeleteVisualManual] Delete failed:", artPromptsDir, e);
      }
      res.status(200).send(success({ message: "Delete successful" }));
    } catch (err) {
      res.status(500).send(error(u.error(err).message || "Delete failed"));
    }
  },
);
