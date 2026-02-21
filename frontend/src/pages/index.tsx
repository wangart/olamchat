import Image from "next/image";
import { toast } from "sonner";
import { Geist, Geist_Mono } from "next/font/google";
import { useChatStore } from "../store/chat";
import { useState } from "react";
import { useConversationMessages, useConversations, useModels } from "@/hooks/api";
import { useCreateConversation, useCreateMessage, useEditConversation } from "@/lib/api";
import type { Message } from "@/types/api";

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
  const [editConversationTitle, setEditConversationTitle] = useState<string>('');
  const { data: messages } = useConversationMessages(activeId);
  const { trigger: createConversation, isMutating: isCreatingConversation, error: createConversationError } = useCreateConversation();
  const { trigger: editConversation, isMutating: isEditingConversation, error: editConversationError } = useEditConversation();
  const { trigger: createMessage, isMutating: isSendingMessage, error: createMessageError } = useCreateMessage(activeId);
  const [newMessage, setNewMessage] = useState<string>('');
  const startEditing = (c: { id: string; title: string }) => {
    setEditConversationId(c.id);
    setEditConversationTitle(c.title);
  };

  const saveEdit = (id: string, title: string) => {
    editConversation({ id, title })
      .then(() => {
        updateConversation(id, title);
        setEditConversationId(null);
      })
      .catch(() => {});
  };

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex min-h-screen w-full flex-row bg-background font-sans`}
    >
      <aside className="flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-4">
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <select
          className="w-full rounded-md border border-border bg-muted p-2 text-foreground"
          onChange={e => setSelectedModel(e.target.value)}
        >
          <option value="">Select a model</option>
          {models?.map(m => (
            <option key={m.id} value={m.id}>{m.modelName}</option>
          ))}
        </select>
      )}
        <button
          className="bg-primary text-primary-foreground flex items-center gap-2 rounded-md px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isCreatingConversation}
          onClick={() => {
            if (!selectedModel) {
              toast.error("Please select a model");
              return;
            }
            createConversation({ model: selectedModel });
          }}
        >
          {isCreatingConversation ? (
            <>
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" aria-hidden />
              Creating…
            </>
          ) : (
            "New Chat"
          )}
        </button>
        {createConversationError && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            Failed to create conversation. Please try again.
          </p>
        )}
        <div className="mt-4 flex flex-1 flex-col gap-1 overflow-hidden">
          {!conversations ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
          conversations.map(c => (
            <div
              key={c.id}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded p-2 ${
                c.id === activeId ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent'
              }`}
              onClick={() => editConversationId !== c.id && selectConversation(c.id)}
            >
              {editConversationId === c.id ? (
                <input
                  type="text"
                  value={editConversationTitle}
                  onChange={e => setEditConversationTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveEdit(c.id, editConversationTitle);
                  }}
                  className="border-input bg-background text-foreground flex-1 min-w-0 rounded border px-2 py-1"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 truncate text-sidebar-foreground">{c.title}</span>
              )}
              {editConversationId === c.id ? (
                <button
                  className="bg-primary text-primary-foreground flex shrink-0 items-center gap-1 rounded px-2 py-1 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isEditingConversation}
                  onClick={e => {
                    e.stopPropagation();
                    saveEdit(c.id, editConversationTitle);
                  }}
                >
                  {isEditingConversation ? (
                    <>
                      <span className="inline-block size-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              ) : (
                <button
                  className="bg-destructive text-destructive-foreground shrink-0 rounded px-2 py-1"
                  onClick={e => {
                    e.stopPropagation();
                    startEditing(c);
                  }}
                >
                  Edit
                </button>
              )}
            </div>
          ))
          )}
          {editConversationError && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              Failed to edit conversation. Please try again.
            </p>
          )}
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto bg-background flex flex-col">
        {/* Conversation Name in header */}
        {activeId && (
          <h1 className="text-2xl font-bold">{conversations?.find(c => c.id === activeId)?.title}</h1>
        )}
        {/* Put them into text bubbles left or right aligned based on the role */}
        {/* this should take up most of the screen and push the input to the bottom */}
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {messages?.map(m => (
          <div key={m.id} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <p>{m.content}</p>
          </div>
        ))}
        </div>

        {/* Text input for new message and send button */}
        <div className="flex flex-row gap-2">
          <input type="text" className="flex-1 rounded-md border border-border bg-muted p-2 text-foreground" value={newMessage} onChange={e => setNewMessage(e.target.value)} />
            <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSendingMessage} onClick={() => {
              if (!newMessage) {
                toast.error("Please enter a message");
                return;
              }
              if (!activeId) {
                toast.error("Please select a conversation");
                return;
              }
              createMessage({ content: newMessage }, {
                optimisticData: (current?: Message[]) => [
                  ...(current ?? []),
                  {
                    id: `temp-${Date.now()}`,
                    conversationId: activeId,
                    role: 'user' as const,
                    content: newMessage,
                    createdAt: new Date().toISOString(),
                  },
                ],
                rollbackOnError: true,
              });
              setNewMessage('');
            }}>
              Send
          </button>
        </div>
      </main>
    </div>
  );
}
