import express from "express";
import cors from "cors";
import authRoutes from "./services/auth/routes/auth-routes.js";
import documentAnalysisRoutes from "./services/documentAnalysis/routes/document-analysis-routes.js";
import documentGenerationRoutes from "./services/documentGeneration/routes/document-generation-routes.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/document", documentAnalysisRoutes);
app.use("/api/document-generation", documentGenerationRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
