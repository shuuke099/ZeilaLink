import { Response, Request } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { sendEmail } from '../utils/email';
import { sendSms } from '../utils/sms';

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { toUserId, jobId, content } = req.body;

    if (toUserId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    const message = await prisma.message.create({
      data: {
        fromUserId: req.user!.id,
        toUserId,
        jobId,
        content,
      },
      include: {
        fromUser: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        toUser: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        job: {
          select: {
            title: true,
          },
        },
      },
    });

    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // other user id
    const userId = req.user!.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: id },
          { fromUserId: id, toUserId: userId },
        ],
      },
      include: {
        fromUser: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        toUser: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        job: {
          select: {
            title: true,
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        fromUserId: id,
        toUserId: userId,
        read: false,
      },
      data: { read: true },
    });

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all unique conversations
    const sentMessages = await prisma.message.findMany({
      where: { fromUserId: userId },
      distinct: ['toUserId'],
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const receivedMessages = await prisma.message.findMany({
      where: { toUserId: userId },
      distinct: ['fromUserId'],
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Combine and deduplicate
    const conversations = new Map();
    
    sentMessages.forEach(msg => {
      conversations.set(msg.toUserId, {
        userId: msg.toUserId,
        userName: msg.toUser.name,
        userEmail: msg.toUser.email,
        avatarUrl: msg.toUser.avatarUrl,
        lastMessage: msg,
      });
    });

    receivedMessages.forEach(msg => {
      const existing = conversations.get(msg.fromUserId);
      if (!existing || new Date(msg.createdAt) > new Date(existing.lastMessage.createdAt)) {
        conversations.set(msg.fromUserId, {
          userId: msg.fromUserId,
          userName: msg.fromUser.name,
          userEmail: msg.fromUser.email,
          avatarUrl: msg.fromUser.avatarUrl,
          lastMessage: msg,
        });
      }
    });

    res.json(Array.from(conversations.values()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const unreadMessages = await prisma.message.count({
      where: {
        toUserId: userId,
        read: false,
      },
    });

    const pendingApplications = await prisma.application.count({
      where: {
        userId,
        status: 'applied',
      },
    });

    res.json({
      unreadMessages,
      pendingApplications,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const sendContactEmail = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body as { name: string; email: string; subject?: string; message: string };
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email and message are required' });
    }

    const to = process.env.CONTACT_EMAIL_TO || process.env.EMAIL_USER || process.env.EMAIL_FROM || 'no-reply@example.com';
    const emailSubject = subject && subject.trim().length > 0 ? `[Contact] ${subject}` : `New Contact Message from ${name}`;
    const html = `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br/>')}</p>
    `;
    await sendEmail(to as string, emailSubject, html);

    // Optional: SMS notification to phone if configured
    const smsTo = process.env.SMS_TO;
    if (smsTo) {
      const smsBody = `Contact: ${name} <${email}>${subject ? ` | ${subject}` : ''}\n${message}`.slice(0, 1000);
      try { await sendSms(smsTo, smsBody); } catch (e) { console.warn('SMS send failed:', e); }
    }

    return res.json({ message: 'Message sent' });
  } catch (error: any) {
    console.error('sendContactEmail failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to send message' });
  }
};
