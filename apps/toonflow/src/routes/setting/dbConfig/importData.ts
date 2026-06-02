import express from "express";
import { success, error } from "@/lib/responseFormat";
import { db } from "@/utils/db";
import initDB from "@/lib/initDB";

const router = express.Router();

export default router.post("/", async (req, res) => {
  try {
    const { tables: importTables } = req.body;
    if (!importTables || typeof importTables !== "object") {
      return res.status(400).send(error("Invalid import data format"));
    }

    // Delete all existing tables
    const existingTables: { name: string }[] = await db.raw(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%'`,
    );

    await db.raw("PRAGMA foreign_keys = OFF");
    for (const table of existingTables) {
      await db.schema.dropTableIfExists(table.name);
    }
    await db.raw("PRAGMA foreign_keys = ON");

    // Reinitialize table structure
    await initDB(db as any);

    // Import data
    await db.raw("PRAGMA foreign_keys = OFF");
    for (const [tableName, rows] of Object.entries(importTables)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;

      // Validate table name (prevent SQL injection)
      const tableExists = await db.raw(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [tableName],
      );
      if (tableExists.length === 0) continue;

      // Clear table data then insert imported data
      await db.raw(`DELETE FROM "${tableName}"`);
      // Batch insert, 100 per batch
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        await db(tableName).insert(batch);
      }
    }
    await db.raw("PRAGMA foreign_keys = ON");

    res.status(200).send(success("Database imported successfully"));
  } catch (err: any) {
    res.status(500).send(error(err?.message || "Import failed"));
  }
});
