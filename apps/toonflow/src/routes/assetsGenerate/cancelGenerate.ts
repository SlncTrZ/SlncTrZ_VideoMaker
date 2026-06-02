import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// Cancel generation
export default router.post(
  "/",
  validateFields({
    id: z.number(),
  }),
  async (req, res) => {
    const { id } = req.body;
    await u.db("o_image").where("id", id).update({
      state: "generation_failed",
    });
    res.status(200).send(success({ message: "Cancelled successfully" }));
  },
);
