import express from "express";
import initDB from "@/lib/initDB";
import { db } from "@/utils/db";
import { success } from "@/lib/responseFormat";
const router = express.Router();

// Clear all data tables
export default router.post(
    "/",
    async (req, res) => {
        await initDB(db, true);
        res.status(200).send(success({ message: "Data tables cleared successfully" }));
    },
);
