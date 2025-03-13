import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OpenAI API Key! Set OPENAI_API_KEY in .env");
}

export const determineBestVisaType = async (userResponses) => {
  console.log("📌 User Responses:", userResponses);

  const prompt = `
    You are an AI visa assistant. Based on the user's responses, determine the most suitable visa type **without any predefined options**.
    
    **User Responses:**
    ${JSON.stringify(userResponses, null, 2)}

    **Your Task:**
    - Analyze the user's purpose of travel, financial situation, employment status, and other relevant details.
    - Determine the **best possible visa category** based on standard immigration policies.
    - If no exact match exists, suggest the **most relevant alternative visa**.
    - Provide a confidence score (0-100) based on how well the user's responses match the selected visa type.
    
    **Respond in valid JSON format (without markdown formatting):**
    {
      "bestVisaType": "Visa Type",
      "confidence": 0-100,
      "reasoning": "Explain why this visa type is the best match."
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

    // ✅ Clean AI response
    aiResponse = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(aiResponse);
    console.log("✅ Visa Type Determination:", result);
    return result;
  } catch (error) {
    console.error("❌ AI Visa Type Determination Error:", error);
    throw new Error("Failed to determine visa type.");
  }
};
