import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    images: z.array(z.string()),
  }),
  async (req, res) => {
    const { images } = req.body;
    try {
      const resText = await u.Ai.Text("universalAi").invoke({
        system:
          'Based on the following image data, extract the art style prompt for specifying style during image generation. Be concise and artistic. Only the style prompt is needed, nothing else. For example: `(Style: 2D anime style,2d animation style)`, `(Style: photorealistic, lifelike, ultra detailed)`, `(Style: 3D Chinese animation,Chinese 3D animation style)`. If the image style cannot be described, return `unable to describe`. For multiple images, output only one comprehensive style prompt that includes the common stylistic features of all images. The output format must strictly follow the examples: enclosed in parentheses, containing both source language and English style descriptions separated by commas. The English part should be translated into idiomatic English prompt words.',
        messages: [
          {
            role: "user",
            content: [
              ...images.map((image: string) => ({
                type: "image" as const,
                image,
              })),
            ],
          },
        ],
      });
      res.status(200).send(success(resText.text));
    } catch (e) {
      const err = u.error(e);
      res.status(500).send({ message: err.message });
    }
  },
);
