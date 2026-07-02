# WeBunk — "Track Smart. Bunk Smarter."

**WeBunk** is a premium, high-fidelity college attendance management system built for students to plan lectures, compute buffer bunks, optimize schedules, and get AI academic advisory to stay safely above 75%.

---

## 🚀 Features

- **Smart Bunk Calculator**: Algebraically precise computations determining your exact number of safe remaining bunks, or consecutive classes required to attend to climb back up above threshold.
- **AI-Powered Advisor**: Server-side Google Gemini suggestions analyzing your attendance profile to recommend study focus priorities and warning margins.
- **Weekly Schedule**: Monday-to-Saturday drag/edit scheduler that automatically updates your dashboard schedule feed every day.
- **Visual Analytics**: Interactive Recharts plots showing subject comparisons, cumulative progression curves, and day-of-week attendance distributions.
- **Automatic Alerts**: Quick banner triggers warning you if a subject drops below the requirement limit.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS (v4)
- **Animation**: Framer Motion (`motion/react`)
- **Graphics**: Recharts plots & Lucide React
- **Backend / Proxy**: Express.js server (serves Vite assets in production and routes Gemini requests)
- **AI Core**: `@google/genai` (SDK model `gemini-3.5-flash`)
- **Persistence**: Durable local-storage sync with direct schema ready for Supabase or Firestore.

---

## 🗄️ Database & Supabase Configuration

This application is ready to connect to a Supabase PostgreSQL backend. Below are the SQL table structures requested to implement WeBunk. Run these inside your Supabase SQL Editor:

```sql
-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT NOT NULL,
  college_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  attendance_requirement INTEGER DEFAULT 75,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Subjects Table
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  faculty TEXT NOT NULL,
  attended INTEGER DEFAULT 0 NOT NULL,
  total INTEGER DEFAULT 0 NOT NULL,
  streak INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Timetable Table
CREATE TABLE timetable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects ON DELETE SET NULL,
  subject_name TEXT NOT NULL,
  day TEXT NOT NULL, -- 'Monday', 'Tuesday', 'Wednesday', etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Notifications Table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' NOT NULL, -- 'danger', 'warning', 'success', 'info'
  read BOOLEAN DEFAULT false NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Attendance Log (For analytics/heatmap history)
CREATE TABLE attendance_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  subject_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'present', 'absent'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## ⚙️ Environment Variables

Add these variables in your `.env` or Vercel deployment configurations:

```env
# Google Gemini API key for AI suggestions
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Supabase Auth Keys (optional when migrating client endpoints)
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

---

## 🏃 Local Installation

1. Clone or download this project workspace.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot development server (Express + Vite):
   ```bash
   npm run dev
   ```
4. Access the portal at `http://localhost:3000`.

---

## ☁️ Deployment Guide

### Deploying to Vercel (Full-Stack or static)

This workspace is fully optimized to compile into client static files or deploy as a serverless Full-Stack Node instance:

1. Click **New Project** in the Vercel Dashboard.
2. Select your imported GitHub repository.
3. Configure the **Build & Development Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add your **Environment Variables** (e.g., `GEMINI_API_KEY`).
5. Click **Deploy**!
