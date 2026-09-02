import { Router } from "express";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getProviderCertifications,
  adminUpdateCourse,
  adminDeleteCourse,
} from "../controllers/courseController";

import { authenticate, authorize, optionalAuthenticate } from "../middleware/auth";

const router = Router();

/* Provider */
router.get(
  "/provider/certifications",
  authenticate,
  authorize("provider"),
  getProviderCertifications,
);

/* Admin */
router.put("/admin/:id", authenticate, authorize("admin"), adminUpdateCourse);
router.delete(
  "/admin/:id",
  authenticate,
  authorize("admin"),
  adminDeleteCourse,
);

/* Courses */
router.get("/", optionalAuthenticate, getCourses);
router.post("/", authenticate, authorize("provider", "admin"), createCourse);

router.get("/:id", getCourseById);
router.put("/:id", authenticate, authorize("provider"), updateCourse);
router.delete("/:id", authenticate, authorize("provider"), deleteCourse);

export default router;
