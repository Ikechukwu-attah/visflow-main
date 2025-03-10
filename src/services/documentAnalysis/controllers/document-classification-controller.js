import { classifyDocument } from "../services/document-classification.js";
export const classifyDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await classifyDocument(documentId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
