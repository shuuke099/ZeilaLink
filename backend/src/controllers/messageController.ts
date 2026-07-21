import { Response, Request } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import {
  DEFAULT_CONTACT_ADDRESS,
  escapeHtml,
  isValidEmailAddress,
  sendEmail,
} from '../utils/email';
import { sendSms } from '../utils/sms';

const logControllerError = (operation: string, error: unknown) => {
  const candidate = error as { code?: unknown; responseCode?: unknown };
  console.error(`[Messages] ${operation} failed`, {
    code:
      typeof candidate?.code === 'string'
        ? candidate.code.slice(0, 40)
        : undefined,
    responseCode:
      typeof candidate?.responseCode === 'number'
        ? candidate.responseCode
        : undefined,
  });
};

const readTextField = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) return null;
  return normalized;
};

type MessagingParticipant = {
  id: string;
  role: string;
};

const hasMessagingRelationship = async (
  sender: MessagingParticipant,
  recipient: MessagingParticipant,
  jobId: string | null,
): Promise<boolean> => {
  // Administrators retain support/moderation access, and every verified user
  // may contact an administrator without first creating a business record.
  if (sender.role === 'admin' || recipient.role === 'admin') {
    if (!jobId) return true;
    return Boolean(
      await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } }),
    );
  }

  const roles = new Set([sender.role, recipient.role]);
  if (roles.has('worker') && roles.has('employer') && roles.size === 2) {
    const workerId = sender.role === 'worker' ? sender.id : recipient.id;
    const employerUserId = sender.role === 'employer' ? sender.id : recipient.id;
    return Boolean(
      await prisma.application.findFirst({
        where: {
          userId: workerId,
          ...(jobId ? { jobId } : {}),
          job: {
            employer: {
              userId: employerUserId,
              verified: true,
            },
          },
        },
        select: { id: true },
      }),
    );
  }

  // A provider and learner may message only after the learner is enrolled in
  // one of that approved provider's trainings. Job references never apply to
  // this relationship.
  if (!jobId && roles.has('worker') && roles.has('provider') && roles.size === 2) {
    const workerId = sender.role === 'worker' ? sender.id : recipient.id;
    const providerUserId = sender.role === 'provider' ? sender.id : recipient.id;
    return Boolean(
      await prisma.userCertification.findFirst({
        where: {
          userId: workerId,
          training: {
            provider: {
              contactUserId: providerUserId,
              verified: true,
            },
          },
        },
        select: { id: true },
      }),
    );
  }

  return false;
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { toUserId, jobId, content } = req.body;

    if (typeof toUserId !== 'string' || !toUserId.trim()) {
      return res.status(400).json({ error: 'Recipient is required' });
    }
    if (typeof content !== 'string' || !content.trim() || content.trim().length > 5000) {
      return res.status(400).json({ error: 'Message must contain 1 to 5000 characters' });
    }
    if (jobId !== undefined && jobId !== null && typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Invalid job reference' });
    }

    if (toUserId.trim() === req.user!.id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    const normalizedJobId =
      typeof jobId === 'string' && jobId.trim() ? jobId.trim() : null;
    const recipient = await prisma.user.findUnique({
      where: { id: toUserId.trim() },
      select: { id: true, role: true, isVerified: true },
    });
    if (!recipient?.isVerified) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const canMessage = await hasMessagingRelationship(
      { id: req.user!.id, role: req.user!.role },
      recipient,
      normalizedJobId,
    );
    if (!canMessage) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const message = await prisma.message.create({
      data: {
        fromUserId: req.user!.id,
        toUserId: recipient.id,
        jobId: normalizedJobId,
        content: content.trim(),
      },
      include: {
        fromUser: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
        toUser: {
          select: {
            name: true,
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
    logControllerError('send message', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // other user id
    const userId = req.user!.id;

    const otherUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isVerified: true },
    });
    if (
      !otherUser ||
      (!otherUser.isVerified && req.user!.role !== 'admin') ||
      !(await hasMessagingRelationship(
        { id: userId, role: req.user!.role },
        otherUser,
        null,
      ))
    ) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

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
            avatarUrl: true,
          },
        },
        toUser: {
          select: {
            name: true,
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
    logControllerError('load conversation', error);
    res.status(500).json({ error: 'Failed to load conversation' });
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
          avatarUrl: msg.fromUser.avatarUrl,
          lastMessage: msg,
        });
      }
    });

    res.json(Array.from(conversations.values()));
  } catch (error: any) {
    logControllerError('load conversations', error);
    res.status(500).json({ error: 'Failed to load conversations' });
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
    logControllerError('load notifications', error);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
};

export const sendContactEmail = async (req: Request, res: Response) => {
  try {
    const name = readTextField(req.body?.name, 120);
    const email = readTextField(req.body?.email, 254);
    const message = readTextField(req.body?.message, 10_000);
    const subjectValue = req.body?.subject;
    const subject =
      subjectValue === undefined || subjectValue === null || subjectValue === ''
        ? ''
        : readTextField(subjectValue, 200);

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email and message are required' });
    }

    if (
      /[\u0000-\u001f\u007f]/.test(name) ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(message)
    ) {
      return res.status(400).json({ error: 'Invalid contact message' });
    }

    if (!isValidEmailAddress(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    if (subject === null || /[\u0000-\u001f\u007f]/.test(subject || '')) {
      return res.status(400).json({ error: 'Invalid subject' });
    }

    const to = process.env.CONTACT_EMAIL_TO?.trim() || DEFAULT_CONTACT_ADDRESS;
    if (!isValidEmailAddress(to)) {
      logControllerError('validate contact recipient', {
        code: 'INVALID_CONTACT_RECIPIENT',
      });
      return res.status(503).json({ error: 'Unable to send message right now' });
    }

    const emailSubject = subject
      ? `[Contact] ${subject}`
      : `New Contact Message from ${name}`;
    const escapedName = escapeHtml(name);
    const escapedEmail = escapeHtml(email);
    const escapedSubject = subject ? escapeHtml(subject) : '';
    const escapedMessage = escapeHtml(message).replace(/\r?\n/g, '<br>');
    const html = `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${escapedName}</p>
      <p><strong>Email:</strong> ${escapedEmail}</p>
      ${escapedSubject ? `<p><strong>Subject:</strong> ${escapedSubject}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p>${escapedMessage}</p>
    `;
    await sendEmail(to, emailSubject, html);

    // Optional: SMS notification to phone if configured
    const smsTo = process.env.SMS_TO;
    if (smsTo) {
      const smsBody = `Contact: ${name} <${email}>${subject ? ` | ${subject}` : ''}\n${message}`.slice(0, 1000);
      try {
        await sendSms(smsTo, smsBody);
      } catch (error: unknown) {
        logControllerError('send contact SMS notification', error);
      }
    }

    return res.json({ message: 'Message sent' });
  } catch (error: any) {
    logControllerError('send contact email', error);
    return res.status(503).json({ error: 'Unable to send message right now' });
  }
};
