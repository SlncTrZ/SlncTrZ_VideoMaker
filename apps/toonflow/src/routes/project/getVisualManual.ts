import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import fs from "fs";
import path from "path";
const router = express.Router();

// Field mapping table
const DATA_MAP: { label: string; value: string; subDir?: string }[] = [
  { label: "README", value: "README" },
  { label: "Prefix", value: "prefix" },
  { label: "Character", value: "art_character", subDir: "art_prompt" },
  { label: "Character Derivative", value: "art_character_derivative", subDir: "art_prompt" },
  { label: "Prop", value: "art_prop", subDir: "art_prompt" },
  { label: "Prop Derivative", value: "art_prop_derivative", subDir: "art_prompt" },
  { label: "Scene", value: "art_scene", subDir: "art_prompt" },
  { label: "Scene Derivative", value: "art_scene_derivative", subDir: "art_prompt" },
  { label: "Storyboard", value: "director_storyboard", subDir: "driector_skills" },
  { label: "Storyboard Video", value: "art_storyboard_video", subDir: "art_prompt" },
  { label: "Technique-Director Planning", value: "director_planning_style", subDir: "driector_skills" },
  { label: "Technique-Storyboard Table Design", value: "director_storyboard_table_style", subDir: "driector_skills" },
];

// Read md file content, return empty string if file does not exist
function readMd(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

// Get all image file paths under the images folder
async function readAllImages(imagesDir: string) {
  try {
    const ossPath = u.getPath(path.join("skills", "art_skills", imagesDir, "images"));
    const files = fs.readdirSync(ossPath);
    const images = files.filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f)).map((f) => path.join("art_skills", imagesDir, "images", f));
    if (images.length) {
      return Promise.all(images.map(async (i) => await u.oss.getFileUrl(i, "skills")));
    } else {
      return [];
    }
  } catch {
    return [];
  }
}

// Get visual manual
export default router.post("/", async (req, res) => {
  try {
    const artPromptsDir = u.getPath(["skills", "art_skills"]);

    // Read all style directories
    const styleDirs = fs
      .readdirSync(artPromptsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const result = await Promise.all(
      styleDirs.map(async (styleName) => {
        const styleDir = path.join(artPromptsDir, styleName);
        const images = await readAllImages(styleName);
        const readmePath = path.join(styleDir, "README.md");
        const readmeContent = fs.readFileSync(readmePath, "utf-8");
        const firstLine = readmeContent.split("\n")[0].replace(/--/g, "");
        const data = DATA_MAP.map(({ label, value, subDir }) => {
          let mdPath: string;
          if (subDir) {
            mdPath = path.join(styleDir, subDir, `${value}.md`);
          } else {
            mdPath = path.join(styleDir, `${value}.md`);
          }
          return {
            label,
            value,
            data: readMd(mdPath),
          };
        });

        return {
          name: firstLine,
          image: images,
          stylePath: styleName,
          data,
        };
      }),
    );
    res.status(200).send(success(result));
  } catch (err) {
    res.status(500).send({ error: String(err) });
  }
});
