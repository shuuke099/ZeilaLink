import { Router } from "express";
import {
  getDeals,
  getFeaturedDeals,
  getDealById,
} from "../controllers/dealController";

const router = Router();

router.get("/", getDeals);
router.get("/featured", getFeaturedDeals);
router.get("/:id", getDealById);

export default router;
