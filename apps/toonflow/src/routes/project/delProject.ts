import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// Delete project
export default router.post(
  "/",
  validateFields({
    id: z.number(),
  }),
  async (req, res) => {
    const { id } = req.body;
    // Delete project
    await u.db("o_project").where("id", id).delete();
    await u.db("o_agentWorkData").where("projectId", id).delete();
    // Delete novels under project
    await u.db("o_novel").where("projectId", id).delete();
    // Delete scripts under project
    const scriptData = await u.db("o_script").where("projectId", id).select("id");
    const scriptIds = scriptData.map((item: any) => item.id);
    if (scriptIds.length > 0) {
      await u.db("o_scriptAssets").whereIn("scriptId", scriptIds).delete();
    }
    await u.db("o_script").where("projectId", id).delete();
    // Delete tasks under project
    await u.db("o_tasks").where("projectId", id).delete();
    // Delete storyboards under project
    const storyboardData = await u.db("o_storyboard").where("projectId", id).select("id");
    const storyboardIds = storyboardData.map((item: any) => item.id);
    if (storyboardIds.length > 0) {
      await u.db("o_assets2Storyboard").whereIn("storyboardId", storyboardIds).delete();
    }
    await u.db("o_storyboard").where("projectId", id).delete();
    // Delete asset-related images
    const assetsData = await u.db("o_assets").where("projectId", id).select("id");
    const assetsIds = assetsData.map((item: any) => item.id);
    if (assetsIds.length > 0) {
      // Set o_assets.imageId to null first to remove foreign key constraint to o_image
      await u.db("o_assets").whereIn("id", assetsIds).update({ imageId: null });
      await u.db("o_image").whereIn("assetsId", assetsIds).delete();
    }
    // Delete assets under project
    await u.db("o_assets").where("projectId", id).delete();
    // Delete video tracks and videos under project
    await u.db("o_videoTrack").where("projectId", id).delete();
    await u.db("o_video").where("projectId", id).delete();
    // Delete resources under project

    await u.db("memories").where("isolationKey", "like", `${id}:%`).delete();

    try {
      await u.oss.deleteDirectory(`${id}/`);
      console.log(`Project ${id} OSS folder deleted successfully`);
    } catch (error: any) {
      console.log(`Project ${id} has no OSS folder, skipping deletion`);
    }

    res.status(200).send(success({ message: "Project deleted successfully" }));
  },
);
