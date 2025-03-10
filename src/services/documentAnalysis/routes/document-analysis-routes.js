import express from "express";
import multer from "multer";
import {
  uploadDocument,
  analyzeDocument,
} from "../controllers/documentController.js";
import { classifyDocument } from "../controllers/document-classification-controller.js";

const router = express.Router();
const upload = multer();

router.post("/upload", upload.single("file"), uploadDocument);
router.post("/analyze/:documentId", analyzeDocument);
router.post("/classify/:documentId", classifyDocument);

export default router;
