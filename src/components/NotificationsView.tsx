import { useState } from "react";
import { motion } from "motion/react";
import { 
  Bell, Check, Trash2, AlertCircle, CheckCircle2, ShieldAlert, Sparkles
} from "lucide-react";
import { Notification } from "../types";

interface NotificationsProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export default function NotificationsView({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll
}: NotificationsProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Alert Notifications</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Stay updated on sudden drops in percentages, bunk buffer alerts, and streak achievements.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onMarkAllRead}
            disabled={notifications.filter(n => !n.read).length === 0}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Check className="w-4 h-4" /> Mark All Read
          </button>
          <button
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-zinc-300 mb-1">Inbox Empty</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">No active alerts. You are completely up to date!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div 
              key={n.id}
              onClick={() => !n.read && onMarkRead(n.id)}
              className={`p-4 border rounded-xl flex gap-4 items-start transition-all cursor-pointer ${
                n.read 
                  ? 'bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-800 opacity-70' 
                  : 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-900/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/35'
              }`}
            >
              {getNotificationIcon(n.type)}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium mt-1 leading-relaxed">{n.message}</p>
                {!n.read && (
                  <span className="inline-flex items-center gap-1 mt-2.5 text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block" />
                    New Alert • Tap to mark read
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
