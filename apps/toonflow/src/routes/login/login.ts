import express from "express";
import u from "@/utils";
import jwt from "jsonwebtoken";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
const router = express.Router();

export function setToken(payload: string | object, expiresIn: string | number, secret: string): string {
  if (!payload || typeof secret !== "string" || !secret) {
    throw new Error("Invalid parameters");
  }
  return (jwt.sign as any)(payload, secret, { expiresIn });
}

// Login
export default router.post(
  "/",
  validateFields({
    username: z.string(),
    password: z.string(),
  }),
  async (req, res) => {
    const { username, password } = req.body;

    const data = await u.db("o_user").where("name", "=", username).first();
    if (!data) return res.status(400).send(error("Login failed"));

    if (data!.password == password && data!.name == username) {
      const tokenData = await u.db("o_setting").where("key", "tokenKey").first();
      if (!tokenData) return res.status(400).send(error("TokenKey not found"));
      const token = setToken(
        {
          id: data!.id,
          name: data!.name,
        },
        "180Days",
        tokenData?.value as string,
      );

      return res.status(200).send(success({ token: "Bearer " + token, name: data!.name, id: data!.id }, "Login successful"));
    } else {
      return res.status(400).send(error("Invalid username or password"));
    }
  },
);
