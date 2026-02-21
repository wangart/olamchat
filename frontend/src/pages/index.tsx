import { toast } from "sonner";
import { Geist, Geist_Mono } from "next/font/google";
import { useChatStore } from "../store/chat";
import { useEffect, useRef, useState } from "react";
import { useConversationMessages, useConversations, useModels } from "@/hooks/api";
import { useCreateConversation, useCreateMessage, useEditConversation } from "@/lib/api";
import type { Message } from "@/types/api";
import {
  MessageSquarePlusIcon,
  SendHorizontalIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  MessageCircleIcon,
  SparklesIcon,
  Loader2Icon,
  ChevronDownIcon,
} from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const { data: models, isLoading } = useModels();
  const {
    selectedModel,
    setSelectedModel,
    activeConversationId: activeId,
    setActiveConversationId: selectConversation,
    updateConversation,
  } = useChatStore();
  const { data: conversations } = useConversations();
  const [editConversationId, setEditConversationId] = useState<string | null>(null);
  const [editConversationTitle, setEditConversationTitle] = useState<string>("");
  const { data: messages } = useConversationMessages(activeId);
  const {
    trigger: createConversation,
    isMutating: isCreatingConversation,
    error: createConversationError,
  } = useCreateConversation();
  const {
    trigger: editConversation,
    isMutating: isEditingConversation,
    error: editConversationError,
  } = useEditConversation();
  const {
    trigger: createMessage,
    isMutating: isSendingMessage,
  } = useCreateMessage(activeId);
  const [newMessage, setNewMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startEditing = (c: { id: string; title: string }) => {
    setEditConversationId(c.id);
    setEditConversationTitle(c.title);
  };

  const cancelEditing = () => {
    setEditConversationId(null);
    setEditConversationTitle("");
  };

  const saveEdit = (id: string, title: string) => {
    editConversation({ id, title })
      .then(() => {
        updateConversation(id, title);
        setEditConversationId(null);
      })
      .catch(() => {});
  };

  const handleSend = () => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (!activeId) {
      toast.error("Please select a conversation");
      return;
    }
    createMessage(
      { content: newMessage },
      {
        optimisticData: (current?: Message[]) => [
          ...(current ?? []),
          {
            id: `temp-${Date.now()}`,
            conversationId: activeId,
            role: "user" as const,
            content: newMessage,
            createdAt: new Date().toISOString(),
          },
        ],
        rollbackOnError: true,
      }
    );
    setNewMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation = conversations?.find((c) => c.id === activeId);
  const isWaitingForResponse =
    !!messages && messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} flex h-screen w-full flex-row font-sans`}
    >
      {/* ── Sidebar ── */}
      <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-white/[.06] bg-[#0f0f0f]">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <SparklesIcon className="size-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Olamchat
          </span>
        </div>

        {/* Model selector */}
        <div className="px-3 pb-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2Icon className="size-5 animate-spin text-white/40" />
            </div>
          ) : (
            <div className="relative">
              <select
                className="w-full cursor-pointer appearance-none rounded-lg border border-white/[.08] bg-white/[.04] px-3 py-2 pr-8 text-[13px] text-white/70 transition hover:border-white/[.15] hover:bg-white/[.06] focus:border-violet-500/50 focus:outline-none"
                value={selectedModel ?? ""}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="">Select a model</option>
                {models?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.modelName}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
            </div>
          )}
        </div>

        {/* New Chat button */}
        <div className="px-3 pb-2">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[.08] bg-white/[.04] px-4 py-2.5 text-[13px] font-medium text-white/80 transition hover:border-white/[.15] hover:bg-white/[.08] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isCreatingConversation}
            onClick={() => {
              if (!selectedModel) {
                toast.error("Please select a model first");
                return;
              }
              createConversation({ model: selectedModel });
            }}
          >
            {isCreatingConversation ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <MessageSquarePlusIcon className="size-4" />
            )}
            {isCreatingConversation ? "Creating…" : "New Chat"}
          </button>
          {createConversationError && (
            <p className="mt-2 text-xs text-red-400" role="alert">
              Failed to create conversation.
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-white/[.06]" />

        {/* Conversation list */}
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pt-3 pb-3">
          {!conversations ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2Icon className="size-5 animate-spin text-white/30" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="py-8 text-center text-xs text-white/30">
              No conversations yet
            </p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-colors ${
                  c.id === activeId
                    ? "bg-white/[.08] text-white"
                    : "text-white/60 hover:bg-white/[.04] hover:text-white/80"
                }`}
                onClick={() =>
                  editConversationId !== c.id && selectConversation(c.id)
                }
              >
                <MessageCircleIcon className="size-4 shrink-0 opacity-50" />
                {editConversationId === c.id ? (
                  <div
                    className="flex flex-1 items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editConversationTitle}
                      onChange={(e) => setEditConversationTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          saveEdit(c.id, editConversationTitle);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      className="min-w-0 flex-1 rounded-md border border-white/[.15] bg-white/[.06] px-2 py-1 text-[13px] text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none"
                      autoFocus
                    />
                    <button
                      className="rounded-md p-1 text-emerald-400 transition hover:bg-white/[.08] disabled:opacity-40"
                      disabled={isEditingConversation}
                      onClick={() => saveEdit(c.id, editConversationTitle)}
                    >
                      {isEditingConversation ? (
                        <Loader2Icon className="size-3.5 animate-spin" />
                      ) : (
                        <CheckIcon className="size-3.5" />
                      )}
                    </button>
                    <button
                      className="rounded-md p-1 text-white/40 transition hover:bg-white/[.08] hover:text-white/70"
                      onClick={cancelEditing}
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 truncate text-[13px]">
                      {c.title}
                    </span>
                    <button
                      className="rounded-md p-1 text-white/0 transition group-hover:text-white/40 hover:!text-white/70 hover:bg-white/[.08]"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(c);
                      }}
                    >
                      <PencilIcon className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
          {editConversationError && (
            <p className="mt-2 text-xs text-red-400" role="alert">
              Failed to edit conversation.
            </p>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex min-w-0 flex-1 flex-col bg-[#141414]">
        {activeId ? (
          <>
            {/* Header */}
            <header className="flex shrink-0 items-center border-b border-white/[.06] px-6 py-4">
              <h1 className="text-[15px] font-medium text-white/90">
                {activeConversation?.title ?? "Conversation"}
              </h1>
            </header>

            {/* Messages */}
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-6">
              {messages?.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/30">
                  <MessageCircleIcon className="size-10 opacity-40" />
                  <p className="text-sm">Send a message to get started</p>
                </div>
              )}
              {messages?.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} mb-3`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md bg-violet-600 text-white"
                        : "rounded-bl-md bg-white/[.06] text-white/85"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-white/[.06] px-4 py-4">
              <div className="mx-auto flex max-w-3xl items-end gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={isWaitingForResponse ? "Waiting for response…" : "Type a message…"}
                    className="w-full rounded-xl border border-white/[.1] bg-white/[.04] px-4 py-3 text-[14px] text-white placeholder:text-white/30 transition focus:border-violet-500/40 focus:bg-white/[.06] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    value={newMessage}
                    disabled={isWaitingForResponse}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                </div>
                <button
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isSendingMessage || isWaitingForResponse || !newMessage.trim()}
                  onClick={handleSend}
                >
                  {isSendingMessage || isWaitingForResponse ? (
                    <Loader2Icon className="size-4.5 animate-spin" />
                  ) : (
                    <SendHorizontalIcon className="size-4.5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state — no conversation selected */
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20">
              <SparklesIcon className="size-8 text-violet-400" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white/90">
                Welcome to Olamchat
              </h2>
              <p className="mt-1 text-sm text-white/40">
                Select a conversation or create a new one to get started.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
