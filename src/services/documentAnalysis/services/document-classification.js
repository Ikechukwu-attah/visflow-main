import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import sharp from "sharp";
import Tesseract from "tesseract.js";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const classifyDocument = async (documentId) => {
  console.log(`Classifying document: ${documentId}`);

  // 🔹 Step 1: Retrieve document from DB
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const filePath = path.resolve(document.filePath);
  console.log(`Processing file: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error("File does not exist");
  }

  // 🔹 Step 2: Extract text
  const extractedText = await extractText(filePath, document.fileType);
  if (!extractedText) {
    throw new Error("Failed to extract text from document");
  }

  // 🔹 Step 3: Classify document using AI
  const classificationResult = await classifyWithGPT4(extractedText);

  console.log("🔹 Final Classification Result:", classificationResult);

  // ✅ Update DB with classification result
  await prisma.document.update({
    where: { id: documentId },
    data: { predictedDocumentType: classificationResult.predictedType },
  });

  return classificationResult;
};

const extractText = async (filePath, fileType) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("File does not exist");
  }

  try {
    const normalizedType = fileType.toLowerCase();

    if (normalizedType.includes("pdf")) {
      console.log("✅ Detected as a PDF");
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(pdfBuffer);
      return pdfData.text.trim() || null;
    } else if (
      normalizedType.includes("image") ||
      normalizedType.includes("png") ||
      normalizedType.includes("jpeg") ||
      normalizedType.includes("jpg")
    ) {
      console.log("✅ Detected as an Image");
      const processedImageBuffer = await sharp(filePath)
        .resize(1000)
        .toBuffer();

      const result = await Tesseract.recognize(processedImageBuffer, "eng");
      return result.data.text.trim() || null;
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error("❌ Error extracting text:", error);
    return null;
  }
};

const classifyWithGPT4 = async (documentText) => {
  console.log("Sending to GPT-4 for classification...");

  const prompt = `
    You are an AI trained to classify visa-related documents.
    Your task is to determine the exact document type based on the provided text.

    Examples of possible document types include:
    - Passport
    - Visa Application Form
    - Proof of Funds
    - Employment Letter
    - Bank Statement
    - Travel Itinerary
    - Invitation Letter
    - Supporting Affidavit
    - **Other visa-related document** (if none of the above exactly match)

    If the document does not clearly fit one of the predefined types, **do your best to infer its classification** based on its content.

    **Document Text:**
    "${documentText}"

    📌 **Expected JSON Response:**
    {
      "predictedType": "Detected Document Type",
      "confidence": 0-100,
      "summary": "Short explanation of why this classification was chosen."
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error("No classification result received from GPT-4.");
    }

    const rawContent = response.choices[0].message.content.trim();
    if (!rawContent) {
      throw new Error("Received empty classification response.");
    }

    const classification = JSON.parse(rawContent);
    console.log("🔹 Classification Result:", classification);

    return classification;
  } catch (error) {
    console.error("GPT-4 Classification Error:", error);
    return {
      predictedType: "Unknown",
      confidence: 0,
      summary: "Classification failed",
    };
  }
};
