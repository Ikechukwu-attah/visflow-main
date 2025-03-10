import { uploadDocument } from "../services/document-service";
import { analyzeDocument } from "../services/document-analysis";

export const uploadDocument = async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;
    const result = await uploadDocument(userId, file);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const analyzeDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await analyzeDocument(documentId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
