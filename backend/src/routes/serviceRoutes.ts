import { Router } from 'express';
import {
  confirmServiceBookingPayment,
  createServiceBooking,
  createServiceBookingCheckoutSession,
  getMyServiceBookings,
  getServiceById,
  getServices,
} from '../controllers/serviceController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuthenticate, getServices);
router.get('/bookings/me', authenticate, getMyServiceBookings);
router.post('/bookings/confirm-payment', authenticate, confirmServiceBookingPayment);
router.get('/:id', optionalAuthenticate, getServiceById);
router.post('/:id/book/checkout', authenticate, createServiceBookingCheckoutSession);
router.post('/:id/book', authenticate, createServiceBooking);

export default router;
