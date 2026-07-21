import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many contact requests. Please try again later.' },
});
const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).user?.id || 'anonymous',
  message: { error: 'Too many messages. Please try again later.' },
});

// Public contact form endpoint
router.post('/contact', contactLimiter, messageController.sendContactEmail);

router.post('/', authenticate, messageLimiter, messageController.sendMessage);
router.get('/conversations', authenticate, messageController.getConversations);
router.get('/conversations/:id', authenticate, messageController.getConversation);
router.get('/notifications', authenticate, messageController.getNotifications);

export default router;
