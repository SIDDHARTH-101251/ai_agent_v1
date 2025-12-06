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
  PhotoIcon,
  MicrophoneIcon,
  ChartBarIcon,
  PencilSquareIcon,
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
  {
    name: "Midnight",
    mode: {
      light: {
        bg: "from-slate-100 via-white to-indigo-100",
        card: "bg-white text-slate-900 ring-indigo-200/90",
        accent: "bg-indigo-800 hover:bg-indigo-700",
        bubbleUser: "bg-indigo-800 text-white ring-indigo-300/70",
        bubbleAI: "bg-white text-slate-900 ring-indigo-200/80",
        border: "border-indigo-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-indigo-950",
        card: "bg-white/5 text-indigo-50 ring-white/15",
        accent: "bg-fuchsia-500 hover:bg-fuchsia-400",
        bubbleUser: "bg-fuchsia-500/85 text-white ring-fuchsia-300/40",
        bubbleAI: "bg-white/10 text-indigo-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Coral",
    mode: {
      light: {
        bg: "from-rose-50 via-white to-orange-50",
        card: "bg-white text-rose-950 ring-rose-200/90",
        accent: "bg-rose-500 hover:bg-rose-400",
        bubbleUser: "bg-rose-500 text-white ring-rose-300/70",
        bubbleAI: "bg-white text-rose-900 ring-rose-200/80",
        border: "border-rose-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-rose-950",
        card: "bg-white/5 text-rose-50 ring-rose-200/15",
        accent: "bg-orange-500 hover:bg-orange-400",
        bubbleUser: "bg-orange-500/85 text-white ring-orange-300/40",
        bubbleAI: "bg-white/10 text-rose-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Glacier",
    mode: {
      light: {
        bg: "from-sky-50 via-white to-cyan-50",
        card: "bg-white text-slate-900 ring-cyan-200/90",
        accent: "bg-cyan-600 hover:bg-cyan-500",
        bubbleUser: "bg-cyan-600 text-white ring-cyan-300/70",
        bubbleAI: "bg-white text-slate-900 ring-cyan-200/80",
        border: "border-cyan-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-cyan-950",
        card: "bg-white/5 text-slate-50 ring-white/15",
        accent: "bg-cyan-500 hover:bg-cyan-400",
        bubbleUser: "bg-cyan-500/85 text-white ring-cyan-300/40",
        bubbleAI: "bg-white/10 text-slate-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Lavender",
    mode: {
      light: {
        bg: "from-indigo-50 via-white to-purple-50",
        card: "bg-white text-indigo-950 ring-indigo-200/90",
        accent: "bg-purple-600 hover:bg-purple-500",
        bubbleUser: "bg-purple-600 text-white ring-purple-300/70",
        bubbleAI: "bg-white text-indigo-900 ring-indigo-200/80",
        border: "border-indigo-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-purple-950",
        card: "bg-white/5 text-indigo-50 ring-white/15",
        accent: "bg-purple-500 hover:bg-purple-400",
        bubbleUser: "bg-purple-500/85 text-white ring-purple-300/40",
        bubbleAI: "bg-white/10 text-indigo-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Solar",
    mode: {
      light: {
        bg: "from-yellow-50 via-amber-50 to-orange-50",
        card: "bg-white text-amber-950 ring-amber-200/90",
        accent: "bg-amber-500 hover:bg-amber-400",
        bubbleUser: "bg-amber-500 text-white ring-amber-300/70",
        bubbleAI: "bg-white text-amber-900 ring-amber-200/80",
        border: "border-amber-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-amber-900",
        card: "bg-white/5 text-amber-50 ring-amber-200/15",
        accent: "bg-amber-400 hover:bg-amber-300",
        bubbleUser: "bg-amber-400/85 text-amber-950 ring-amber-200/50",
        bubbleAI: "bg-white/10 text-amber-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Neon",
    mode: {
      light: {
        bg: "from-cyan-50 via-white to-fuchsia-50",
        card: "bg-white text-teal-900 ring-teal-200/90",
        accent: "bg-teal-500 hover:bg-teal-400",
        bubbleUser: "bg-teal-500 text-white ring-teal-300/70",
        bubbleAI: "bg-white text-teal-900 ring-teal-200/80",
        border: "border-teal-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-teal-950",
        card: "bg-white/5 text-teal-50 ring-white/15",
        accent: "bg-fuchsia-500 hover:bg-fuchsia-400",
        bubbleUser: "bg-fuchsia-500/85 text-white ring-fuchsia-300/40",
        bubbleAI: "bg-white/10 text-teal-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Desert",
    mode: {
      light: {
        bg: "from-amber-100 via-orange-50 to-stone-50",
        card: "bg-white text-amber-950 ring-amber-200/90",
        accent: "bg-amber-700 hover:bg-amber-600",
        bubbleUser: "bg-amber-700 text-white ring-amber-300/70",
        bubbleAI: "bg-white text-amber-900 ring-amber-200/80",
        border: "border-amber-200/80",
      },
      dark: {
        bg: "from-stone-950 via-stone-900 to-amber-900",
        card: "bg-white/5 text-amber-50 ring-amber-200/15",
        accent: "bg-amber-600 hover:bg-amber-500",
        bubbleUser: "bg-amber-600/90 text-amber-50 ring-amber-300/40",
        bubbleAI: "bg-white/10 text-amber-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Ocean",
    mode: {
      light: {
        bg: "from-teal-50 via-white to-cyan-50",
        card: "bg-white text-slate-900 ring-teal-200/90",
        accent: "bg-teal-600 hover:bg-teal-500",
        bubbleUser: "bg-teal-600 text-white ring-teal-300/70",
        bubbleAI: "bg-white text-slate-900 ring-teal-200/80",
        border: "border-teal-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-teal-950",
        card: "bg-white/5 text-slate-50 ring-white/15",
        accent: "bg-teal-500 hover:bg-teal-400",
        bubbleUser: "bg-teal-500/85 text-white ring-teal-300/40",
        bubbleAI: "bg-white/10 text-slate-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Mint",
    mode: {
      light: {
        bg: "from-emerald-50 via-white to-lime-100",
        card: "bg-white text-emerald-950 ring-emerald-200/90",
        accent: "bg-emerald-500 hover:bg-emerald-400",
        bubbleUser: "bg-emerald-500 text-white ring-emerald-300/70",
        bubbleAI: "bg-white text-emerald-900 ring-emerald-200/80",
        border: "border-emerald-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-emerald-950",
        card: "bg-white/5 text-emerald-50 ring-emerald-200/15",
        accent: "bg-emerald-400 hover:bg-emerald-300",
        bubbleUser: "bg-emerald-400/90 text-emerald-950 ring-emerald-200/50",
        bubbleAI: "bg-white/10 text-emerald-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Blush",
    mode: {
      light: {
        bg: "from-pink-50 via-white to-rose-100",
        card: "bg-white text-rose-950 ring-rose-200/90",
        accent: "bg-pink-600 hover:bg-pink-500",
        bubbleUser: "bg-pink-600 text-white ring-pink-300/70",
        bubbleAI: "bg-white text-rose-900 ring-rose-200/80",
        border: "border-rose-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-rose-950",
        card: "bg-white/5 text-rose-50 ring-rose-200/15",
        accent: "bg-pink-500 hover:bg-pink-400",
        bubbleUser: "bg-pink-500/85 text-white ring-pink-300/40",
        bubbleAI: "bg-white/10 text-rose-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Slate",
    mode: {
      light: {
        bg: "from-slate-50 via-white to-gray-100",
        card: "bg-white text-slate-950 ring-slate-200/90",
        accent: "bg-slate-700 hover:bg-slate-600",
        bubbleUser: "bg-slate-700 text-white ring-slate-300/70",
        bubbleAI: "bg-white text-slate-900 ring-slate-200/80",
        border: "border-slate-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-neutral-950",
        card: "bg-white/5 text-slate-50 ring-white/15",
        accent: "bg-slate-500 hover:bg-slate-400",
        bubbleUser: "bg-slate-500/85 text-white ring-slate-300/40",
        bubbleAI: "bg-white/10 text-slate-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Citrus",
    mode: {
      light: {
        bg: "from-orange-50 via-white to-lime-50",
        card: "bg-white text-lime-950 ring-lime-200/90",
        accent: "bg-orange-500 hover:bg-orange-400",
        bubbleUser: "bg-orange-500 text-white ring-orange-300/70",
        bubbleAI: "bg-white text-lime-900 ring-lime-200/80",
        border: "border-lime-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-lime-950",
        card: "bg-white/5 text-lime-50 ring-lime-200/15",
        accent: "bg-lime-500 hover:bg-lime-400",
        bubbleUser: "bg-lime-500/85 text-lime-950 ring-lime-300/40",
        bubbleAI: "bg-white/10 text-lime-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Royal",
    mode: {
      light: {
        bg: "from-indigo-50 via-white to-purple-100",
        card: "bg-white text-indigo-950 ring-indigo-200/90",
        accent: "bg-indigo-700 hover:bg-indigo-600",
        bubbleUser: "bg-indigo-700 text-white ring-indigo-300/70",
        bubbleAI: "bg-white text-indigo-900 ring-indigo-200/80",
        border: "border-indigo-200/80",
      },
      dark: {
        bg: "from-slate-950 via-indigo-900 to-purple-950",
        card: "bg-white/5 text-indigo-50 ring-white/15",
        accent: "bg-purple-500 hover:bg-purple-400",
        bubbleUser: "bg-purple-500/85 text-white ring-purple-300/40",
        bubbleAI: "bg-white/10 text-indigo-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Vapor",
    mode: {
      light: {
        bg: "from-sky-50 via-white to-rose-50",
        card: "bg-white text-slate-900 ring-sky-200/90",
        accent: "bg-sky-400 hover:bg-sky-300",
        bubbleUser: "bg-sky-400 text-white ring-sky-200/70",
        bubbleAI: "bg-white text-slate-900 ring-sky-200/80",
        border: "border-sky-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-rose-950",
        card: "bg-white/5 text-slate-50 ring-white/15",
        accent: "bg-rose-400 hover:bg-rose-300",
        bubbleUser: "bg-rose-400/85 text-slate-900 ring-rose-200/50",
        bubbleAI: "bg-white/10 text-slate-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Mono",
    mode: {
      light: {
        bg: "from-gray-100 via-white to-gray-50",
        card: "bg-white text-gray-900 ring-gray-200/90",
        accent: "bg-gray-800 hover:bg-gray-700",
        bubbleUser: "bg-gray-800 text-white ring-gray-300/70",
        bubbleAI: "bg-white text-gray-900 ring-gray-200/80",
        border: "border-gray-200/80",
      },
      dark: {
        bg: "from-gray-950 via-gray-900 to-gray-950",
        card: "bg-white/5 text-gray-50 ring-white/15",
        accent: "bg-gray-600 hover:bg-gray-500",
        bubbleUser: "bg-gray-600/85 text-white ring-gray-300/40",
        bubbleAI: "bg-white/10 text-gray-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Copper",
    mode: {
      light: {
        bg: "from-amber-50 via-stone-50 to-orange-100",
        card: "bg-white text-amber-950 ring-amber-200/90",
        accent: "bg-orange-800 hover:bg-orange-700",
        bubbleUser: "bg-orange-800 text-white ring-orange-300/70",
        bubbleAI: "bg-white text-amber-900 ring-amber-200/80",
        border: "border-amber-200/80",
      },
      dark: {
        bg: "from-stone-950 via-slate-900 to-amber-900",
        card: "bg-white/5 text-amber-50 ring-amber-200/15",
        accent: "bg-orange-600 hover:bg-orange-500",
        bubbleUser: "bg-orange-600/90 text-white ring-orange-300/40",
        bubbleAI: "bg-white/10 text-amber-50 ring-white/15",
        border: "border-white/10",
      },
    },
  },
  {
    name: "Orchid",
    mode: {
      light: {
        bg: "from-fuchsia-50 via-white to-purple-100",
        card: "bg-white text-fuchsia-950 ring-fuchsia-200/90",
        accent: "bg-fuchsia-600 hover:bg-fuchsia-500",
        bubbleUser: "bg-fuchsia-600 text-white ring-fuchsia-300/70",
        bubbleAI: "bg-white text-fuchsia-900 ring-fuchsia-200/80",
        border: "border-fuchsia-200/80",
      },
      dark: {
        bg: "from-slate-950 via-slate-900 to-fuchsia-950",
        card: "bg-white/5 text-fuchsia-50 ring-fuchsia-200/15",
        accent: "bg-fuchsia-500 hover:bg-fuchsia-400",
        bubbleUser: "bg-fuchsia-500/85 text-white ring-fuchsia-300/40",
        bubbleAI: "bg-white/10 text-fuchsia-50 ring-white/15",
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
  userImage?: string | null;
  initialConversations: Conversation[];
  initialThemeName?: string;
  initialThemeMode?: string;
  initialPinnedIds?: string[];
  initialFontScale?: number;
};

export function Chat({
  userName,
  userImage,
  initialConversations,
  initialThemeName,
  initialThemeMode,
  initialPinnedIds,
  initialFontScale,
}: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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
  const [showDashboard, setShowDashboard] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    new Set(initialPinnedIds ?? [])
  );
  const [openSummaryId, setOpenSummaryId] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [activeMessageActions, setActiveMessageActions] = useState<string | null>(null);
  const [activeConversationActions, setActiveConversationActions] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [pinnedWidth, setPinnedWidth] = useState(320);
  const pinnedWidthRef = useRef(320);
  const [isResizingPinned, setIsResizingPinned] = useState(false);
  const [dashboardWidth, setDashboardWidth] = useState(380);
  const dashboardWidthRef = useRef(380);
  const [isResizingDashboard, setIsResizingDashboard] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userImage ?? null);
  const [fontScale, setFontScale] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("chatFontScale");
      if (stored) {
        const num = Number(stored);
        if (!Number.isNaN(num) && num > 0.6 && num < 2.5) {
          return num;
        }
      }
    }
    return typeof initialFontScale === "number" && initialFontScale > 0.6 && initialFontScale < 2.5
      ? initialFontScale
      : 1;
  });
  const greeting = useMemo(() => {
    const options = [
      "Hey there! Ready for a fresh conversation?",
      "New chat, new ideas. Ask me anything.",
      "Let’s start something new—what’s on your mind?",
    ];
    return options[Math.floor(Math.random() * options.length)];
  }, []);
  const formatTitle = (value?: string | null) => {
    if (!value) return "";
    return value
      .trim()
      .split(/\s+/)
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
      .join(" ");
  };
  const normalizeForSpeech = (value: string) => {
    return value
      // Strip code fences and inline code.
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]*)`/g, "$1")
      // Strip markdown emphasis/links.
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/[*_~]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove blockquote/heading markers and list bullets.
      .replace(/^>+\s?/gm, "")
      .replace(/^#{1,6}\s*/gm, "")
      .replace(/^\s*[-+]\s+/gm, "")
      // Collapse whitespace.
      .replace(/\s{2,}/g, " ")
      .trim();
  };
  const wasListeningDuringSpeak = useRef(false);
  const listeningRef = useRef(false);
  const pendingTranscriptRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagePressTimer = useRef<number | null>(null);
  const conversationPressTimer = useRef<number | null>(null);
  const pinnedLayoutRef = useRef<HTMLDivElement>(null);

  const currentTitle = useMemo(() => {
    if (!conversationId) return "New Chat";
    const active = conversations.find((c) => c.id === conversationId);
    if (!active) return "New Chat";
    const formatted = formatTitle(active.title);
    return formatted || "Untitled Conversation";
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
  const userInitial =
    userName && userName.trim()
      ? formatTitle(userName)
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0])
          .join("")
          .toUpperCase()
      : "U";
  const iconBtn =
    `flex h-9 w-9 items-center justify-center rounded-full border ${chipBorder} ${chipBg} text-xs font-semibold ${textPrimary} transition ` +
    (isDark ? "hover:border-white hover:bg-white/10" : "hover:border-slate-400 hover:bg-white");
  const toolbarShell = `flex items-center gap-1 rounded-full border ${panelBorder} ${
    isDark ? "bg-white/10" : "bg-white/70"
  } px-2 py-1 text-xs font-semibold ${textPrimary} shadow-sm backdrop-blur`;
  const toggleBase = "flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold transition";
  const toggleIdle = isDark ? "text-white/90 hover:bg-white/10" : "text-slate-800 hover:bg-slate-100";
  const toggleActive = isDark
    ? "bg-emerald-500/15 text-emerald-50 ring-1 ring-emerald-300/60"
    : "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300/60";
  const toggleAlert = isDark
    ? "bg-rose-500/20 text-rose-50 ring-1 ring-rose-300/60"
    : "bg-rose-100 text-rose-900 ring-1 ring-rose-300/60";
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

  useEffect(() => {
    if (isDesktop) return;
    let startX = 0;
    let startY = 0;
    let trackingHorizontal = false;
    let handled = false;
    const threshold = 28;
    const edgeTolerance = 60;

    const handleStart = (e: TouchEvent) => {
      const t = e.touches?.[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      trackingHorizontal = false;
      handled = false;
    };

    const handleMove = (e: TouchEvent) => {
      const t = e.touches?.[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (!trackingHorizontal) {
        if (Math.abs(dx) > Math.abs(dy) + 6) {
          trackingHorizontal = true;
        } else if (Math.abs(dy) > 10) {
          return;
        }
      }
      if (!trackingHorizontal || handled) return;

      if (!sidebarOpen && startX <= edgeTolerance && dx > threshold) {
        handled = true;
        setSidebarOpen(true);
        setActiveConversationActions(null);
        setRenameTargetId(null);
        setOpenSummaryId(null);
        return;
      }

      if (sidebarOpen && dx < -threshold) {
        handled = true;
        setSidebarOpen(false);
        setActiveConversationActions(null);
        setRenameTargetId(null);
        setOpenSummaryId(null);
      }
    };

    const handleEnd = () => {
      startX = 0;
      startY = 0;
      trackingHorizontal = false;
      handled = false;
    };

    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDesktop, sidebarOpen]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("chatFontScale", fontScale.toString());
  }, [fontScale]);

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
      setOpenSummaryId(null);
      setRenameTargetId(null);
      if (!isDesktop) {
        startRename(id);
      } else {
        setActiveConversationActions(id);
      }
    }, 400);
  };

  const handleAvatarChange = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setAvatarUrl(dataUrl);
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      if (!res.ok) return;
      const payload = (await res.json().catch(() => ({}))) as { image?: string };
      if (payload.image) {
        setAvatarUrl(payload.image);
      }
    };
    reader.readAsDataURL(file);
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
    conversationIdRef.current = id;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lastConversationId", id);
    }
    setActiveMessageActions(null);
    setActiveConversationActions(null);
  };

  const startNewConversation = () => {
    setConversationId(null);
    conversationIdRef.current = null;
    setMessages([]);
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("lastConversationId");
    }
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
        if (typeof window !== "undefined") {
          window.localStorage.setItem("lastConversationId", newConversationId);
        }
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
        if (typeof window !== "undefined") {
          if (fallback?.id) {
            window.localStorage.setItem("lastConversationId", fallback.id);
          } else {
            window.localStorage.removeItem("lastConversationId");
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  const renameConversation = async (id: string, nextTitle: string) => {
    const trimmed = nextTitle.trim();
    if (!trimmed) return;
    try {
      setRenamingId(id);
      setError(null);
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to rename conversation");
      }
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
      );
      setRenameTargetId(null);
      setRenameValue("");
      setActiveConversationActions(null);
      if (conversationId === id) {
        setConversationId(id);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setRenamingId((prev) => (prev === id ? null : prev));
    }
  };

  const startRename = (id: string) => {
    const existing = conversations.find((c) => c.id === id);
    setRenameTargetId(id);
    setRenameValue(existing?.title?.trim() || "Untitled Conversation");
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

  const togglePinnedPanel = () => {
    setShowPinned((prev) => {
      const next = !prev;
      if (next) {
        setSidebarOpen(false);
        setShowDashboard(false);
      }
      return next;
    });
  };

  const toggleDashboardPanel = () => {
    setShowDashboard((prev) => {
      const next = !prev;
      if (next) {
        setSidebarOpen(false);
        setShowPinned(false);
      }
      return next;
    });
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const layout = pinnedLayoutRef.current;
      if (!layout) return;
      if (isResizingPinned || isResizingDashboard) {
        const rect = layout.getBoundingClientRect();
        const maxWidth = Math.max(260, rect.width - 120);
        const newWidth = Math.min(maxWidth, Math.max(200, rect.right - e.clientX));
        if (isResizingPinned) {
          pinnedWidthRef.current = newWidth;
          setPinnedWidth(newWidth);
        }
        if (isResizingDashboard) {
          dashboardWidthRef.current = newWidth;
          setDashboardWidth(newWidth);
        }
      }
    };
    const handleUp = () => {
      if (isResizingPinned) setIsResizingPinned(false);
      if (isResizingDashboard) setIsResizingDashboard(false);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isResizingPinned, isResizingDashboard]);

  const persistFontScale = async (scale: number) => {
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fontScale: scale }),
      });
    } catch (err) {
      console.error("Failed to persist font scale", err);
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
    const normalized = normalizeForSpeech(text);
    const trimmed = normalized.trim();
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const lastId = window.localStorage.getItem("lastConversationId");
    if (lastId) {
      const target = initialConversations.find((c) => c.id === lastId);
      if (target) {
        setConversationId(target.id);
        setMessages(target.messages ?? []);
        conversationIdRef.current = target.id;
      }
    }
  }, [initialConversations]);

  useEffect(() => {
    setAvatarUrl(userImage ?? null);
  }, [userImage]);

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
      style={{ fontSize: `${fontScale}rem` }}
    >
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={`fixed left-3 top-16 z-30 flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur hover:-translate-y-0.5 ${
            isDark
              ? "border border-white/20 bg-white/10 text-white"
              : "border border-slate-300 bg-white text-slate-900 shadow-slate-200"
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border ${
              isDark ? "border-white/20 bg-black/40" : "border-slate-200 bg-slate-50"
            }`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="User avatar" className="h-full w-full object-cover" />
            ) : (
              <span className={`${isDark ? "text-white" : "text-slate-800"} text-sm`}>
                {userInitial}
              </span>
            )}
          </span>
          <span className={`max-w-[120px] truncate ${isDark ? "text-white" : "text-slate-800"}`}>
            {userName ? formatTitle(userName) : "Welcome"}
          </span>
        </button>
      )}
      {!isDesktop && sidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}
      <button
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        onClick={() => setSidebarOpen((s) => !s)}
        className={`fixed left-2 top-1/2 z-40 hidden -translate-y-1/2 items-center justify-center rounded-full border ${chipBorder} ${chipBg} p-3 shadow-lg backdrop-blur transition hover:-translate-y-[52%] lg:flex ${
          sidebarOpen ? "" : "shadow-emerald-200/40"
        }`}
      >
        <ChevronLeftIcon
          className={`h-5 w-5 transition ${sidebarOpen ? "" : "rotate-180"}`}
        />
      </button>
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex h-full w-[80vw] max-w-xs flex-col gap-4 overflow-hidden border-b ${theme.border} ${theme.card} px-5 py-6 backdrop-blur transition-transform duration-300 ease-in-out ${
          sidebarOpen
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "-translate-x-full opacity-0 pointer-events-none"
        } lg:relative lg:border-b-0 lg:border-r ${
          sidebarOpen
            ? "lg:w-80 lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto"
            : "lg:w-0 lg:-translate-x-full lg:opacity-0 lg:pointer-events-none lg:px-0 lg:py-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-xl border px-3 py-3" style={{ borderColor: headerBorderColor }}>
          <label
            htmlFor="avatar-upload"
            className={`relative flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-full border ${chipBorder} ${chipBg} shadow`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="User avatar" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className={`h-5 w-5 ${textPrimary}`} />
            )}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleAvatarChange(file);
                }
              }}
            />
            {!avatarUrl && (
              <span className="absolute -bottom-1 right-0 rounded-full bg-emerald-500 p-1 shadow">
                <PhotoIcon className="h-3 w-3 text-white" />
              </span>
            )}
          </label>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-base font-semibold ${textPrimary}`}>
              {userName ? formatTitle(userName) : "Welcome"}
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
          {conversations.map((c) => {
            const isActive = c.id === conversationId;
            return (
              <div
                key={c.id}
                className={`group relative flex w-full items-center gap-2 rounded-lg border ${panelBorder} px-3 py-2 text-left transition ${
                  isActive
                    ? `${panelBg} ${textPrimary} ring-1 ring-emerald-300/60 shadow-md`
                    : `${panelBg} ${textSecondary} hover:bg-white/60`
                }`}
                onTouchStart={() => handleConversationTouchStart(c.id)}
                onTouchEnd={handleConversationTouchEnd}
                onTouchCancel={handleConversationTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setActiveConversationActions(c.id);
                  setRenameTargetId(null);
                  setOpenSummaryId(null);
                }}
              >
                {isActive && (
                  <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.25)]" />
                )}
                <button
                  onClick={() => onSelectConversation(c.id)}
                  className="flex-1 text-left pl-1"
                >
                  <span className={`line-clamp-1 font-medium ${textPrimary}`}>
                    {formatTitle(c.title) || "Untitled Conversation"}
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
                      onClick={() => startRename(c.id)}
                      className={`hidden h-8 w-8 items-center justify-center rounded-full border ${chipBorder} ${chipBg} text-xs ${chipText} transition hover:bg-white/10 md:flex`}
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      <span className="sr-only">Rename</span>
                    </button>
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
                {renamingId === c.id && (
                  <div
                    className={`pointer-events-none absolute -bottom-2 right-3 flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${
                      isDark
                        ? "bg-emerald-900/60 text-emerald-200 ring-1 ring-emerald-300/40"
                        : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                    } animate-pulse`}
                  >
                    <span className="flex items-center gap-1">
                      <span aria-hidden>⌫</span>
                      <span>Erasing</span>
                    </span>
                    <span aria-hidden className="text-xs text-emerald-400">•</span>
                    <span className="flex items-center gap-1">
                      <span aria-hidden>✍️</span>
                      <span>Writing</span>
                    </span>
                  </div>
                )}

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
                {renameTargetId === c.id && (
                  <div
                    className={`absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border p-3 text-xs shadow-xl backdrop-blur ${
                      isDark
                        ? "border-white/20 bg-black/85 text-white"
                        : "border-slate-200/90 bg-white text-slate-900"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] uppercase tracking-[0.2em] ${
                          isDark ? "text-slate-200" : "text-slate-600"
                        }`}
                      >
                        Rename Chat
                      </span>
                      <button
                        onClick={() => {
                          setRenameTargetId(null);
                          setRenameValue("");
                        }}
                        className={`text-[11px] font-semibold ${
                          isDark
                            ? "text-slate-200 hover:text-white"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setRenameTargetId(null);
                          setRenameValue("");
                          void renameConversation(c.id, renameValue);
                        }
                        if (e.key === "Escape") {
                          setRenameTargetId(null);
                          setRenameValue("");
                        }
                      }}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-2 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-white/15 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-300/40"
                      placeholder="Conversation title"
                      autoFocus
                    />
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setRenameTargetId(null);
                          setRenameValue("");
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isDark
                            ? "text-slate-200 hover:bg-white/10"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setRenameTargetId(null);
                          setRenameValue("");
                          void renameConversation(c.id, renameValue);
                        }}
                        className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white transition hover:bg-emerald-400"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                  togglePinnedPanel();
                  setControlsOpen(false);
                }}
                className={`${iconBtn} h-10 w-10`}
                title="Pinned messages"
              >
                <BookmarkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  toggleDashboardPanel();
                  setControlsOpen(false);
                }}
                className={`${iconBtn} h-10 w-10`}
                title="Dashboard"
              >
                <ChartBarIcon className="h-4 w-4" />
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
            <p className={`text-xs uppercase tracking-[0.2em] ${textSecondary}`}>
              Conversation
            </p>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-semibold ${textPrimary} truncate`}>
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
            <div className="hidden items-center gap-3 md:flex md:flex-wrap md:justify-end">
              <div className={toolbarShell}>
                <span className={`pl-2 pr-3 text-[11px] uppercase tracking-[0.2em] ${textSecondary}`}>
                  Quick
                </span>
                <button
                  onClick={togglePinnedPanel}
                  className={`${toggleBase} ${showPinned ? toggleActive : toggleIdle}`}
                  title={showPinned ? "Close pinned panel" : "Open pinned panel"}
                >
                  <BookmarkIcon className="h-4 w-4" />
                  <span className="hidden xl:inline">Pins</span>
                </button>
                <button
                  onClick={toggleDashboardPanel}
                  className={`${toggleBase} ${showDashboard ? toggleActive : toggleIdle}`}
                  title={showDashboard ? "Close dashboard" : "Open dashboard"}
                >
                  <ChartBarIcon className="h-4 w-4" />
                  <span className="hidden xl:inline">Dashboard</span>
                </button>
                <button
                  onClick={() => setVoiceEnabled((v) => !v)}
                  className={`${toggleBase} ${voiceEnabled ? toggleActive : toggleIdle}`}
                  title={voiceEnabled ? "Disable voice playback" : "Enable voice playback"}
                >
                  <SpeakerWaveIcon className="h-4 w-4" />
                  <span className="hidden xl:inline">{voiceEnabled ? "Voice on" : "Voice off"}</span>
                </button>
                <button
                  onClick={() => (listening ? stopListening() : startListening())}
                  className={`${toggleBase} ${listening ? toggleAlert : toggleIdle}`}
                  title={listening ? "Stop microphone" : "Start microphone"}
                >
                  <MicrophoneIcon className="h-4 w-4" />
                  <span className="hidden xl:inline">{listening ? "Listening" : "Speak"}</span>
                </button>
              </div>
              <div className={toolbarShell}>
                <span className={`pl-2 pr-3 text-[11px] uppercase tracking-[0.2em] ${textSecondary}`}>
                  Display
                </span>
                <button
                  onClick={() =>
                    setFontScale((v) => {
                      const next = Math.max(0.85, Number((v - 0.05).toFixed(2)));
                      void persistFontScale(next);
                      return next;
                    })
                  }
                  className={`${toggleBase} px-2 py-1 ${toggleIdle}`}
                  title="Decrease font size"
                >
                  A-
                </button>
                <span className="px-2 text-[11px] font-semibold opacity-70">
                  {Math.round(fontScale * 100)}%
                </span>
                <button
                  onClick={() =>
                    setFontScale((v) => {
                      const next = Math.min(1.35, Number((v + 0.05).toFixed(2)));
                      void persistFontScale(next);
                      return next;
                    })
                  }
                  className={`${toggleBase} px-2 py-1 ${toggleIdle}`}
                  title="Increase font size"
                >
                  A+
                </button>
                <span className={`mx-1 hidden h-4 w-px rounded-full ${isDark ? "bg-white/20" : "bg-slate-200"} lg:block`} />
                <button
                  onClick={() => {
                    setThemeMode((m) => {
                      const next = m === "dark" ? "light" : "dark";
                      persistTheme(THEMES[themeIndex].name, next);
                      return next;
                    });
                  }}
                  className={`${toggleBase} ${toggleIdle}`}
                  title="Toggle theme mode"
                >
                  {themeMode === "dark" ? (
                    <>
                      <MoonIcon className="h-4 w-4" />
                      <span className="hidden xl:inline">Dark</span>
                    </>
                  ) : (
                    <>
                      <SunIcon className="h-4 w-4" />
                      <span className="hidden xl:inline">Light</span>
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
                  className={`rounded-full bg-transparent px-2 py-1 text-xs font-semibold outline-none ${textPrimary}`}
                  title="Theme palette"
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
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 ${theme.accent}`}
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span className="hidden xl:inline">Sign out</span>
              </button>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() =>
                  setFontScale((v) => {
                    const next = Math.max(0.85, Number((v - 0.05).toFixed(2)));
                    void persistFontScale(next);
                    return next;
                  })
                }
                className={iconBtn}
                title="Smaller text"
              >
                A-
              </button>
              <button
                onClick={() =>
                  setFontScale((v) => {
                    const next = Math.min(1.35, Number((v + 0.05).toFixed(2)));
                    void persistFontScale(next);
                    return next;
                  })
                }
                className={iconBtn}
                title="Larger text"
              >
                A+
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className={iconBtn}
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={(el) => {
            containerRef.current = el;
            pinnedLayoutRef.current = el;
          }}
          className={`relative flex-1 space-y-4 overflow-y-auto px-6 py-6 ${
            showPinned || showDashboard
              ? "lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-4"
              : ""
          }`}
          style={
            showPinned || showDashboard
              ? {
                  gridTemplateColumns: `minmax(0,1fr) ${
                    showPinned ? pinnedWidth : dashboardWidth
                  }px`,
                }
              : undefined
          }
        >
          {(showPinned || showDashboard) && (
            <div
              className="pointer-events-auto absolute top-0 bottom-0 z-20 hidden w-12 cursor-col-resize lg:block"
              style={{
                left: `calc(100% - ${(showPinned ? pinnedWidth : dashboardWidth) + 6}px)`,
                touchAction: "none",
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                if (showPinned) {
                  setIsResizingPinned(true);
                } else if (showDashboard) {
                  setIsResizingDashboard(true);
                }
              }}
            />
          )}
          {messages.length === 0 && (
            <div className={`rounded-2xl border ${panelBorder} ${panelBg} p-6 ${textSecondary} shadow-xl`}>
              <p className={`text-lg font-semibold ${textPrimary}`}>
                {greeting}
              </p>
              <p className={`mt-2 text-sm ${textSecondary}`}>
                Type or speak to begin. I’ll reply in real time with streaming responses.
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
                  className={`group relative max-w-3xl rounded-2xl px-4 py-3 shadow-lg ring-1 ${
                    msg.role === "assistant"
                      ? `${theme.bubbleAI}`
                      : `${theme.bubbleUser}`
                  }`}
                  style={{ fontSize: `${fontScale}rem` }}
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
                  <div className={`prose ${isDark ? "prose-invert" : ""} max-w-none leading-relaxed prose-p:my-1 prose-pre:bg-slate-900/70 prose-code:text-[13px]`}>
                    {(!msg.content && isStreaming && msg.role === "assistant") ? (
                      <div className="flex items-center gap-3 rounded-lg border border-emerald-300/40 bg-emerald-500/5 px-3 py-2 text-emerald-500">
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:120ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:240ms]" />
                        </div>
                        <span className="text-xs font-semibold tracking-[0.2em] uppercase">Thinking</span>
                        <span className="flex flex-1 items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
                          <span className="h-px flex-1 animate-pulse rounded-full bg-emerald-300/60" />
                        </span>
                      </div>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => <p {...props} className="my-1" />,
                        }}
                      >
                        {msg.content || ""}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showPinned && (
            <div
              className={`hidden h-full flex-col space-y-2 rounded-2xl border ${panelBorder} ${panelBg} p-4 lg:flex`}
              style={{ width: pinnedWidth, minWidth: pinnedWidth, maxWidth: 520 }}
            >
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
                    className={`rounded-xl border ${panelBorder} ${panelBg} px-3 py-2 ${textPrimary} shadow`}
                    style={{ fontSize: `${fontScale}rem` }}
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
                    <div className={`prose ${isDark ? "prose-invert" : ""} max-w-none leading-relaxed prose-p:my-1`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showDashboard && (
            <div
              className={`hidden h-full flex-col space-y-3 rounded-2xl border ${panelBorder} ${panelBg} p-4 lg:flex`}
              style={{ width: dashboardWidth, minWidth: 240, maxWidth: Math.max(320, dashboardWidth) }}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-semibold uppercase tracking-[0.2em] ${textSecondary}`}>
                  Dashboard
                </h3>
                <span className={`text-xs ${textSecondary}`}>Live</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className={`rounded-xl border ${panelBorder} ${panelBg} p-3`}>
                  <p className={`text-xs uppercase tracking-[0.2em] ${textSecondary}`}>Usage</p>
                  <div className="mt-2 h-24 rounded-lg bg-gradient-to-br from-emerald-500/40 via-emerald-400/20 to-transparent" />
                </div>
                <div className={`rounded-xl border ${panelBorder} ${panelBg} p-3`}>
                  <p className={`text-xs uppercase tracking-[0.2em] ${textSecondary}`}>Latencies</p>
                  <div className="mt-2 h-24 rounded-lg bg-gradient-to-br from-indigo-500/30 via-indigo-400/20 to-transparent" />
                </div>
                <div className={`rounded-xl border ${panelBorder} ${panelBg} p-3`}>
                  <p className={`text-xs uppercase tracking-[0.2em] ${textSecondary}`}>System</p>
                  <div className="mt-2 h-24 rounded-lg bg-gradient-to-br from-amber-500/30 via-amber-300/20 to-transparent" />
                </div>
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
                      className={`rounded-xl border ${panelBorder} ${panelBg} px-3 py-2 ${textPrimary} shadow`}
                      style={{ fontSize: `${fontScale}rem` }}
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
                      <div className={`prose ${isDark ? "prose-invert" : ""} max-w-none leading-relaxed prose-p:my-1`}>
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
          {showDashboard && !showPinned && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm lg:hidden">
              <div className={`relative w-full max-w-lg rounded-2xl border ${panelBorder} ${panelBg} p-4 shadow-2xl`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className={`text-sm font-semibold uppercase tracking-[0.2em] ${textSecondary}`}>
                    Dashboard
                  </h3>
                  <button
                    onClick={() => setShowDashboard(false)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${textPrimary} transition hover:bg-white/10`}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3">
                  <div className={`rounded-xl border ${panelBorder} ${panelBg} p-3`}>
                    <p className={`text-xs uppercase tracking-[0.2em] ${textSecondary}`}>Usage</p>
                    <div className="mt-2 h-20 rounded-lg bg-gradient-to-br from-emerald-500/40 via-emerald-400/20 to-transparent" />
                  </div>
                  <div className={`rounded-xl border ${panelBorder} ${panelBg} p-3`}>
                    <p className={`text-xs uppercase tracking-[0.2em] ${textSecondary}`}>Latencies</p>
                    <div className="mt-2 h-20 rounded-lg bg-gradient-to-br from-indigo-500/30 via-indigo-400/20 to-transparent" />
                  </div>
                  <div className={`rounded-xl border ${panelBorder} ${panelBg} p-3`}>
                    <p className={`text-xs uppercase tracking-[0.2em] ${textSecondary}`}>System</p>
                    <div className="mt-2 h-20 rounded-lg bg-gradient-to-br from-amber-500/30 via-amber-300/20 to-transparent" />
                  </div>
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
          <p className={`mt-2 text-center text-[11px] ${textSecondary}`}>
            <span className="mx-auto flex items-center justify-center gap-2 text-center tracking-[0.12em]">
              <span className="flex items-center gap-2">
                <span>Made with love by Siddharth</span>
                <span className="text-red-500">❤️</span>
              </span>
              <span className="text-xs">•</span>
              <span>© {new Date().getFullYear()}</span>
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
