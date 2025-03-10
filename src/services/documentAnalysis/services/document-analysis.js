import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import sharp from "sharp";
import Tesseract from "tesseract.js";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const analyzeDocument = async (documentId) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) throw new Error("Document not found");

  const filePath = path.resolve(document.filePath);
  if (!fs.existsSync(filePath)) throw new Error("File does not exist");

  const extractedText = await extractText(filePath, document.fileType);

  if (!extractedText) throw new Error("Failed to extract text");

  const aiAnalysis = await analyzeWithAI(extractedText);

  return await prisma.document.update({
    where: { id: documentId },
    data: {
      fraudDetected: aiAnalysis.fraudDetected,
      missingFields: aiAnalysis.missingFields,
      recommendations: aiAnalysis.recommendations,
      confidence: aiAnalysis.confidence,
      fraudReasons: aiAnalysis.fraudReasons,
      status: "completed",
    },
  });
};

const extractText = async (filePath, fileType) => {
  if (fileType.includes("pdf")) {
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(pdfBuffer);
    return pdfData.text.trim() || null;
  } else if (
    fileType.includes("image") ||
    fileType.includes("png") ||
    fileType.includes("jpeg")
  ) {
    const processedImage = await sharp(filePath).resize(1000).toBuffer();
    const result = await Tesseract.recognize(processedImage, "eng");
    return result.data.text.trim() || null;
  } else {
    throw new Error("Unsupported file type.");
  }
};

export const analyzeWithAI = async (text) => {
  const prompt = `You are an AI that detects document fraud. Here is the document text:\n\n"${text}"`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  const result = JSON.parse(response.choices[0].message.content);

  return result;
};
