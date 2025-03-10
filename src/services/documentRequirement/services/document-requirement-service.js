import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OpenAI API Key! Set OPENAI_API_KEY in .env");
}

export const getRequiredDocuments = async (visaType) => {
  console.log("📌 Determining required documents for:", visaType);

  const prompt = `
    You are an AI immigration expert. Based on the provided visa type, list the required documents.

    **Visa Type:** ${visaType}

    **Response Format (JSON only, without markdown formatting):**
    {
      "visaType": "${visaType}",
      "requiredDocuments": [
        "List of necessary documents"
      ]
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error("No AI response received.");
    }

    let aiResponse = response.choices[0].message.content.trim();
    console.log("🔹 AI Response:", aiResponse);

    if (!aiResponse) {
      throw new Error("AI response is undefined.");
    }

    // ✅ Clean AI response (Remove markdown)
    aiResponse = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(aiResponse);
    console.log("✅ Required Documents:", result);
    return result;
  } catch (error) {
    console.error("❌ AI Document Requirement Error:", error);
    throw new Error("Failed to determine required documents.");
  }
};
