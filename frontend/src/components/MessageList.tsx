import { useEffect, useRef, useState } from "react";
import type { Message } from "@/types/models";
import { formatDate, formatDateTime, formatTime } from "@/utils/format";
import { ChatIcon } from "./ui/icons";

type MessageListProps = {
  messages: Message[];
  currentUserId: number;
  page: number;
};

// Present messages and keep scrolling inside the chat, never the whole page.
export default function MessageList({ messages, currentUserId, page }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const previousLastId = useRef<number | null>(null);
  const isNearBottom = useRef(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const last = messages.at(-1);
    if (!viewport || !last) return;

    if (previousLastId.current === null) {
      // Start latest messages at the bottom and history pages at the top.
      viewport.scrollTop = page === 1 ? viewport.scrollHeight : 0;
    } else if (last.id !== previousLastId.current) {
      if (isNearBottom.current || last.senderId === currentUserId) {
        viewport.scrollTop = viewport.scrollHeight;
        setHasNewMessages(false);
      } else {
        // Incoming messages must not interrupt reading earlier content.
        setHasNewMessages(true);
      }
    }
    previousLastId.current = last.id;
    isNearBottom.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 80;
  }, [messages, currentUserId, page]);

  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    isNearBottom.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 80;
    if (isNearBottom.current) setHasNewMessages(false);
  };

  const handleLatest = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    setHasNewMessages(false);
  };

  return (
    <div className="relative">
      <div ref={viewportRef} onScroll={handleScroll} tabIndex={0} role="region" aria-label="Chat messages" className="h-[26rem] overflow-y-auto overscroll-contain bg-gray-50/70 p-5 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-600/20 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span aria-hidden="true" className="mb-4 grid size-12 place-items-center rounded-2xl bg-white text-brand-600 ring-1 ring-gray-100"><ChatIcon className="size-6" /></span>
            <p className="text-base font-bold text-gray-900">Start the conversation</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">Introduce yourself and discuss the next steps for this project.</p>
          </div>
        ) : (
          <ol aria-label="Messages" className="space-y-5">
            {messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const date = formatDate(message.createdAt);
              const showDate = index === 0 || formatDate(messages[index - 1].createdAt) !== date;
              return (
                <li key={message.id} className="space-y-5">
                  {showDate && <p className="text-center text-[11px] font-medium text-gray-400">{date}</p>}
                  <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[80%] ${isOwn ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md border border-gray-100 bg-white text-gray-700"}`}>
                      <p className={`text-xs font-bold [overflow-wrap:anywhere] ${isOwn ? "text-white/80" : "text-gray-900"}`}>{isOwn ? "You" : message.sender.name}</p>
                      <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{message.body}</p>
                      <time dateTime={message.createdAt} title={formatDateTime(message.createdAt)} className={`mt-2 block text-right text-[10px] ${isOwn ? "text-white/70" : "text-gray-400"}`}>{formatTime(message.createdAt)}</time>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      {hasNewMessages && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
          <button type="button" onClick={handleLatest} className="btn btn-secondary btn-sm shadow-sm"><span role="status">New messages ↓</span></button>
        </div>
      )}
    </div>
  );
}
