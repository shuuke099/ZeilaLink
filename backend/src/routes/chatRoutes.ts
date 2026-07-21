import { Router } from "express";
import rateLimit from "express-rate-limit";
import { assistantChat } from "../controllers/chatController";

const router = Router();
const assistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many assistant requests. Please try again later." },
});

router.post("/assistant", assistantLimiter, assistantChat);

export default router;

