import express from "express";
import { success, error } from "@/lib/responseFormat";
import { db } from "@/utils/db";
import initDB from "@/lib/initDB";

const router = express.Router();

export default router.get("/", async (req, res) => {
  try {
    // Get all table names
    const tables: { name: string }[] = await db.raw(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%'`,
    );

    // Disable foreign keys, delete all tables one by one
    await db.raw("PRAGMA foreign_keys = OFF");
    for (const table of tables) {
      await db.schema.dropTableIfExists(table.name);
    }
    await db.raw("PRAGMA foreign_keys = ON");

    // Reinitialize database
    await initDB(db as any);

    res.status(200).send(success("Database cleared and reinitialized"));
  } catch (err: any) {
    res.status(500).send(error(err?.message || "Clear failed"));
  }
});
