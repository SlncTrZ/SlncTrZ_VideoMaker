/**
 * TTS Test — Test OmniVoice TTS with text + profile selection.
 * Wing: code_chronicles | Topic: tts_test | Updated: 2026-06-02
 */

import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    modelName: z.string(),
    id: z.string(),
    text: z.string().min(1, "Text is required"),
    voice: z.string().optional(),
    speechRate: z.number().min(0.25).max(4).optional(),
  }),
  async (req, res) => {
    const { modelName, id, text, voice, speechRate } = req.body;

    try {
      const vendorConfigData = await u.db("o_vendorConfig").where("id", id).first();
      if (!vendorConfigData) return res.status(500).send(error("Vendor config not found"));

      const reqFn = await u.Ai.Audio(`${id}:${modelName}`).run({
        text,
        prompt: text,
        voice: voice || "default",
        speechRate: speechRate || 1.0,
        pitchRate: 1.0,
        volume: 1.0,
      } as any);

      if (!reqFn) return res.status(500).send(error("TTS generation returned no result"));

      await reqFn.save("test-tts.wav");
      const resultUrl = await u.oss.getFileUrl("test-tts.wav");
      res.status(200).send(success(resultUrl));
    } catch (err) {
      console.error(err);
      const msg = u.error(err).message;
      console.error(msg);
      res.status(500).send(error(msg));
    }
  },
);
