import express from "express";
import { getRequiredDocuments } from "../controller/document-requirement-controller";

const router = express.Router();

router.get("/list", getRequiredDocuments);

export default router;
