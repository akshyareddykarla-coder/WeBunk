import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, User, HelpCircle } from "lucide-react";
import { Subject, Profile, TimetableSlot } from "../types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SectionChatbotProps {
  subjects: Subject[];
  profile: Profile;
  timetable: TimetableSlot[];
}

export default function SectionChatbot({ subjects, profile, timetable }: SectionChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`webunk_chat_history_${profile.id}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    } else {
      // Seed initial welcome message
      const welcome: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: `Hi ${profile.fullName ? profile.fullName.split(" ")[0] : "Student"}! I'm your WeBunk chatbot. Ask me about your attendance standings, safe bunk counts, timetable schedules, or teacher assignments for your section!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcome]);
    }
  }, [profile.id]);

  // Persist chat history to localStorage on update
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`webunk_chat_history_${profile.id}`, JSON.stringify(messages));
    }
  }, [messages, profile.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue("");
    }

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          subjects,
          timetable,
          profile
        })
      });

      if (!response.ok) {
        throw new Error("Chat service did not respond correctly.");
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.reply || "I didn't receive a reply from the section coordinator assistant.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: "Sorry, I encountered an issue parsing your records. Please check your connectivity and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    const welcome: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: `Hi ${profile.fullName ? profile.fullName.split(" ")[0] : "Student"}! I'm your section assistant. Let's begin fresh! What information can I fetch for you?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcome]);
    localStorage.removeItem(`webunk_chat_history_${profile.id}`);
  };

  const quickPrompts = [
    { label: "Do I have safe bunks?", text: "How many safe bunks do I have left?" },
    { label: "Check attendance standings", text: "Show my attendance percentage for all subjects." },
    { label: "Show today's schedule", text: "What is my schedule or timetable?" },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-8 right-6 w-14 h-14 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-indigo-500 dark:hover:bg-indigo-600 transition-all z-50 cursor-pointer border border-white/10"
      >
        {isOpen ? <X className="w-6 h-6 animate-pulse" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center animate-bounce" />
        )}
      </button>

      {/* Floating/Docked Glassmorphic Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-6 w-[350px] sm:w-[400px] h-[550px] max-h-[70vh] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <Bot className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-tight leading-none flex items-center gap-1.5">
                  WeBunk Section Co-pilot
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
                </h3>
                <span className="text-[10px] text-indigo-200 font-bold uppercase mt-0.5 block tracking-wider">
                  {profile.section || "Section Coordinator"} AI
                </span>
              </div>
            </div>

            <button
              onClick={handleClearChat}
              className="text-[10px] bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg px-2 py-1 font-bold tracking-tight transition-all cursor-pointer"
            >
              Reset Chat
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m) => {
              const isAssistant = m.role === "assistant";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 max-w-[85%] ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold ${
                      isAssistant
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100/30 text-indigo-600 dark:text-indigo-400"
                        : "bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white"
                    }`}
                  >
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                        isAssistant
                          ? "bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 text-slate-800 dark:text-zinc-200 rounded-tl-sm"
                          : "bg-indigo-600 text-white rounded-tr-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold block px-1">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-3 rounded-2xl rounded-tl-sm text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Resolving tool calls...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Triggers */}
          {messages.length < 3 && (
            <div className="px-4 py-2 bg-slate-50/50 dark:bg-zinc-950/40 border-t border-slate-100 dark:border-zinc-900">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Suggested Inquiries
              </span>
              <div className="flex flex-col gap-1.5">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.text)}
                    className="w-full text-left py-1.5 px-2.5 rounded-lg border border-slate-150 dark:border-zinc-800 hover:bg-slate-100/60 dark:hover:bg-zinc-900 text-[10px] font-bold text-slate-600 dark:text-zinc-400 cursor-pointer transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Input */}
          <div className="p-4 border-t border-slate-150 dark:border-zinc-900 bg-white dark:bg-zinc-950/40">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask timetable or bunk budgets..."
                className="flex-1 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className="w-8.5 h-8.5 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 cursor-pointer transition-all shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
