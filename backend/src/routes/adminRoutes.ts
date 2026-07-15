import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import * as serviceController from '../controllers/serviceController';
import * as trainingController from '../controllers/trainingController';
import { authenticate, authorize } from '../middleware/auth';

const router: Router = Router();

router.get('/users', authenticate, authorize('admin'), adminController.getUsers);
router.get('/users/:id', authenticate, authorize('admin'), adminController.getUserById);
router.post('/users', authenticate, authorize('admin'), adminController.createUser);
router.get('/jobs', authenticate, authorize('admin'), adminController.getJobs);
router.post('/verify-employer/:id', authenticate, authorize('admin'), adminController.verifyEmployer);
router.post('/verify-provider/:id', authenticate, authorize('admin'), adminController.verifyProvider);
router.get('/audit-logs', authenticate, authorize('admin'), adminController.getAuditLogs);
router.get('/metrics', authenticate, authorize('admin'), adminController.getMetrics);
router.post('/test-email', authenticate, authorize('admin'), adminController.testEmail);
router.put('/users/:id', authenticate, authorize('admin'), adminController.updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), adminController.deleteUser);
router.get('/services', authenticate, authorize('admin'), serviceController.getAdminServices);
router.post('/services', authenticate, authorize('admin'), serviceController.createAdminService);
router.put('/services/:id', authenticate, authorize('admin'), serviceController.updateAdminService);
router.delete('/services/:id', authenticate, authorize('admin'), serviceController.deleteAdminService);
router.put('/trainings/:id', authenticate, authorize('admin'), trainingController.adminUpdateTraining);
router.delete('/trainings/:id', authenticate, authorize('admin'), trainingController.adminDeleteTraining);
router.get('/service-bookings', authenticate, authorize('admin'), serviceController.getAdminServiceBookings);
router.put('/service-bookings/:id/status', authenticate, authorize('admin'), serviceController.updateAdminServiceBookingStatus);

export default router;
