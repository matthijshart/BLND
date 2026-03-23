"use client";

import { useState, useEffect, useRef } from "react";
import { sendMessage, subscribeToMessages } from "@/lib/chat";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { Message } from "@/types";

interface MiniChatProps {
  dateId: string;
  otherName: string;
}

export function MiniChat({ dateId, otherName }: MiniChatProps) {
  const { firebaseUser } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages(dateId, (msgs) => {
      setMessages(msgs);
    });
    return unsubscribe;
  }, [dateId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !text.trim() || sending) return;

    setSending(true);
    const msg = text.trim();
    setText("");

    try {
      await sendMessage(dateId, firebaseUser.uid, msg);
    } catch (err) {
      console.error("Send error:", err);
      setText(msg); // restore on error
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function formatTime(message: Message) {
    if (!message.createdAt) return "";
    const date = message.createdAt.toDate?.()
      || new Date(message.createdAt as unknown as string);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stripe-white bg-white/80 backdrop-blur-sm">
        <p className="font-medium text-ink text-sm text-center">
          Chat with {otherName}
        </p>
        <p className="text-gray text-xs text-center mt-0.5">
          For logistics only — save the good stuff for coffee
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray text-sm">No messages yet.</p>
            <p className="text-gray-light text-xs mt-1">
              Say hi! Keep it short — you&apos;ll meet soon.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === firebaseUser?.uid;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  isMine
                    ? "bg-wine text-cream rounded-br-md"
                    : "bg-white text-ink shadow-sm rounded-bl-md"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isMine ? "text-cream/50" : "text-gray-light"
                  }`}
                >
                  {formatTime(msg)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="px-4 py-3 border-t border-stripe-white bg-white/80 backdrop-blur-sm"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 px-4 py-3 rounded-full bg-cream border border-cream text-ink text-sm placeholder:text-gray-light focus:outline-none focus:border-wine/20"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-11 h-11 rounded-full bg-wine text-cream flex items-center justify-center shrink-0 hover:bg-burgundy transition-colors disabled:opacity-30"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
