import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// Get assets
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
    let query = u
      .db("o_assets")
      .leftJoin("o_image", "o_assets.imageId", "o_image.id")
      .select("o_assets.*", "o_image.filePath", "o_image.state")
      .where("o_assets.projectId", projectId)
      .andWhere("o_assets.type", type);
    if (name) {
      query = query.andWhere("name", "like", `%${name}%`);
    }
    // Paginated query
    const parentAssets = await query.where("o_assets.assetsId", null).offset(offset).limit(limit);

    // Get all child assets for association
    let childQuery = u
      .db("o_assets")
      .leftJoin("o_image", "o_assets.imageId", "o_image.id")
      .select("o_assets.*", "o_image.filePath", "o_image.state", "o_image.errorReason")
      .where("o_assets.projectId", projectId)
      .andWhere("o_assets.type", type)
      .whereNotNull("o_assets.assetsId");
    if (name) {
      childQuery = childQuery.andWhere("o_assets.name", "like", `%${name}%`);
    }
    const childAssets = await childQuery;

    // Add image URL for each child asset
    const childAssetsWithSrc = await Promise.all(
      childAssets.map(async (child) => ({
        ...child,
        src: child.filePath && (await filterTypeGetFileUrl(child.filePath!, child.type)),
      })),
    );

    // Add child assets to each parent asset
    const result = await Promise.all(
      parentAssets.map(async (parent) => ({
        ...parent,
        sonAssets: childAssetsWithSrc.filter((child) => child.assetsId === parent.id),
        src: parent.filePath && (await filterTypeGetFileUrl(parent.filePath!, parent.type)),
        ...(parent.type == "audio" ? { sex: parent.describe?.split("|")[0], describe: parent.describe?.split("|")[1] } : {}),
      })),
    );

    // Count total
    const totalQuery = (await u
      .db("o_assets")
      .where("projectId", projectId)
      .andWhere("type", type)
      .andWhere("assetsId", null)
      .andWhere((qb) => {
        if (name) {
          qb.andWhere("name", "like", `%${name}%`);
        }
      })
      .count("* as total")
      .first()) as any;
    res.status(200).send(success({ data: result, total: totalQuery?.total }));
  },
);

async function filterTypeGetFileUrl(url: string, type: string) {
  if (type == 'role' || type == 'tool' || type == 'scene') {
    return await u.oss.getSmallImageUrl(url)
  } else {
    return await u.oss.getFileUrl(url)
  }
}