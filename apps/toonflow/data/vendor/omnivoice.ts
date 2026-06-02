/**
 * Toonflow Vendor — OmniVoice (local TTS server)
 * Local text-to-speech via omnivoice-server (k2-fsa/OmniVoice)
 * @version 1.1
 *
 * Usage:
 *   1. Start server: omnivoice-server --device cuda --port 8880
 *   2. Configure bridgeUrl in Toonflow vendor settings
 *   3. Use profile_ids for character voices (like ElevenLabs multi-model)
 *
 * API: POST /v1/tts
 * Body: { "text": "...", "profile_ids": "name1,name2" }
 */

type VideoMode =
  | "singleImage"
  | "startEndRequired"
  | "endFrameOptional"
  | "startFrameOptional"
  | "text"
  | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[];

interface TextModel {
  name: string;
  modelName: string;
  type: "text";
  think: boolean;
}

interface ImageModel {
  name: string;
  modelName: string;
  type: "image";
  mode: ("text" | "singleImage" | "multiReference")[];
}

interface VideoModel {
  name: string;
  modelName: string;
  type: "video";
  mode: VideoMode[];
  associationSkills?: string;
  audio: "optional" | false | true;
  durationResolutionMap: { duration: number[]; resolution: string[] }[];
}

interface TTSModel {
  name: string;
  modelName: string;
  type: "tts";
  voices: { title: string; voice: string }[];
}

interface VendorConfig {
  id: string;
  version: string;
  name: string;
  author: string;
  description?: string;
  icon?: string;
  inputs: { key: string; label: string; type: "text" | "password" | "url"; required: boolean; placeholder?: string }[];
  inputValues: Record<string, string>;
  models: (TextModel | ImageModel | VideoModel | TTSModel)[];
}

interface TTSConfig {
  text: string;
  voice: string;
  speechRate: number;
  pitchRate: number;
  volume: number;
  referenceList?: { type: "audio"; sourceType: "base64"; base64: string }[];
}

declare const axios: any;
declare const logger: (msg: string) => void;

const vendor: VendorConfig = {
  id: "omnivoice",
  version: "1.1",
  name: "OmniVoice (Local TTS)",
  author: "MeiLin",
  description: "Local TTS via omnivoice-server. POST /v1/tts with profile_ids for character voices (like ElevenLabs multi-model). Start: omnivoice-server --device cuda --port 8880",
  icon: "🎙️",
  inputs: [
    { key: "bridgeUrl", label: "OmniVoice Server URL", type: "url", required: true, placeholder: "http://127.0.0.1:8880" },
    { key: "profileIds", label: "Profile IDs (comma-separated)", type: "text", required: false, placeholder: "e.g. alloy,onyx,nova or leave blank for default" },
  ],
  inputValues: {
    bridgeUrl: "http://127.0.0.1:8880",
    profileIds: "",
  },
  models: [
    {
      name: "OmniVoice TTS",
      modelName: "omnivoice/tts",
      type: "tts",
      voices: [
        { title: "Default", voice: "default" },
        { title: "Custom Profile 1", voice: "profile_1" },
        { title: "Custom Profile 2", voice: "profile_2" },
        { title: "Custom Profile 3", voice: "profile_3" },
        { title: "Custom Profile 4", voice: "profile_4" },
        { title: "Custom Profile 5", voice: "profile_5" },
      ],
    },
  ],
};

const getBaseUrl = () => vendor.inputValues.bridgeUrl.replace(/\/+$/, "");

function textRequest(): any {
  throw new Error("OmniVoice vendor does not support text generation");
}

function imageRequest(): Promise<string> {
  throw new Error("OmniVoice vendor does not support image generation");
}

function videoRequest(): Promise<string> {
  throw new Error("OmniVoice vendor does not support video generation");
}

async function ttsRequest(config: TTSConfig, model: TTSModel): Promise<string> {
  const baseUrl = getBaseUrl();
  const savedProfileIds = vendor.inputValues.profileIds?.trim();

  // Resolve profile_ids: use config.voice if provided, else saved profiles, else empty
  let profileIds = "";
  if (config.voice && config.voice !== "default") {
    profileIds = config.voice;
  } else if (savedProfileIds) {
    profileIds = savedProfileIds;
  }

  // Build request body
  const body: Record<string, any> = {
    text: config.text || "",
  };
  if (profileIds) {
    body.profile_ids = profileIds;
  }

  logger(`[OmniVoice] TTS: text="${config.text?.substring(0, 40)}...", profile_ids="${profileIds}"`);

  const response = await axios.post(`${baseUrl}/v1/tts`, body, {
    headers: { "Content-Type": "application/json" },
    responseType: "arraybuffer",
    timeout: 60000,
  });

  // Convert binary audio to base64
  const audioBase64 = Buffer.from(response.data).toString("base64");
  const mimeType = response.headers["content-type"] || "audio/wav";

  return `data:${mimeType};base64,${audioBase64}`;
}

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
