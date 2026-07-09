import { Router } from "express";
import { assistantChat } from "../controllers/chatController";

const router = Router();

router.post("/assistant", assistantChat);

export default router;

