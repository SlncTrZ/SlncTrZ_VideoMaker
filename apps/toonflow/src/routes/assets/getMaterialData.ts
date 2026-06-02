import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// Get material data
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number().optional(),
  }),
  async (req, res) => {
    const { projectId, scriptId } = req.body;
    const list = await u
      .db("o_assets")
      .leftJoin("o_image", "o_assets.id", "=", "o_image.assetsId")
      .where("o_assets.type", "clip")
      .andWhere("o_assets.projectId", projectId)
      .select("*");
    const data = await Promise.all(
      list.map(async (item) => ({
        ...item,
        filePath: item.filePath ? await u.oss.getFileUrl(item.filePath) : "",
      })),
    );
    // Get local ending video and insert into data
    const ending = await u.oss.getFileUrl("/ending.mp4", "assets");
    data.push({
      id: 0,
      name: "Toonflow Ending",
      filePath: ending,
      type: "clip",
    });
    // Query video tracks
    const trackRows = await u
      .db("o_videoTrack")
      .where("o_videoTrack.scriptId", scriptId)
      .andWhere("o_videoTrack.projectId", projectId)
      .select("o_videoTrack.id as trackId","o_videoTrack.videoId");
    // Process videos grouped by track
    const video = await Promise.all(
      trackRows.map(async (track) => {
        const videoItems = await u.db("o_video").where("o_video.videoTrackId", track.trackId).andWhere("o_video.state", "generated_successfully").select("*");
        const videoList = await Promise.all(
          videoItems.map(async (v) => ({
            id: v.id,
            filePath: v.filePath ? await u.oss.getFileUrl(v.filePath) : "",
            videoTrackId: v.videoTrackId,
          })),
        );
        return {
          id: track.trackId,
          videoId: track.videoId,
          video: videoList,
        };
      }),
    ).then((tracks) => tracks.filter((track) => track.video.length > 0));

    res.status(200).send(success({ data, video }));
  },
);
