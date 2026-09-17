import { Router } from "express";
import { getReviews, upsertReview } from "../controllers/reviewController";
import { authenticate, optionalAuthenticate } from "../middleware/auth";

const router = Router();

router.get("/:type/:id", optionalAuthenticate, getReviews);
router.post("/:type/:id", authenticate, upsertReview);

export default router;

