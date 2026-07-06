"use client";

import { useState, useEffect, useRef } from "react";
import { sendMessage, subscribeToMessages } from "@/lib/chat";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { triggerHaptic } from "@/lib/sounds";
import type { Message } from "@/types";

/** "Today", "Yesterday", or "Mon 26 May" — for chat day dividers. */
function dayLabel(d: Date): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOfToday - dayStart) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function msgDate(m: Message): Date {
  return m.createdAt?.toDate?.() || new Date(m.createdAt as unknown as string);
}

interface MiniChatProps {
  dateId: string;
  otherName: string;
  calmerMessage?: string;
}

export function MiniChat({ dateId, otherName, calmerMessage }: MiniChatProps) {
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
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // Handle keyboard resize on iOS — sync container height with visualViewport
  // and keep input visible when keyboard opens.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    function handleResize() {
      // When keyboard opens on iOS, visualViewport height shrinks.
      // Make sure the messages end and input are visible.
      window.requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      });
    }

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !text.trim() || sending) return;

    setSending(true);
    const msg = text.trim();
    setText("");
    triggerHaptic();

    try {
      await sendMessage(dateId, firebaseUser.uid, msg);
    } catch (err) {
      console.error("Send error:", err);
      setText(msg);
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
      {/* Subtitle */}
      <div className="px-4 py-2 bg-cream/50">
        <p className="text-gray text-[10px] text-center font-mono uppercase tracking-wider">
          For logistics only — save the good stuff for coffee
        </p>
      </div>

      {/* Messages — flex-col-reverse so they stick to bottom like iMessage/Instagram */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col-reverse">
        <div className="space-y-3">
          {/* BLEND pre-meet calmer message */}
          {calmerMessage && (
            <div className="flex justify-center mb-4">
              <div className="max-w-[85%] bg-wine/5 border border-wine/10 rounded-2xl px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <svg width="12" height="12" viewBox="0 0 80 60">
                    <circle cx="28" cy="30" r="18" fill="#722F37" opacity="0.5" />
                    <circle cx="52" cy="30" r="18" fill="#722F37" opacity="0.5" />
                  </svg>
                  <span className="text-wine text-[10px] font-medium uppercase tracking-wider">BLEND</span>
                </div>
                <p className="text-ink text-sm leading-relaxed">{calmerMessage}</p>
              </div>
            </div>
          )}

          {messages.length === 0 && !calmerMessage && (
            <div className="text-center py-12">
              <p className="text-gray text-sm">No messages yet.</p>
              <p className="text-gray-light text-xs mt-1">
                Say hi! Keep it short — you&apos;ll meet soon.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMine = msg.senderId === firebaseUser?.uid;
            const prev = messages[idx - 1];
            const next = messages[idx + 1];
            const isFirstInGroup = !prev || prev.senderId !== msg.senderId;
            const isLastInGroup = !next || next.senderId !== msg.senderId;
            // Only last message in a consecutive group shows the timestamp
            const showTime = isLastInGroup;
            // Day divider when the calendar day changes between messages
            const showDayDivider =
              !prev || dayLabel(msgDate(prev)) !== dayLabel(msgDate(msg));

            // Asymmetric corners for proper iMessage-style tail
            const tailCorners = isMine
              ? // Mine (right side): tail bottom-right, tight top-right if grouped
                `${isFirstInGroup ? "rounded-tr-2xl" : "rounded-tr-md"} rounded-tl-2xl ${isLastInGroup ? "rounded-br-[4px]" : "rounded-br-2xl"} rounded-bl-2xl`
              : // Theirs (left side): tail bottom-left, tight top-left if grouped
                `rounded-tr-2xl ${isFirstInGroup ? "rounded-tl-2xl" : "rounded-tl-md"} rounded-br-2xl ${isLastInGroup ? "rounded-bl-[4px]" : "rounded-bl-2xl"}`;

            return (
              <div key={msg.id}>
                {showDayDivider && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-ink/8" />
                    <span className="text-gray-light text-[10px] font-mono uppercase tracking-[0.2em]">
                      {dayLabel(msgDate(msg))}
                    </span>
                    <div className="flex-1 h-px bg-ink/8" />
                  </div>
                )}
              <div
                className={`flex ${isMine ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-2" : "mt-0.5"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 ${tailCorners} ${
                    isMine
                      ? "bg-wine text-cream"
                      : "bg-white text-ink shadow-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" dir="auto">{msg.text}</p>
                  {showTime && (
                    <p
                      className={`text-[10px] mt-1 ${
                        isMine ? "text-cream/50" : "text-gray-light"
                      }`}
                    >
                      {formatTime(msg)}
                    </p>
                  )}
                </div>
              </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input — sticky at bottom, respects safe area */}
      <form
        onSubmit={handleSend}
        className="px-4 py-3 border-t border-stripe-white bg-white"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            autoFocus
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
