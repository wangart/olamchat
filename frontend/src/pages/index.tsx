import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type Conversation = {
  id: string;
  title: string;
};

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editConversationId, setEditConversationId] = useState<string | null>(null);

  const selectConversation = (id: string) => {
    setActiveId(id);
  };

  const editConversationName = (id: string, title: string) => {
    setConversations(conversations.map(c => c.id === id ? { ...c, title: title } : c));
  };

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black`}
    >
      <aside className="h-screen overflow-y-auto border-r border-gray-200 p-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={() => setConversations([...conversations, { id: crypto.randomUUID(), title: 'New Chat' }])}>New Chat</button>
        <div className="mt-4 flex flex-col gap-1">
          {conversations.map(c => (
            <div 
              key={c.id}
              className={`p-2 rounded cursor-pointer flex gap-2 items-center justify-between ${
                c.id === activeId ? 'bg-gray-200' : 'hover:bg-gray-100'
              }`}
              onClick={() => selectConversation(c.id)}
            >
              {editConversationId === c.id ? <input type="text" value={c.title} onChange={e => editConversationName(c.id, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setEditConversationId(null); } }} /> : c.title}
              {editConversationId === c.id ? <button className="bg-green-500 text-white px-2 py-1 rounded-md" onClick={() => setEditConversationId(null)}>Save</button> : <button className="bg-red-500 text-white px-2 py-1 rounded-md" onClick={() => setEditConversationId(c.id)}>Edit</button>}
            </div>
          ))}
        </div>
      </aside>
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the index.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs/pages/getting-started?utm_source=create-next-app&utm_medium=default-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
