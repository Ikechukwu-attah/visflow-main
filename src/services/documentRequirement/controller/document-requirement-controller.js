import { getRequiredDocuments } from "../services/document-requirement-service";

export const getRequiredDocuments = async (req, res) => {
  try {
    const { visaType } = req.query;

    if (!visaType) {
      return res.status(400).json({ error: "Visa type is required." });
    }

    const result = await getRequiredDocuments(visaType);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
