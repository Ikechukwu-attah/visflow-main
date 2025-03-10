import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { prisma } from "../../../config/db";

export const uploadDocument = async (userId, file) => {
  if (!file) throw new Error("No file uploaded");

  const { originalname, mimetype, buffer } = file;

  if (!originalname || !mimetype || !buffer) {
    throw new Error("Invalid file format or missing properties");
  }

  const allowedMimeTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];
  if (!allowedMimeTypes.includes(mimetype)) {
    throw new Error("Unsupported file type.");
  }

  const fileId = uuidv4();
  const timestamp = Date.now();
  const sanitizedFileName = originalname.replace(/\s+/g, "_");

  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(
    uploadsDir,
    `${fileId}-${timestamp}-${sanitizedFileName}`
  );

  fs.writeFileSync(filePath, buffer);

  await prisma.document.create({
    data: {
      id: fileId,
      userId,
      fileName: originalname,
      fileType: mimetype,
      filePath,
      status: "pending",
    },
  });

  return { message: "File uploaded successfully", documentId: fileId };
};
