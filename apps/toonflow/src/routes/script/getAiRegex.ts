import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    content: z.string(),
  }),
  async (req, res) => {
    const { content } = req.body;
    const systemPrompt = `You are a regex expert. The user will provide script text, and you need to analyze the episode/chapter separation pattern, then return a JavaScript regex string.

Requirements:
1. The regex must include two capture groups: the first matches the episode/chapter number (digits or Chinese numerals), the second matches the episode title/name (scriptName).
2. Return format: /regex/g, for example: /Episode\s*([0-9]+)\s*:\s*([^\n\r]*)/g
3. Only return the regex string itself, no explanations or markdown formatting.
4. If there is no obvious chapter separation pattern in the text, return an empty string.`;

    const resText = await u.Ai.Text("universalAi").invoke({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: content.slice(0, 2000),
        },
      ],
    });
    const result = (resText.text || "").trim();
    res.status(200).send(success(result));
  },
);
