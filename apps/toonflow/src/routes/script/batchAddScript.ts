import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// Batch add scripts
export default router.post(
  "/",
  validateFields({
    data: z.array(
      z.object({
        scriptName: z.string(),
        scriptData: z.string(),
      }),
    ),
    projectId: z.number(),
  }),
  async (req, res) => {
    const { data, projectId } = req.body;
    await u.db("o_script").insert(
      data.map((i: { scriptName: string; scriptData: string }) => {
        return {
          name: i.scriptName,
          content: i.scriptData,
          projectId,
          createTime: Date.now(),
        };
      }),
    );

    res.status(200).send(success({ message: "Scripts added successfully" }));
  },
);
