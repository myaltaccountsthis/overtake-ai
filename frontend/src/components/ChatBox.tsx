import React, { useState } from "react";

export default function ChatBox({
  onSend,
}: {
  onSend: (message: string) => Promise<string> | string;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const resp = await Promise.resolve(onSend(text));
      setMessages((m) => [...m, { role: "ai", text: resp }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: "Error getting reply." }]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) sendMessage();
    }
  }

  return (
    <div className="w-[500px] bg-slate-800 border border-slate-700 rounded p-3 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-100">Chat</div>
      </div>

      <div
        className="flex-1 overflow-y-auto mb-3 space-y-2 text-sm"
        style={{ maxHeight: 180 }}
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="text-xs text-slate-400">Ask something and press Send.</div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-xl max-w-full break-words ${
              m.role === "user"
                ? "ml-auto bg-emerald-500 text-slate-900"
                : "mr-auto bg-slate-700 text-slate-100"
            }`}
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="text-xs text-slate-400">Loading…</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type a question..."
          className="flex-1 bg-slate-900/60 text-slate-100 placeholder:text-slate-500 px-3 py-2 rounded outline-none text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={loading || input.trim() === ""}
          className="px-3 py-2 rounded bg-emerald-500 text-slate-900 font-medium disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
