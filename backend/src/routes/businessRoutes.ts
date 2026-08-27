import { Router } from "express";
import {
  getBusinesses,
  getFeaturedBusinesses,
  getBusinessById,
} from "../controllers/businessController";

const router = Router();

router.get("/", getBusinesses);

router.get("/featured", getFeaturedBusinesses);

router.get("/:id", getBusinessById);

export default router;
