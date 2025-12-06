"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowRightOnRectangleIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  InformationCircleIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  SpeakerWaveIcon,
  SwatchIcon,
  SunIcon,
  TrashIcon,
  MoonIcon,
  UserIcon,
} from "@heroicons/react/24/solid";

type SpeechRecognitionInstance = {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const THEMES = [
  {
    name: "Aurora",
    mode: {
      light: {
        bg: "from-slate-100 via-white to-slate-50",
        card: "bg-white text-slate-900 ring-slate-200/90",
        accent: "bg-indigo-600 hover:bg-indigo-500",
        bubbleUser: "bg-indigo-600 text-white ring-indigo-300/70",
        bubbleAI: "bg-white text-slate-900 ring-slate-200/80",
        border: "border-slate-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-sky-950",
        card: "bg-white/5 text-slate-50 ring-white/15",
        accent: "bg-sky-500 hover:bg-sky-400",
        bubbleUser: "bg-sky-500/80 text-white ring-sky-300/40",
        bubbleAI: "bg-white/10 text-slate-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Magma",
    mode: {
      light: {
        bg: "from-amber-50 via-amber-100 to-rose-50",
        card: "bg-white text-amber-950 ring-amber-200/90",
        accent: "bg-orange-600 hover:bg-orange-500",
        bubbleUser: "bg-orange-600 text-white ring-orange-300/70",
        bubbleAI: "bg-white text-amber-900 ring-amber-200/80",
        border: "border-amber-200/80",
      },
      dark: {
        bg: "from-slate-950 via-zinc-900 to-amber-950",
        card: "bg-white/5 text-amber-50 ring-amber-200/15",
        accent: "bg-orange-500 hover:bg-orange-400",
        bubbleUser: "bg-orange-500/85 text-white ring-orange-300/40",
        bubbleAI: "bg-white/10 text-amber-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Forest",
    mode: {
      light: {
        bg: "from-emerald-50 via-white to-emerald-100",
        card: "bg-white text-emerald-950 ring-emerald-200/90",
        accent: "bg-emerald-600 hover:bg-emerald-500",
        bubbleUser: "bg-emerald-600 text-white ring-emerald-300/70",
        bubbleAI: "bg-white text-emerald-900 ring-emerald-200/80",
        border: "border-emerald-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-emerald-950",
        card: "bg-white/5 text-emerald-50 ring-emerald-200/15",
        accent: "bg-emerald-500 hover:bg-emerald-400",
        bubbleUser: "bg-emerald-500/85 text-white ring-emerald-300/40",
        bubbleAI: "bg-white/10 text-emerald-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
] as const;

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  title: string | null;
  summary: string | null;
  createdAt: string;
  messages: Message[];
};

type Props = {
  userName?: string | null;
  initialConversations: Conversation[];
  initialThemeName?: string;
  initialThemeMode?: string;
  initialPinnedIds?: string[];
};

export function Chat({
  userName,
  initialConversations,
  initialThemeName,
  initialThemeMode,
  initialPinnedIds,
}: Props) {
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversations[0]?.id ?? null
  );
  const [messages, setMessages] = useState<Message[]>(
    initialConversations[0]?.messages ?? []
  );
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themeIndex, setThemeIndex] = useState(() => {
    const idx = THEMES.findIndex(
      (t) => t.name.toLowerCase() === initialThemeName?.toLowerCase()
    );
    return idx >= 0 ? idx : 0;
  });
  const [themeMode, setThemeMode] = useState<"light" | "dark">(
    initialThemeMode === "light" ? "light" : "dark"
  );
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );
  const [showPinned, setShowPinned] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    new Set(initialPinnedIds ?? [])
  );
  const [openSummaryId, setOpenSummaryId] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [activeMessageActions, setActiveMessageActions] = useState<string | null>(null);
  const [activeConversationActions, setActiveConversationActions] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const wasListeningDuringSpeak = useRef(false);
  const listeningRef = useRef(false);
  const pendingTranscriptRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(
    initialConversations[0]?.id ?? null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagePressTimer = useRef<number | null>(null);
  const conversationPressTimer = useRef<number | null>(null);

  const currentTitle = useMemo(() => {
    const active =
      conversations.find((c) => c.id === conversationId) ?? conversations[0];
    if (!active) return "New chat";
    return active.title || "Untitled conversation";
  }, [conversationId, conversations]);

  const theme = THEMES[themeIndex].mode[themeMode];
  const isDark = themeMode === "dark";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-300" : "text-slate-600";
  const panelBg = isDark ? "bg-white/5" : "bg-white/80";
  const panelBorder = isDark ? "border-white/15" : "border-slate-200";
  const chipBorder = isDark ? "border-white/20" : "border-slate-300";
  const chipBg = isDark ? "bg-black/40" : "bg-white";
  const chipText = isDark ? "text-white" : "text-slate-900";
  const headerBtn =
    `rounded-full border ${chipBorder} px-3 py-2 text-xs font-semibold ${textPrimary} transition ` +
    (isDark ? "hover:border-white hover:bg-white/10" : "hover:border-slate-400 hover:bg-white");
  const iconBtn =
    `flex h-9 w-9 items-center justify-center rounded-full border ${chipBorder} ${chipBg} text-xs font-semibold ${textPrimary} transition ` +
    (isDark ? "hover:border-white hover:bg-white/10" : "hover:border-slate-400 hover:bg-white");
  const headerBorderColor = isDark
    ? "rgba(255,255,255,0.15)"
    : "rgba(0,0,0,0.1)";
  const resizeTextarea = (value: string) => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 200);
    el.style.height = `${Math.max(next, 60)}px`;
  };

  const clearMessagePressTimer = () => {
    if (messagePressTimer.current) {
      clearTimeout(messagePressTimer.current);
      messagePressTimer.current = null;
    }
  };

  const clearConversationPressTimer = () => {
    if (conversationPressTimer.current) {
      clearTimeout(conversationPressTimer.current);
      conversationPressTimer.current = null;
    }
  };

  const handleMessageTouchStart = (id: string) => {
    clearMessagePressTimer();
    messagePressTimer.current = window.setTimeout(() => {
      setActiveMessageActions(id);
    }, 400);
  };

  const handleMessageTouchEnd = () => {
    clearMessagePressTimer();
  };

  const handleConversationTouchStart = (id: string) => {
    clearConversationPressTimer();
    conversationPressTimer.current = window.setTimeout(() => {
      setActiveConversationActions(id);
    }, 400);
  };

  const handleConversationTouchEnd = () => {
    clearConversationPressTimer();
  };

  useEffect(() => {
    let lastIsDesktop: boolean | null = null;
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop !== lastIsDesktop) {
        setSidebarOpen(desktop);
        if (desktop) {
          setControlsOpen(false);
        }
        lastIsDesktop = desktop;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearMessagePressTimer();
      clearConversationPressTimer();
    };
  }, []);

  useEffect(() => {
    resizeTextarea(input);
  }, [input]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages, isStreaming]);

  const onSelectConversation = (id: string) => {
    setConversationId(id);
    const selected = conversations.find((c) => c.id === id);
    setMessages(selected?.messages ?? []);
    setError(null);
    setActiveMessageActions(null);
    setActiveConversationActions(null);
  };

  const startNewConversation = () => {
    setConversationId(null);
    conversationIdRef.current = null;
    setMessages([]);
    setError(null);
    setActiveMessageActions(null);
    setActiveConversationActions(null);
  };

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText ?? input;
    if (!text.trim() || isStreaming) return;
    setError(null);
    const userTempId = `user-${Date.now()}`;
    const assistantTempId = `assistant-${Date.now()}`;

    // Clear the input immediately for responsiveness.
    setInput("");

    const userMessage: Message = {
      id: userTempId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const assistantMessage: Message = {
      id: assistantTempId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: conversationIdRef.current ?? undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to reach the model");
      }

      const newConversationId =
        res.headers.get("x-conversation-id") ?? conversationIdRef.current;
      const resolvedUserId =
        res.headers.get("x-user-message-id") ?? userTempId;
      const resolvedAssistantId =
        res.headers.get("x-assistant-message-id") ?? assistantTempId;

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === userTempId) {
            return { ...msg, id: resolvedUserId };
          }
          if (msg.id === assistantTempId) {
            return { ...msg, id: resolvedAssistantId };
          }
          return msg;
        })
      );

      if (newConversationId && newConversationId !== conversationId) {
        setConversationId(newConversationId);
        conversationIdRef.current = newConversationId;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        const chunk = assistantText;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === resolvedAssistantId ? { ...msg, content: chunk } : msg
          )
        );
      }

      let finalMessages: Message[] = [];

      setMessages((prev) => {
        const next = prev.map((msg) =>
          msg.id === resolvedAssistantId
            ? { ...msg, content: assistantText }
            : msg
        );
        finalMessages = next;
        return next;
      });

      setConversations((prev) => {
        const updated: Conversation = {
          id: newConversationId ?? conversationId ?? resolvedAssistantId,
          title:
            prev.find((c) => c.id === newConversationId)?.title ??
            userMessage.content.slice(0, 60),
          summary:
            prev.find((c) => c.id === newConversationId)?.summary ?? null,
          createdAt:
            prev.find((c) => c.id === newConversationId)?.createdAt ??
            new Date().toISOString(),
          messages: finalMessages,
        };

        const others = prev.filter((c) => c.id !== updated.id);
        return [updated, ...others];
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setIsStreaming(false);
      setInput("");
      abortRef.current = null;
    }
  };

  const abortStream = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const deleteConversation = async (id: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to delete conversation");
      }

      let fallback: Conversation | undefined;
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        fallback = remaining[0];
        return remaining;
      });
      if (conversationId === id || conversationIdRef.current === id) {
        setConversationId(fallback?.id ?? null);
        setMessages(fallback?.messages ?? []);
        conversationIdRef.current = fallback?.id ?? null;
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      const shouldPin = !next.has(id);
      if (shouldPin) {
        next.add(id);
      } else {
        next.delete(id);
      }
      fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: id, pinned: shouldPin }),
      }).catch((err) => console.error("pin-error", err));
      return next;
    });
  };

  const pinnedMessages = messages.filter((m) => pinnedIds.has(m.id));
  const persistTheme = async (name: string, mode: "light" | "dark") => {
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeName: name, themeMode: mode }),
      });
    } catch (err) {
      console.error("Failed to persist theme", err);
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to delete message");
      }

      setMessages((prev) => prev.filter((m) => m.id !== id));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: c.messages.filter((m) => m.id !== id) }
            : c
        )
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  const speak = (text: string, opts?: { replace?: boolean }) => {
    if (typeof window === "undefined" || !voiceEnabled) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.rate = 1;

    if (listening) {
      wasListeningDuringSpeak.current = true;
      stopListening();
    }

    utterance.onend = () => {
      if (wasListeningDuringSpeak.current && voiceEnabled) {
        wasListeningDuringSpeak.current = false;
        startListening();
      }
    };

    if (opts?.replace) {
      window.speechSynthesis.cancel();
    }
    window.speechSynthesis.speak(utterance);
  };

  const lastSpokenIdRef = useRef<string | null>(null);
  const lastSpokenLenRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!voiceEnabled) return;
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.content.trim());
    if (!lastAssistant) return;

    const isNewMessage = lastSpokenIdRef.current !== lastAssistant.id;
    if (isNewMessage) {
      lastSpokenIdRef.current = lastAssistant.id;
      lastSpokenLenRef.current = 0;
      // Cancel any ongoing speech for new assistant turn
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    }

    const alreadySpoken = lastSpokenLenRef.current;
    const currentText = lastAssistant.content;
    if (currentText.length > alreadySpoken) {
      const delta = currentText.slice(alreadySpoken);
      speak(delta);
      lastSpokenLenRef.current = currentText.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, voiceEnabled]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError("Speech recognition not supported in this browser.");
      return;
    }
    if (!recognitionRef.current) {
      const recog = new SpeechRecognitionCtor() as SpeechRecognitionInstance;
      recog.continuous = true;
      recog.lang = "en-US";
      recog.interimResults = true;
      recog.maxAlternatives = 1;
      recog.onresult = (event: any) => {
        const speechEvent = event as any;
        const resultsList = speechEvent?.results as SpeechRecognitionResultList | undefined;
        if (!resultsList || resultsList.length === 0) return;
        const idx =
          typeof speechEvent.resultIndex === "number" && speechEvent.resultIndex >= 0
            ? speechEvent.resultIndex
            : resultsList.length - 1;
        const lastResult = resultsList[idx] as SpeechRecognitionResult;
        const transcript = Array.from(lastResult)
          .map((alt) => alt?.transcript ?? "")
          .join(" ")
          .trim();
        if (!transcript) return;
        setInput(transcript);
        resizeTextarea(transcript);
        if (lastResult.isFinal) {
          pendingTranscriptRef.current = transcript;
        }
      };
      recog.onerror = () => {
        listeningRef.current = false;
        setListening(false);
      };
      recog.onend = () => {
        const finalText = pendingTranscriptRef.current?.trim();
        pendingTranscriptRef.current = null;
        if (finalText) {
          setInput(finalText);
          resizeTextarea(finalText);
          // Send once per utterance after it finishes.
          sendMessage(finalText);
        }
        if (listeningRef.current && isDesktop) {
          recog.start();
          return;
        }
        listeningRef.current = false;
        setListening(false);
      };
      recognitionRef.current = recog;
    }
    listeningRef.current = true;
    setListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    listeningRef.current = false;
    pendingTranscriptRef.current = null;
    setListening(false);
  };

  return (
    <div
      className={`flex h-screen w-full overflow-hidden bg-gradient-to-br ${theme.bg} ${textPrimary} transition-colors duration-200`}
    >
      {!isDesktop && sidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}
      <button
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        onClick={() => setSidebarOpen((s) => !s)}
        className="fixed left-3 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur transition hover:-translate-y-0.5 lg:hidden"
      >
        <ChevronLeftIcon
          className={`h-4 w-4 transition ${sidebarOpen ? "" : "rotate-180"}`}
        />
      </button>
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex h-full w-[80vw] max-w-xs flex-col gap-4 overflow-hidden border-b ${theme.border} ${theme.card} px-5 py-6 backdrop-blur transition-transform duration-300 ease-in-out ${
          sidebarOpen
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "-translate-x-full opacity-0 pointer-events-none"
        } lg:relative lg:w-80 lg:translate-x-0 lg:border-b-0 lg:border-r lg:opacity-100 lg:pointer-events-auto`}
      >
        <div className="flex items-center gap-3 rounded-xl border px-3 py-3" style={{ borderColor: headerBorderColor }}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
            <UserIcon className={`h-5 w-5 ${textPrimary}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-xs uppercase tracking-[0.25em] ${textSecondary}`}
            >
              Gemini Agent
            </p>
            <p className={`truncate text-base font-semibold ${textPrimary}`}>
              {userName ? userName : "Welcome"}
            </p>
          </div>
        </div>
        <button
          onClick={startNewConversation}
          className={`mt-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 ${theme.accent}`}
        >
          + New conversation
        </button>
        <div className="flex-1 space-y-2 overflow-y-auto pr-1 text-sm">
          {conversations.length === 0 && (
            <p
              className={`rounded-lg border border-dashed ${panelBorder} px-3 py-2 ${textSecondary}`}
            >
              Start your first conversation
            </p>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group relative flex w-full items-center gap-2 rounded-lg border ${panelBorder} px-3 py-2 text-left transition ${
                c.id === conversationId
                  ? `${panelBg} ${textPrimary} ring-1 ring-white/25`
                  : `${panelBg} ${textSecondary} hover:bg-white/60`
              }`}
              onTouchStart={() => handleConversationTouchStart(c.id)}
              onTouchEnd={handleConversationTouchEnd}
              onTouchCancel={handleConversationTouchEnd}
            >
              <button
                onClick={() => onSelectConversation(c.id)}
                className="flex-1 text-left"
              >
                <span className={`line-clamp-1 font-medium ${textPrimary}`}>
                  {c.title || "Untitled conversation"}
                </span>
                <span className={`text-xs ${textSecondary}`}>
                  {format(new Date(c.createdAt), "MMM d, h:mm a")}
                </span>
              </button>
              <div
                className={`flex gap-1 transition ${
                  activeConversationActions === c.id ? "opacity-100" : ""
                } lg:opacity-0 lg:group-hover:opacity-100 lg:flex-row lg:items-center`}
              >
                <div className="flex flex-col items-center gap-2 lg:flex-row">
                  <button
                    onClick={() => deleteConversation(c.id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${chipBorder} ${chipBg} text-xs ${chipText} transition hover:bg-white/10`}
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </button>
                  <button
                    onClick={() => setOpenSummaryId((prev) => (prev === c.id ? null : c.id))}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${chipBorder} ${chipBg} text-xs ${chipText} transition hover:bg-white/10`}
                  >
                    <InformationCircleIcon className="h-4 w-4" />
                    <span className="sr-only">Info</span>
                  </button>
                </div>
              </div>

              {openSummaryId === c.id && (
                <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-white/20 bg-black/80 p-3 text-xs text-white shadow-xl backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Summary</span>
                    <button
                      onClick={() => setOpenSummaryId(null)}
                      className="text-[10px] uppercase tracking-[0.2em] text-slate-200 hover:opacity-80"
                    >
                      Close
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-slate-200">
                    {c.summary?.trim() || "No summary yet."}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {!isDesktop && (
        <>
          {controlsOpen && (
            <button
              aria-label="Close controls overlay"
              onClick={() => setControlsOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            />
          )}
          <button
            onClick={() => setControlsOpen((o) => !o)}
            className="fixed right-0 top-1/2 z-50 flex h-14 w-11 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-white/25 bg-black/60 text-white shadow-xl backdrop-blur transition hover:-translate-y-[52%] md:hidden"
            aria-label="Toggle controls drawer"
          >
            <ChevronLeftIcon
              className={`h-5 w-5 transition ${controlsOpen ? "rotate-180" : "rotate-0"}`}
            />
          </button>
          <aside
            className={`fixed right-0 top-1/2 z-50 -translate-y-1/2 w-14 max-w-[80vw] space-y-2 rounded-l-2xl border-l ${theme.border} ${theme.card} px-2 py-3 shadow-2xl backdrop-blur transition-transform duration-300 ease-in-out ${
              controlsOpen ? "translate-x-0" : "translate-x-full"
            } md:hidden`}
          >
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  setThemeMode((m) => {
                    const next = m === "dark" ? "light" : "dark";
                    persistTheme(THEMES[themeIndex].name, next);
                    return next;
                  });
                }}
                className={`${iconBtn} h-10 w-10`}
                title="Toggle theme mode"
              >
                {themeMode === "dark" ? (
                  <MoonIcon className="h-4 w-4" />
                ) : (
                  <SunIcon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => {
                  setThemeIndex((idx) => {
                    const next = (idx + 1) % THEMES.length;
                    persistTheme(THEMES[next].name, themeMode);
                    return next;
                  });
                }}
                className={`${iconBtn} h-10 w-10`}
                title="Cycle theme"
              >
                <SwatchIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setShowPinned((p) => !p);
                  setControlsOpen(false);
                }}
                className={`${iconBtn} h-10 w-10`}
                title="Pinned messages"
              >
                <BookmarkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setVoiceEnabled((v) => !v)}
                className={`${iconBtn} h-10 w-10 ${voiceEnabled ? "ring-2 ring-emerald-400/60" : ""}`}
                title="Toggle voice playback"
              >
                <SpeakerWaveIcon className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </>
      )}

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-gradient-to-r from-white/10 via-white/5 to-transparent px-6 py-4 backdrop-blur"
          style={{ borderColor: headerBorderColor }}
        >
          <div className="min-w-0">
            <p className={`text-sm uppercase tracking-[0.2em] ${textSecondary}`}>
              Conversation
            </p>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-semibold ${textPrimary} truncate`}>
                {currentTitle}
              </h1>
              {listening && (
                <span
                  className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.35)] animate-pulse"
                  aria-label="Listening"
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden items-center gap-2 md:flex">
              <div
                className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-semibold ${textPrimary}`}
                style={{
                  borderColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)",
                }}
              >
                <button
                  onClick={() => {
                    setThemeMode((m) => {
                      const next = m === "dark" ? "light" : "dark";
                      persistTheme(THEMES[themeIndex].name, next);
                      return next;
                    });
                  }}
                  className={`flex items-center gap-1 rounded-full px-2 py-1 transition ${isDark ? "hover:bg-white/10" : "hover:bg-slate-100"}`}
                  title="Toggle theme mode"
                >
                  {themeMode === "dark" ? (
                    <>
                      <MoonIcon className="h-4 w-4" />
                      <span>Dark</span>
                    </>
                  ) : (
                    <>
                      <SunIcon className="h-4 w-4" />
                      <span>Light</span>
                    </>
                  )}
                </button>
                <select
                  value={themeIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setThemeIndex(idx);
                    persistTheme(THEMES[idx].name, themeMode);
                  }}
                  className={`rounded-full bg-transparent px-2 py-1 text-xs outline-none ${textPrimary}`}
                >
                  {THEMES.map((t, idx) => (
                    <option
                      key={t.name}
                      value={idx}
                      className={
                        isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"
                      }
                    >
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowPinned((p) => !p)}
                className={headerBtn}
              >
                {showPinned ? "Close Pins" : "Pinned"}
              </button>
              <button
                onClick={() => setVoiceEnabled((v) => !v)}
                className={headerBtn}
              >
                {voiceEnabled ? "Voice: On" : "Voice: Off"}
              </button>
              <button
                onClick={() => (listening ? stopListening() : startListening())}
                className={`${headerBtn} ${
                  listening ? "bg-red-500/30 border-red-400" : ""
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {listening && (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.35)] animate-pulse"
                      aria-label="Listening"
                    />
                  )}
                  {listening ? "Stop Mic" : "Speak"}
                </span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className={`${headerBtn} px-4`}
              >
                Sign out
              </button>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className={iconBtn}
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`flex-1 space-y-4 overflow-y-auto px-6 py-6 ${
            showPinned ? "lg:grid lg:grid-cols-[2fr_1fr] lg:gap-4" : ""
          }`}
        >
          {messages.length === 0 && (
            <div className={`rounded-2xl border ${panelBorder} ${panelBg} p-6 ${textSecondary} shadow-xl`}>
              <p className={`text-lg font-semibold ${textPrimary}`}>
                Ask anything, get streaming answers from Gemini.
              </p>
              <p className={`mt-2 text-sm ${textSecondary}`}>
                Start by typing a prompt below. Agentic behaviors and tool calls
                can be added on top of this scaffold.
              </p>
            </div>
          )}
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`group relative max-w-3xl rounded-2xl px-4 py-3 text-sm shadow-lg ring-1 ${
                    msg.role === "assistant"
                      ? `${theme.bubbleAI}`
                      : `${theme.bubbleUser}`
                  }`}
                  onTouchStart={() => handleMessageTouchStart(msg.id)}
                  onTouchEnd={handleMessageTouchEnd}
                  onTouchCancel={handleMessageTouchEnd}
                >
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className={`absolute -right-3 -top-3 rounded-full border ${chipBorder} ${chipBg} px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${chipText} transition hover:bg-white/70 ${
                      activeMessageActions === msg.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => togglePin(msg.id)}
                    className={`absolute -right-3 top-6 rounded-full border ${chipBorder} ${chipBg} px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${chipText} transition hover:bg-white/70 ${
                      activeMessageActions === msg.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {pinnedIds.has(msg.id) ? "Unpin" : "Pin"}
                  </button>
                  <div className={`prose ${isDark ? "prose-invert" : ""} max-w-none text-sm leading-relaxed prose-p:my-1 prose-pre:bg-slate-900/70 prose-code:text-[13px]`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p {...props} className="my-1" />,
                      }}
                    >
                      {msg.content ||
                        (isStreaming && msg.role === "assistant"
                          ? "Thinking..."
                          : "")}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showPinned && (
            <div className={`hidden h-full flex-col space-y-2 rounded-2xl border ${panelBorder} ${panelBg} p-4 lg:flex`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-semibold uppercase tracking-[0.2em] ${textSecondary}`}>
                  Pinned
                </h3>
                <span className={`text-xs ${textSecondary}`}>
                  {pinnedMessages.length}
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {pinnedMessages.length === 0 && (
                  <p className={`text-xs ${textSecondary}`}>
                    Pin any message to see it here.
                  </p>
                )}
                {pinnedMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-xl border ${panelBorder} ${panelBg} px-3 py-2 text-sm ${textPrimary} shadow`}
                  >
                    <div className={`flex items-center justify-between text-xs ${textSecondary}`}>
                      <span>{m.role === "assistant" ? "Assistant" : "You"}</span>
                      <button
                        onClick={() => togglePin(m.id)}
                        className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] transition hover:bg-white/10 ${textPrimary}`}
                      >
                        Unpin
                      </button>
                    </div>
                    <div className={`prose ${isDark ? "prose-invert" : ""} max-w-none text-sm leading-relaxed prose-p:my-1`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showPinned && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm lg:hidden">
              <div className={`relative w-full max-w-lg rounded-2xl border ${panelBorder} ${panelBg} p-4 shadow-2xl`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className={`text-sm font-semibold uppercase tracking-[0.2em] ${textSecondary}`}>
                    Pinned
                  </h3>
                  <button
                    onClick={() => setShowPinned(false)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${textPrimary} transition hover:bg-white/10`}
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                  {pinnedMessages.length === 0 && (
                    <p className={`text-xs ${textSecondary}`}>
                      Pin any message to see it here.
                    </p>
                  )}
                  {pinnedMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl border ${panelBorder} ${panelBg} px-3 py-2 text-sm ${textPrimary} shadow`}
                    >
                      <div className={`flex items-center justify-between text-xs ${textSecondary}`}>
                        <span>{m.role === "assistant" ? "Assistant" : "You"}</span>
                        <button
                          onClick={() => togglePin(m.id)}
                          className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] transition hover:bg-white/10 ${textPrimary}`}
                        >
                          Unpin
                        </button>
                      </div>
                      <div className={`prose ${isDark ? "prose-invert" : ""} max-w-none text-sm leading-relaxed prose-p:my-1`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`border-t ${theme.border} bg-black/10 px-6 py-4 backdrop-blur`}>
          {error && (
            <div className="mb-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {error}
            </div>
          )}
          <div className="relative flex items-end gap-3">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the agent..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className={`min-h-[60px] w-full resize-none rounded-2xl border px-4 py-3 pr-16 text-sm shadow-inner outline-none transition focus:ring-2 ${
                  isDark
                    ? "border-white/15 bg-white/5 text-white focus:border-white/40 focus:ring-white/20 placeholder:text-slate-400"
                    : "border-slate-300 bg-white text-slate-900 focus:border-slate-400 focus:ring-slate-200 placeholder:text-slate-500"
                }`}
              />
              {!isDesktop && (
                <button
                  onClick={
                    isStreaming
                      ? abortStream
                      : () => {
                          void sendMessage();
                        }
                  }
                  className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white shadow-md transition ${
                    isStreaming ? "bg-red-500/80 hover:bg-red-500" : theme.accent
                  } md:hidden`}
                  aria-label={isStreaming ? "Stop" : "Send"}
                >
                  {isStreaming ? (
                    <span className="text-xs font-semibold">Stop</span>
                  ) : (
                    <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
                  )}
                </button>
              )}
              {!isDesktop && (
                <button
                  onClick={() => (listening ? stopListening() : startListening())}
                  className={`absolute -right-2 -top-8 z-0 flex h-11 w-11 items-center justify-center rounded-full border ${
                    isDark
                      ? "border-white/25 bg-white/10 text-white"
                      : "border-slate-300 bg-white text-slate-900"
                  } shadow-lg backdrop-blur transition ${
                    listening ? "ring-2 ring-emerald-400/60" : "hover:-translate-y-0.5"
                  }`}
                  title={listening ? "Stop mic" : "Start mic"}
                >
                  <span className="relative">
                    {listening && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.35)] animate-pulse" />
                    )}
                    <MicrophoneIcon className="h-5 w-5" />
                  </span>
                </button>
              )}
            </div>
            <button
              onClick={
                isStreaming
                  ? abortStream
                  : () => {
                      void sendMessage();
                    }
              }
              className={`hidden h-12 min-w-[120px] items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white transition md:flex ${
                isStreaming ? "bg-red-500/80 hover:bg-red-500" : theme.accent
              }`}
            >
              {isStreaming ? (
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Stop</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span>Send</span>
                </span>
              )}
            </button>
          </div>
          <p className={`mt-2 text-[11px] uppercase tracking-[0.25em] ${textSecondary}`}>
            Streaming via Gemini
          </p>
        </div>
      </main>
    </div>
  );
}
