import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// Get batch generation data
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    type: z.string(),
    name: z.string().optional(),
    page: z.number(),
    limit: z.number(),
  }),
  async (req, res) => {
    const { projectId, type, name, page = 1, limit = 10 } = req.body;
    const offset = (page - 1) * limit;
    let query = u.db("o_assets").select("*").where("projectId", projectId).andWhere("type", type);
    if (name) {
      query = query.andWhere("name", "like", `%${name}%`);
    }
    // Paginated query
    const parentAssets = await query.offset(offset).limit(limit);

    // Count total
    const totalQuery = (await u
      .db("o_assets")
      .where("projectId", projectId)
      .andWhere("type", type)
      .andWhere((qb) => {
        if (name) {
          qb.andWhere("name", "like", `%${name}%`);
        }
      })
      .count("* as total")
      .first()) as any;
    res.status(200).send(success({ data: parentAssets, total: totalQuery?.total }));
  },
);
