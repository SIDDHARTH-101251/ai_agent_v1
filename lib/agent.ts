import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { DynamicTool } from "@langchain/core/tools";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { Message } from "@prisma/client";
import { prisma } from "./prisma";
import { prismaCheckpointSaver } from "./checkpointer";
import { GEMINI_MODEL } from "./gemini";

type RunAgentParams = {
  prompt: string;
  history: Message[];
  onToken?: (token: string) => void;
  threadId: string;
  userId: string;
};

const DEFAULT_SYSTEM =
  "You are a really advanced AGI. Like IronMan's Jarvis...";

function buildContext(history: Message[]) {
  const mapped = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) =>
      m.role === "assistant"
        ? new AIMessage({ content: m.content })
        : new HumanMessage({ content: m.content })
    );

  return mapped;
}

export async function runReactAgent({
  prompt,
  history,
  onToken,
  threadId,
  userId,
}: RunAgentParams): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set");
  }

  const tools = [
    new DynamicTool({
      name: "get_time",
      description: "Get the current time in ISO format.",
      func: async () => new Date().toISOString(),
    }),
    new DynamicTool({
      name: "list_conversations",
      description: "List recent conversations for the signed-in user with ids, titles, and timestamps.",
      func: async () => {
        const convos = await prisma.conversation.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          take: 10,
        });
        return convos
          .map(
            (c) =>
              `${c.id} | ${c.title ?? "Untitled"} | ${c.updatedAt.toISOString()}`
          )
          .join("\n");
      },
    }),
    new DynamicTool({
      name: "get_conversation_snippet",
      description:
        "Given a conversation title or partial title, return a short snippet of its recent messages.",
      func: async (input: string) => {
        const query = input?.trim();
        if (!query) return "No title provided.";
        const convo = await prisma.conversation.findFirst({
          where: {
            userId,
            title: { contains: query, mode: "insensitive" },
          },
          orderBy: { updatedAt: "desc" },
        });
        if (!convo) return "No matching conversation found.";
        const msgs = await prisma.message.findMany({
          where: { conversationId: convo.id },
          orderBy: { createdAt: "desc" },
          take: 6,
        });
        return [
          `Conversation: ${convo.title ?? "Untitled"} (${convo.updatedAt.toISOString()})`,
          ...msgs
            .reverse()
            .map((m) => `${m.role}: ${m.content.slice(0, 200)}`),
        ].join("\n");
      },
    }),
    new DynamicTool({
      name: "get_conversation_summary",
      description:
        "Given a conversation title or partial title, return the stored summary if available.",
      func: async (input: string) => {
        const query = input?.trim();
        if (!query) return "No title provided.";
        const convo = await prisma.conversation.findFirst({
          where: {
            userId,
            title: { contains: query, mode: "insensitive" },
          },
          orderBy: { updatedAt: "desc" },
        });
        if (!convo) return "No matching conversation found.";
        return convo.summary ?? "No summary saved yet.";
      },
    }),
    new DynamicTool({
      name: "get_user_profile",
      description: "Fetch the stored user profile/summary for personalization.",
      func: async () => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { profileSummary: true },
        });
        return user?.profileSummary ?? "No profile stored yet.";
      },
    }),
    new DynamicTool({
      name: "set_user_profile",
      description:
        "Store or update the user profile/summary for personalization. Provide a concise paragraph.",
      func: async (input: string) => {
        const text = input?.trim();
        if (!text) return "No profile content provided.";
        await prisma.user.update({
          where: { id: userId },
          data: { profileSummary: text },
        });
        return "Profile updated.";
      },
    }),
  ];

  const llm = new ChatGoogleGenerativeAI({
    model: GEMINI_MODEL,
    apiKey,
    streaming: true,
    safetySettings: [],
    maxOutputTokens: 2048,
    temperature: 0.4,
    callbacks: onToken
      ? [
          {
            handleLLMNewToken: onToken,
          },
        ]
      : undefined,
  }).bindTools(tools);

  const agent = createReactAgent({
    llm,
    tools,
    messageModifier: DEFAULT_SYSTEM,
    checkpointSaver: prismaCheckpointSaver,
  });

  // Seed the agent with recent history plus current turn for direct recall.
  const messages = [...buildContext(history), new HumanMessage({ content: prompt })];
  const result = await agent.invoke(
    { messages },
    { configurable: { thread_id: threadId } }
  );
  const aiMessage = result.messages?.filter(
    (m): m is AIMessage => m instanceof AIMessage
  ).at(-1);

  const output = aiMessage?.content;
  return typeof output === "string"
    ? output
    : Array.isArray(output)
    ? output.map((c) => (typeof c === "string" ? c : c?.text ?? "")).join("")
    : JSON.stringify(output ?? "");
}
