import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const outputDir = path.join(process.cwd(), "generated_pdfs");

// ✅ Ensure the PDF storage directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

export const generatePDF = (documentType, content) => {
  return new Promise((resolve, reject) => {
    try {
      const pdfFileName = `${documentType.replace(
        /\s+/g,
        "_"
      )}-${Date.now()}.pdf`;
      const pdfFilePath = path.join(outputDir, pdfFileName);

      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(pdfFilePath);

      // ✅ Pipe PDF content into file
      doc.pipe(writeStream);

      // ✅ PDF Header
      doc.fontSize(20).text(documentType, { align: "center" }).moveDown(2);

      // ✅ PDF Body Content
      doc.fontSize(12).text(content, {
        align: "left",
        lineGap: 6,
      });

      doc.end();

      // ✅ Resolve when PDF is fully written
      writeStream.on("finish", () => resolve(pdfFilePath));
      writeStream.on("error", (error) => reject(error));
    } catch (error) {
      console.error("❌ Error generating PDF:", error);
      reject(new Error("Failed to generate PDF."));
    }
  });
};
