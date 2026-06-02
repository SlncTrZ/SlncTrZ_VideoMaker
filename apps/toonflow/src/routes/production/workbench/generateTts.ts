import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number(),
    characterId: z.number().optional(),
    text: z.string(),
    voice: z.string(),
    speechRate: z.number().optional(),
    pitchRate: z.number().optional(),
    volume: z.number().optional(),
    model: z.string(),
  }),
  async (req, res) => {
    const { projectId, scriptId, characterId, text, voice, speechRate, pitchRate, volume, model } = req.body;

    const audioPath = `/${projectId}/audio/${uuidv4()}.mp3`;

    const [audioId] = await u.db("o_video").insert({
      filePath: audioPath,
      time: Date.now(),
      state: "generating",
      scriptId,
      projectId,
    });

    res.status(200).send(success(audioId));

    const aiAudio = u.Ai.Audio(model);
    aiAudio
      .run(
        {
          text,
          voice,
          speechRate: speechRate ?? 1.0,
          pitchRate: pitchRate ?? 1.0,
          volume: volume ?? 1.0,
        },
        {
          projectId,
          taskClass: "tts_generation",
          describe: `Generate TTS for character ${characterId ?? "unknown"}`,
          relatedObjects: JSON.stringify({ projectId, audioId, scriptId, characterId, type: "audio" }),
        },
      )
      .then(async () => await aiAudio.save(audioPath))
      .then(async () => await u.db("o_video").where("id", audioId).update({ state: "generation_successful" }))
      .catch(async (err: any) => {
        await u.db("o_video").where("id", audioId).update({
          state: "generation_failed",
          errorReason: u.error(err).message,
        });
      });
  },
);
