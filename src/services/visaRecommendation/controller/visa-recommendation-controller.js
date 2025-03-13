import { determineBestVisaType } from "../services/visa-recommendation-service";

export const determineBestVisaType = async (req, res) => {
  try {
    const userResponses = req.body;

    if (!userResponses || Object.keys(userResponses).length === 0) {
      return res.status(400).json({ error: "User responses are required." });
    }

    const result = await determineBestVisaType(userResponses);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
