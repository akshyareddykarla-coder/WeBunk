import { motion } from "motion/react";
import { BookOpen, Calendar, TrendingUp, Cpu, CheckCircle2, Shield, Flame, Sparkles, HelpCircle, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const features = [
    {
      icon: <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Smart Attendance Math",
      description: "Our high-precision calculator instantly tells you how many classes you can safely bunk, or how many you must attend to recover."
    },
    {
      icon: <Cpu className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      title: "AI-Powered Suggestions",
      description: "Get personalized, server-side suggestions using Google Gemini to prioritize subjects and optimize your bunk schedule."
    },
    {
      icon: <Calendar className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      title: "Interactive Timetable",
      description: "Add your weekly Monday-to-Saturday schedule. Your dashboard automatically syncs to display today's active schedule."
    },
    {
      icon: <Flame className="w-6 h-6 text-amber-500" />,
      title: "Attendance Streaks",
      description: "Gamify your college life. Build attendance streaks for difficult subjects and earn high-tier academic status badges."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Create Your Profile",
      description: "Enter your college details and set your target threshold (e.g., 75%)."
    },
    {
      num: "02",
      title: "Log Daily Lectures",
      description: "Tap Present or Absent in one click. Watch calculations update in real time."
    },
    {
      num: "03",
      title: "Bunk with Confidence",
      description: "Know exactly when you are safe to bunk and when you need to be in class."
    }
  ];

  const faqs = [
    {
      q: "How does the safe bunk calculation work?",
      a: "It uses a direct algebraic formula. If you are above your threshold, we calculate how many consecutive lectures you can miss before your attendance percentage falls below your requirement. If you are below, we calculate the exact number of consecutive lectures you must attend to climb back up."
    },
    {
      q: "Is my college data private?",
      a: "Absolutely. All your academic profile data, subjects, and timetable slots are saved in secure local storage right in your browser, keeping your tracking completely private."
    },
    {
      q: "Can I use WeBunk for any college or branch?",
      a: "Yes! WeBunk is built for universities worldwide. You can customize your subjects, faculty, attendance target (from 50% to 100%), and schedule easily."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/75 dark:bg-zinc-900/75 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">WeBunk</span>
              <span className="text-xs block text-slate-500 dark:text-zinc-400 font-medium -mt-1">Track Smart. Bunk Smarter.</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">How It Works</a>
            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              id="landing-signin-btn"
              onClick={onSignIn}
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button 
              id="landing-signup-btn"
              onClick={onGetStarted}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold text-sm shadow-md transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 border border-indigo-200/40 dark:border-indigo-900/40"
          >
            <Sparkles className="w-3.5 h-3.5 fill-indigo-200 dark:fill-indigo-900" />
            The Ultimate College Attendance SaaS Dashboard
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight mb-6"
          >
            Track Smart.<br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300">Bunk Smarter.</span>
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              id="hero-get-started-btn"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-base shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
            >
              Get Started for Free <ArrowRight className="w-4.5 h-4.5" />
            </button>
            <a 
              href="#features" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-base hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
            >
              Explore Features
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-slate-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Feature Set</h2>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Designed to Dominate College Scheduling</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-zinc-850 flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h4>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-100/50 dark:bg-zinc-900/40 border-t border-b border-slate-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Workflow</h2>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">How WeBunk Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                <div className="text-5xl font-black text-indigo-600/10 dark:text-indigo-400/10 mb-4">{s.num}</div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{s.title}</h4>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">Support</h2>
            <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 shadow-sm">
                <div className="flex gap-3 items-start">
                  <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{faq.q}</h4>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">W</div>
            <span className="font-extrabold text-slate-900 dark:text-white">WeBunk</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            &copy; 2026 WeBunk SaaS Inc. Built for hackathon excellence.
          </p>
          <div className="flex gap-6 text-xs text-slate-500 dark:text-zinc-400">
            <span className="hover:text-indigo-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-indigo-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-indigo-600 cursor-pointer text-indigo-500 font-bold">Hackathon Entry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
