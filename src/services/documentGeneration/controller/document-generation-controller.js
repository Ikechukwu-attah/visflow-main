import {
  generateAndMergeDocuments,
  getLatestMergedPdfPath,
} from "../services/document-generation-service.js";

export const generateDocuments = async (req, res) => {
  try {
    const { userId, visaType, answers, uploadedDocuments = [] } = req.body;
    if (!userId || !visaType || !answers) {
      throw new Error("Missing required fields.");
    }

    const result = await generateAndMergeDocuments(
      userId,
      visaType,
      answers,
      uploadedDocuments
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const previewMergedDocument = async (req, res) => {
  try {
    const { userId } = req.params;
    const pdfPath = getLatestMergedPdfPath(userId);
    res.sendFile(pdfPath);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const downloadMergedDocument = async (req, res) => {
  try {
    const { userId } = req.params;
    const pdfPath = getLatestMergedPdfPath(userId);
    res.download(pdfPath);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
