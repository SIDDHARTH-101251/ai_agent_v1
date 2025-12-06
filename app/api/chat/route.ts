import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { runReactAgent } from "@/lib/agent";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL } from "@/lib/gemini";
import { HumanMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const hasIdentity = Boolean(
    userId ||
      (session?.user as { email?: string } | undefined)?.email ||
      (session?.user as { name?: string } | undefined)?.name
  );

  if (!hasIdentity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const prompt = (body?.message as string | undefined)?.trim();
  const existingConversationId = body?.conversationId as string | undefined;

  if (!prompt) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const ownerId = userId ?? "anonymous";

  let conversation =
    existingConversationId &&
    (await prisma.conversation.findFirst({
      where: { id: existingConversationId, userId: ownerId },
    }));

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userId: ownerId,
        title: prompt.slice(0, 60),
      },
    });
  }

  const recentHistory = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 12,
  });

  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: prompt,
    },
  });

  const assistantMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: "",
    },
  });

  const encoder = new TextEncoder();
  const assistantBuffer: string[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const fullMessage = await runReactAgent({
          prompt,
          history: [...recentHistory, userMessage],
          threadId: conversation!.id,
          userId: ownerId,
          onToken: (token) => {
            assistantBuffer.push(token);
            controller.enqueue(encoder.encode(token));
          },
        });

        if (assistantBuffer.length === 0 && fullMessage) {
          assistantBuffer.push(fullMessage);
          controller.enqueue(encoder.encode(fullMessage));
        }

        const finalAssistant = assistantBuffer.join("");

        await prisma.message.update({
          where: { id: assistantMessage.id },
          data: { content: finalAssistant },
        });

        // Update conversation summary in the background.
        try {
          await generateSummary(conversation!.id);
        } catch (err) {
          console.error("[summary-error]", err);
        }

        controller.close();
      } catch (err) {
        console.error("[chat-stream-error]", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Conversation-Id": conversation.id,
      "X-User-Message-Id": userMessage.id,
      "X-Assistant-Message-Id": assistantMessage.id,
    },
  });
}

async function generateSummary(conversationId: string) {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!convo) return;

  const text = convo.messages
    .reverse()
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n")
    .slice(-4000);

  if (!text.trim()) return;

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? "");
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const prompt = `Summarize this conversation in under 60 words. Capture goals, decisions, and context.\n\n${text}`;

  let summary = "";

  try {
    const result = await model.generateContent(prompt);
    summary = result.response.text().trim();
  } catch (err) {
    console.error("[summary-generate-error]", err);
    return;
  }

  if (summary) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { summary },
    });
  }
}
