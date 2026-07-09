import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public contact form endpoint
router.post('/contact', messageController.sendContactEmail);

router.post('/', authenticate, messageController.sendMessage);
router.get('/conversations', authenticate, messageController.getConversations);
router.get('/conversations/:id', authenticate, messageController.getConversation);
router.get('/notifications', authenticate, messageController.getNotifications);

export default router;
