import { useState, useEffect } from "react";
import { 
  BookOpen, LayoutDashboard, Library, Calendar, BarChart3, Bell, Settings, LogOut, Search, Moon, Sun, ChevronRight, User2, BrainCircuit
} from "lucide-react";
import { Profile, Notification } from "../types";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: Profile;
  notifications: Notification[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onSearchChange?: (val: string) => void;
  searchValue?: string;
}

export default function NavbarAndSidebar({
  activeTab,
  setActiveTab,
  profile,
  notifications,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  onSearchChange,
  searchValue = ""
}: NavigationProps) {
  const [timeStr, setTimeStr] = useState("");
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "subjects", label: "Subjects", icon: <Library className="w-5 h-5" /> },
    { id: "timetable", label: "Timetable", icon: <Calendar className="w-5 h-5" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "ai-analyzer", label: "AI Analyzer", icon: <BrainCircuit className="w-5 h-5" /> },
    { 
      id: "notifications", 
      label: "Notifications", 
      icon: <Bell className="w-5 h-5" />, 
      badge: unreadCount > 0 ? unreadCount : undefined 
    },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <>
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-b border-slate-150 dark:border-zinc-800 z-40 flex items-center justify-between px-6 transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white leading-none">WeBunk</h1>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Track Smart. Bunk Smarter.</span>
          </div>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Quick search subjects or lecturers..."
              className="pl-9.5 w-full bg-slate-50/80 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 placeholder-slate-400 dark:text-white"
            />
          </div>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono font-bold bg-slate-50 dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hidden lg:inline-block">
            {timeStr}
          </span>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl border border-slate-150 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Quick Notifications shortcut */}
          <button
            onClick={() => setActiveTab("notifications")}
            className="p-2.5 rounded-xl border border-slate-150 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 transition-colors cursor-pointer relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {/* Profile pill */}
          <div className="flex items-center gap-2.5 border-l border-slate-200 dark:border-zinc-800 pl-4">
            <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md border-2 border-white dark:border-zinc-900">
              {profile.fullName ? profile.fullName.charAt(0) : "U"}
            </div>
            <div className="hidden xl:block">
              <div className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 max-w-[110px] truncate leading-none">
                {profile.fullName || "User"}
              </div>
              <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5 select-none">
                <span className="w-1 h-1 bg-emerald-500 rounded-full inline-block" />
                {profile.role === 'super_admin' ? 'Super Admin' : (profile.role === 'admin' || profile.role === 'College Admin' ? 'College Admin' : 'Active Student')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className="fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-zinc-900 border-r border-slate-150 dark:border-zinc-800 z-30 pt-6 hidden md:flex flex-col justify-between transition-colors duration-300">
        <div className="px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/10" 
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-850/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer (Profile / Logout) */}
        <div className="p-4 border-t border-slate-150 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl mb-3 border border-slate-200/50 dark:border-zinc-800">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">COLLEGE</span>
            <div className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 truncate">{profile.collegeName || "N/A"}</div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-0.5 font-medium">{profile.branch || "N/A"}</div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Bottom Nav for Mobile view - just to maintain responsive layout cleanly */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 z-40 grid grid-cols-5 px-2 py-1">
        {menuItems.slice(0, 5).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 text-[10px] font-bold ${
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-zinc-500"
              }`}
            >
              {item.icon}
              <span className="scale-[0.85]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
