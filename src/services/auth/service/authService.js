import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { prisma } from "../../../config/db.js";

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const comparePasswords = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (user) => {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET || "", { expiresIn: "1h" });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign({ sub: payload.id }, process.env.REFRESH_TOKEN_SECRET || "", {
    expiresIn: "7d",
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || "");
};

export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({ where: { email } });
};

export const registerUser = async (email, fullname, password) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await hashPassword(password);
  const verifyToken = Math.random().toString(36).substring(2, 15);

  await prisma.user.create({
    data: {
      email,
      fullname,
      password: hashedPassword,
      role: "user",
      verifyToken,
    },
  });

  await sendVerificationEmail(email, verifyToken);
  return { message: "User successfully created" };
};

export const login = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user || !(await comparePasswords(password, user.password))) {
    throw new Error("Invalid credentials");
  }

  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // 🔥 Store refresh token in DB (hashed)
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefreshToken },
  });

  return { accessToken, refreshToken };
};

export const refreshAccessToken = async (userId, refreshToken) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.refreshToken) throw new Error("Invalid refresh token");

  const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isValid) throw new Error("Invalid refresh token");

  const payload = { sub: user.id, email: user.email, role: user.role };
  const newAccessToken = generateToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // 🔥 Update refresh token in DB
  const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedNewRefreshToken },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const verifyUrl = `http://localhost:3000/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
  });
};

export const verifyEmail = async (token) => {
  const user = await prisma.user.findFirst({
    where: { verifyToken: token },
  });

  if (!user) {
    throw new Error("Invalid or expired token");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verifyToken: null },
  });

  return { message: "Email verified successfully" };
};

export const logout = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
};
