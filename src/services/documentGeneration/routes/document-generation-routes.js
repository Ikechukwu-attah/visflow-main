import express from "express";
import {
  previewMergedDocument,
  downloadMergedDocument,
  generateDocuments,
} from "../controller/document-generation-controller.js";

const router = express.Router();

router.post("/generate-content", generateDocuments);
router.get("/preview/:userId", previewMergedDocument);
router.get("/download/:userId", downloadMergedDocument);

export default router;
