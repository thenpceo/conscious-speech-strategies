"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  parsedData?: { type: string; data: unknown };
  showConfirm?: boolean;
}

export default function SmsSimPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      text: "Hey! I'm the Conscious Speech SMS agent. You can text me session data or hours and I'll log it for you.\n\nTry:\n\u2022 \"Session with [Student]: G1 8/10, G2 6/10\"\n\u2022 \"Hours: 3.5 at [School]\"\n\nType 'help' for more examples.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/sms-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await res.json();

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        text: data.reply,
        parsedData: data.type !== "unknown" ? { type: data.type, data: data.data } : undefined,
        showConfirm: data.type !== "unknown",
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "agent", text: "Error connecting to agent. Try again." },
      ]);
    }

    setSending(false);
  }

  async function handleConfirm(msgId: string) {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg?.parsedData) return;

    // Remove confirm button
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, showConfirm: false } : m)));
    setSending(true);

    try {
      const res = await fetch("/api/sms-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", data: msg.parsedData }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "agent", text: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "agent", text: "Error saving. Try again." },
      ]);
    }
    setSending(false);
  }

  function handleReject(msgId: string) {
    setMessages((prev) => [
      ...prev.map((m) => (m.id === msgId ? { ...m, showConfirm: false } : m)),
      { id: (Date.now() + 1).toString(), role: "agent", text: "No problem \u2014 discarded. Send a corrected message anytime." },
    ]);
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">SMS Agent Simulator</h1>
        <p className="text-slate-500 text-sm mt-1">
          Test how the SMS agent will parse and save text messages from SLPAs.
          This simulates what Twilio will handle in production.
        </p>
      </div>

      {/* Chat Window */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Conscious Speech Bot</p>
            <p className="text-teal-100 text-xs">SMS Agent</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-teal-100 text-xs">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user"
                      ? "bg-teal-600 text-white rounded-br-md"
                      : "bg-white border border-slate-200/60 text-slate-800 rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>

              {msg.showConfirm && (
                <div className="flex justify-start mt-2 ml-2 gap-2">
                  <button
                    onClick={() => handleConfirm(msg.id)}
                    disabled={sending}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Confirm
                  </button>
                  <button
                    onClick={() => handleReject(msg.id)}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                    Discard
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-slate-200 p-3 flex gap-2 bg-white">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-2.5 bg-slate-50 rounded-full text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="bg-teal-600 hover:bg-teal-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>

      {/* Example Messages */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 text-[13px] mb-3">Quick Examples (click to try)</h3>
        <div className="space-y-2">
          {[
            "Session with John Smith: G1 8/10, G2 6/10, G3 9/10",
            "Session with Sarah Johnson: G1 4/5, G2 7/10 - great improvement today",
            "Hours: 3.5 at Gulf Coast Prep - speech sessions",
            "Logged 4 hours at Pinellas Charter",
          ].map((example) => (
            <button
              key={example}
              onClick={() => setInput(example)}
              className="block w-full text-left px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs text-slate-600 transition-colors cursor-pointer"
            >
              &quot;{example}&quot;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
