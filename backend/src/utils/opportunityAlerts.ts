import prisma from "../config/database";
import { sendEmail } from "./email";

type OpportunityType = "job" | "service" | "training";

type OpportunityAlert = {
  type: OpportunityType;
  title: string;
  path: string;
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);

const frontendOrigin = (): string => {
  const configured = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")[0]
    .trim();
  const parsed = new URL(configured);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("FRONTEND_URL must be an HTTP(S) origin");
  }
  return parsed.origin;
};

export const notifyOpportunitySubscribers = async ({
  type,
  title,
  path,
}: OpportunityAlert): Promise<void> => {
  try {
    const subscribers = await prisma.user.findMany({
      where: { emailAlertsEnabled: true, isVerified: true },
      select: { email: true, name: true, preferredLanguage: true },
    });

    if (subscribers.length === 0) return;

    const safeTitle = escapeHtml(title.slice(0, 300));
    const opportunityUrl = new URL(path, frontendOrigin()).toString();
    const safeUrl = escapeHtml(opportunityUrl);
    const typeLabel = type === "training" ? "training program" : type;

    for (let index = 0; index < subscribers.length; index += 10) {
      const batch = subscribers.slice(index, index + 10);
      await Promise.allSettled(
        batch.map((subscriber) => {
          const safeName = escapeHtml(subscriber.name.slice(0, 200));
          const html = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#5b21d1">New ${typeLabel} on ZeilaLink</h2>
              <p>Hello ${safeName},</p>
              <p>A new ${typeLabel} has just been published:</p>
              <p><strong>${safeTitle}</strong></p>
              <p><a href="${safeUrl}">View the ${typeLabel}</a></p>
              <p style="color:#64748b;font-size:12px">You received this because you enabled opportunity alerts. Sign in and use the Alerts control on the Jobs page to unsubscribe.</p>
            </div>`;
          return sendEmail(
            subscriber.email,
            `New ${typeLabel}: ${title.slice(0, 180)}`,
            html,
          );
        }),
      );
    }

    console.info("[Opportunity alerts] Delivery attempted", {
      type,
      recipients: subscribers.length,
    });
  } catch (error) {
    console.error("[Opportunity alerts] Delivery failed", {
      type,
      errorType: error instanceof Error ? error.name : "Error",
    });
  }
};
