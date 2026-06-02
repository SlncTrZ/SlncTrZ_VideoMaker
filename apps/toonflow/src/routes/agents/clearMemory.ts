import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    episodesId: z.number().optional(),
    agentType: z.enum(["scriptAgent", "productionAgent"]),
    type: z.enum(["message", "summary", "all"]).optional(),
  }),
  async (req, res) => {
    const { projectId, episodesId,agentType, type = "all" } = req.body;
    const isolationKey = `${projectId}:${agentType}${episodesId ? `:${episodesId}` : ""}`;

    if (type === "all") {
      await u.db("memories").where({ isolationKey }).del();
    } else if (type === "message") {
      // When deleting message, also delete associated summary to avoid dangling references
      await u.db("memories").where({ isolationKey, type: "message" }).del();
      await u.db("memories").where({ isolationKey, type: "summary" }).del();
    } else {
      // When deleting summary, reset associated messages to unsummarized so they re-enter shortTerm
      await u
        .db("memories")
        .where({ isolationKey, type: "message", summarized: 1 })
        .update({ summarized: 0 });
      await u.db("memories").where({ isolationKey, type: "summary" }).del();
    }

    res.status(200).send(success(null));
  },
);
