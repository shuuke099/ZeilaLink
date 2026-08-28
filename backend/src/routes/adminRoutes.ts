import { Router } from "express";

import * as adminController from "../controllers/adminController";
import * as serviceController from "../controllers/serviceController";
import * as courseController from "../controllers/courseController";

import { authenticate, authorize } from "../middleware/auth";

const router: Router = Router();

/* Users */
router.get(
  "/users",
  authenticate,
  authorize("admin"),
  adminController.getUsers,
);
router.get(
  "/users/:id",
  authenticate,
  authorize("admin"),
  adminController.getUserById,
);
router.post(
  "/users",
  authenticate,
  authorize("admin"),
  adminController.createUser,
);
router.put(
  "/users/:id",
  authenticate,
  authorize("admin"),
  adminController.updateUser,
);
router.delete(
  "/users/:id",
  authenticate,
  authorize("admin"),
  adminController.deleteUser,
);

/* Jobs */
router.get("/jobs", authenticate, authorize("admin"), adminController.getJobs);

/* Verification */
router.post(
  "/verify-employer/:id",
  authenticate,
  authorize("admin"),
  adminController.verifyEmployer,
);
router.post(
  "/verify-provider/:id",
  authenticate,
  authorize("admin"),
  adminController.verifyProvider,
);

/* Audit & Metrics */
router.get(
  "/audit-logs",
  authenticate,
  authorize("admin"),
  adminController.getAuditLogs,
);
router.get(
  "/metrics",
  authenticate,
  authorize("admin"),
  adminController.getMetrics,
);
router.post(
  "/test-email",
  authenticate,
  authorize("admin"),
  adminController.testEmail,
);

/* Services */
router.get(
  "/services",
  authenticate,
  authorize("admin"),
  serviceController.getAdminServices,
);
router.post(
  "/services",
  authenticate,
  authorize("admin"),
  serviceController.createAdminService,
);
router.put(
  "/services/:id",
  authenticate,
  authorize("admin"),
  serviceController.updateAdminService,
);
router.delete(
  "/services/:id",
  authenticate,
  authorize("admin"),
  serviceController.deleteAdminService,
);

/* Courses */
router.put(
  "/courses/:id",
  authenticate,
  authorize("admin"),
  courseController.adminUpdateCourse,
);
router.delete(
  "/courses/:id",
  authenticate,
  authorize("admin"),
  courseController.adminDeleteCourse,
);

/* Service Bookings */
router.get(
  "/service-bookings",
  authenticate,
  authorize("admin"),
  serviceController.getAdminServiceBookings,
);
router.put(
  "/service-bookings/:id/status",
  authenticate,
  authorize("admin"),
  serviceController.updateAdminServiceBookingStatus,
);

export default router;
