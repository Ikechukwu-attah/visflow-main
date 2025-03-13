import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { PDFDocument } from "pdf-lib";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { generatePDF } from "./pdf-generation-service.js";
import { getRequiredDocuments } from "../../documentRequirement/services/document-requirement-service.js";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateAndMergeDocuments = async (
  userId,
  visaType,
  answers,
  uploadedDocuments
) => {
  console.log("📌 Generating documents for:", visaType);

  // ✅ Step 1: Fetch Required Documents for Visa Type
  const requiredDocs = await getRequiredDocuments(visaType);
  if (!requiredDocs || requiredDocs.requiredDocuments.length === 0) {
    throw new Error("No required documents found.");
  }

  const formattedUploads = uploadedDocuments.length
    ? `📌 **User Uploaded Documents:**\n${uploadedDocuments.join("\n")}`
    : "📌 **No User Documents Uploaded**";

  // ✅ Step 2: AI Prompt for Document Generation
  const prompt = `
    🔹 **AI Visa Document Generator**  
You are an advanced AI specializing in **visa application document preparation**.  
Your task is to **analyze visa requirements and generate ALL necessary documents** that must be created **by the applicant**.  

📌 **Visa Type:** ${visaType}  
📌 **User Details:**  
${JSON.stringify(answers, null, 2)}  
${formattedUploads}

📌 **Generate Documents Based on AI Analysis:**  
- Return each document as a JSON object.  
- Format: JSON (NO Markdown).  
- Follow professional visa document structure.  
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  if (!response || !response.choices || response.choices.length === 0) {
    throw new Error("No AI response received.");
  }

  let content = response.choices[0].message.content.trim();
  console.log("🔹 Raw AI Response:", content);

  // ✅ Clean AI response
  content = content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  // ✅ Step 3: Parse AI Response
  let documents;
  try {
    documents = JSON.parse(content);
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error("Invalid AI response format");
    }
  } catch (error) {
    console.error("❌ Failed to parse AI response:", error);
    throw new Error("Failed to generate documents.");
  }

  // ✅ Step 4: Generate PDFs
  const savedDocuments = [];
  const pdfPaths = [];

  for (const doc of documents) {
    if (!doc.documentType || !doc.content || !doc.format) {
      throw new Error("AI returned incomplete document structure.");
    }

    const pdfPath = await generatePDF(doc.documentType, doc.content);

    const savedDoc = await prisma.generatedDocument.create({
      data: {
        id: uuidv4(),
        userId,
        visaType,
        documentType: doc.documentType,
        format: doc.format,
        pageCount: doc.pageCount || 1,
        content: doc.content,
        pdfPath,
        createdAt: new Date(),
      },
    });

    savedDocuments.push(savedDoc);
    pdfPaths.push(pdfPath);
  }

  // ✅ Step 5: Merge PDFs into Single File
  const mergedPdfPath = await mergePdfFiles(pdfPaths, userId);
  return { mergedPdfPath };
};

const mergePdfFiles = async (pdfPaths, userId) => {
  if (!pdfPaths.length) {
    throw new Error("No PDFs to merge.");
  }

  const mergedPdf = await PDFDocument.create();

  for (const pdfPath of pdfPaths) {
    if (!fs.existsSync(pdfPath)) continue;
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const outputDir = path.join(process.cwd(), "merged_pdfs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const mergedPdfPath = path.join(outputDir, `Merged_Documents_${userId}.pdf`);

  fs.writeFileSync(mergedPdfPath, await mergedPdf.save());
  return mergedPdfPath;
};

export const getLatestMergedPdfPath = (userId) => {
  const mergedPdfPath = path.join(
    process.cwd(),
    `merged_pdfs/Merged_Documents_${userId}.pdf`
  );

  if (!fs.existsSync(mergedPdfPath)) {
    throw new Error("No merged document available.");
  }

  return mergedPdfPath;
};
