import { Request, Response } from "express";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const buildSystemPrompt = (language: "en" | "so") => {
  const langRule =
    language === "so"
      ? "Reply in Somali unless user clearly asks for English."
      : "Reply in English unless user clearly asks for Somali.";

  return `You are ZeilaLink Guide, an assistant for the ZeilaLink platform.
${langRule}
Be concise, practical, and friendly.
If user asks about navigation, reference these paths:
- Jobs: /jobs
- Services: /services
- Trainings: /trainings
- Register: /register
- Contact: /contact
Do not invent company policies, legal guarantees, or unavailable features.
When unsure, suggest contacting support via /contact.`;
};

export const assistantChat = async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      return res.status(503).json({
        error: "AI service is currently unavailable",
      });
    }

    const language = req.body?.language === "so" ? "so" : "en";
    const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];

    const messages: ChatMessage[] = rawMessages
      .filter(
        (m: any) =>
          (m?.role === "user" || m?.role === "assistant") &&
          typeof m?.content === "string" &&
          m.content.trim().length > 0 &&
          m.content.trim().length <= 2000,
      )
      .slice(-12)
      .map((m: any) => ({
        role: m.role,
        content: m.content.trim(),
      }));

    if (messages.length === 0) {
      return res.status(400).json({ error: "At least one valid message is required" });
    }

    if (messages.reduce((total, message) => total + message.content.length, 0) > 8000) {
      return res.status(400).json({ error: "Conversation is too long" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 320,
        messages: [
          { role: "system", content: buildSystemPrompt(language) },
          ...messages,
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("[Chat] AI provider request failed", { status: response.status });
      return res.status(502).json({ error: "AI provider request failed" });
    }

    const data: any = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ error: "AI provider returned an empty response" });
    }

    return res.json({ reply });
  } catch (error: unknown) {
    console.error("[Chat] assistant request failed", {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return res.status(500).json({ error: "Failed to generate assistant response" });
  }
};
