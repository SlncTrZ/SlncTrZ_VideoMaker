/**
 * Bridge — Express WS + HTTP router for Chrome Extension communication.
 * Wing: code_chronicles | Topic: ws_bridge_embed | Updated: 2026-06-02
 */

import { Router, Request, Response } from "express";
import {
  setExtension,
  getExtension,
  onResultReceived,
  pushCommand,
  getResult,
  getLatestResult,
  getQueueLength,
  BridgeCommand,
} from "./queue";

const router = Router();

export function setupWebSocket(ws: any): void {
  console.log("[Bridge] Extension connected via WS");
  setExtension(ws);

  ws.on("message", (data: any) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log("[Bridge] From extension:", msg.action, msg.id || "");

      if (msg.action === "pong") return;
      if (msg.action === "result") {
        onResultReceived(msg);
      }
    } catch (e: any) {
      console.error("[Bridge] Invalid message:", e.message);
    }
  });

  ws.on("close", () => {
    console.log("[Bridge] Extension disconnected");
    setExtension(null);
  });

  ws.on("error", (err: Error) => {
    console.error("[Bridge] WebSocket error:", err.message);
  });
}

router.post("/", (req: Request, res: Response) => {
  try {
    const cmd: BridgeCommand = req.body;
    console.log(`[Bridge] Queued: ${cmd.action} id=${cmd.id || "?"}`);

    if (!getExtension()) {
      res.status(503).json({ error: "Extension not connected" });
      return;
    }

    pushCommand(cmd);
    res.json({ status: "queued", id: cmd.id });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/result/:id", (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.json(getResult(id));
});

router.get("/result", (_req: Request, res: Response) => {
  res.json(getLatestResult());
});

router.get("/status", (_req: Request, res: Response) => {
  res.json({
    extensionConnected: !!getExtension(),
    queueLength: getQueueLength(),
  });
});

export default router;
