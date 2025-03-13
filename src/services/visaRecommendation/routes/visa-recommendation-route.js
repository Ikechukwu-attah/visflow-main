import express from "express";
import { determineBestVisaType } from "../controller/visa-recommendation-controller";

const router = express.Router();

router.post("/determine", determineBestVisaType);

export default router;
