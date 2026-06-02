import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { transform } from "sucrase";
const router = express.Router();

const vendorConfigSchema = z.object({
  id: z.string(),
  author: z.string(),
  description: z.string().optional(),
  name: z.string(),
  icon: z.string().optional(),
  inputs: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(["text", "password", "url"]),
      required: z.boolean(),
      placeholder: z.string().optional(),
    }),
  ),
  inputValues: z.record(z.string(), z.string()),
  models: z.array(
    z.discriminatedUnion("type", [
      z.object({
        name: z.string(),
        modelName: z.string(),
        type: z.literal("text"),
        think: z.boolean(),
      }),
      z.object({
        name: z.string(),
        modelName: z.string(),
        type: z.literal("image"),
        mode: z.array(z.enum(["text", "singleImage", "multiReference"])),
      }),
      z.object({
        name: z.string(),
        modelName: z.string(),
        type: z.literal("video"),
        mode: z.array(
          z.union([
            z.enum(["singleImage", "startEndRequired", "endFrameOptional", "startFrameOptional", "text", "audioReference", "videoReference"]),
            z.array(z.string().regex(/^(videoReference|imageReference|audioReference):\d+$/)),
          ]),
        ),
        audio: z.union([z.literal("optional"), z.boolean()]),
        durationResolutionMap: z.array(
          z.object({
            duration: z.array(z.number()),
            resolution: z.array(z.string()),
          }),
        ),
      }),
    ]),
  ),
});

export default router.post(
  "/",
  validateFields({
    tsCode: z.string(),
  }),
  async (req, res) => {
    const { tsCode } = req.body;
    const jsCode = transform(tsCode, { transforms: ["typescript"] }).code;
    const exports = u.vm(jsCode);
    if (!exports) return res.status(400).send(success("Script file must export an object"));
    if (!exports.textRequest) return res.status(400).send(success("Script file must export a text request object"));
    if (!exports.imageRequest) return res.status(400).send(success("Script file must export an image request object"));
    if (!exports.videoRequest) return res.status(400).send(success("Script file must export a video request object"));
    if (!exports.vendor) return res.status(400).send(success("Script file must export a vendor object"));
    const vendor = exports.vendor;
    const result = vendorConfigSchema.safeParse(vendor);
    if (!result.success) {
      const issueLines = result.error.issues.map((issue, index) => {
        const path = issue.path.length ? issue.path.join(".") : "root";
        let detail = issue.message;

        if (issue.code === "invalid_union") {
          const unionDetails = [
            ...new Set(
              issue.errors
                .flat()
                .map((e) => e.message)
                .filter(Boolean),
            ),
          ];
          if (unionDetails.length > 0) {
            detail = `${issue.message} (${unionDetails.join("; ")})`;
          }
        }
        return `${index + 1}. ${path}: ${detail}`;
      });

      return res.status(400).send(error(`Vendor config validation failed, ${issueLines.length} issues:\n${issueLines.join("\n")}`));
    }

    if ((vendor.id as string).includes(":")) return res.status(400).send(error("id cannot contain colon"));
    const data = await u.db("o_vendorConfig").where("id", vendor.id).first();
    if (data) return res.status(500).send(error("Vendor id already exists"));
    const [id] = await u.db("o_vendorConfig").insert({
      id: vendor.id,
      inputValues: JSON.stringify(vendor.inputValues ?? {}),
      models: JSON.stringify([]),
      enable: vendor.id == "toonflow" ? 1 : 0,
    });
    u.vendor.writeCode(vendor.id, tsCode);
    res.status(200).send(success(result.data));
  },
);
