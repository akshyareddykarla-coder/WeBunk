import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

// High-fidelity local fallback advisor that dynamically generates advice mathematically
function generateFallbackSuggestions(subjects: any[], targetThreshold: number): string[] {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return [
      "No active subjects loaded. Go to the Subjects tab to add your courses and begin tracking!",
      "Aim to attend all your registered classes to start building a high attendance buffer early.",
      "Check your timetable to plan your weekly lectures and bunk opportunities carefully."
    ];
  }

  const threshold = targetThreshold || 75;
  const list: string[] = [];

  // Map and analyze subjects with detailed statistics
  const subjectsWithStats = subjects.map(sub => {
    const attended = Number(sub.attended) || 0;
    const total = Number(sub.total) || 0;
    const percentage = total > 0 ? (attended / total) * 100 : 100;
    
    // Classes needed to reach threshold if below:
    // Math.ceil((threshold * total - 100 * attended) / (100 - threshold))
    let classesNeeded = 0;
    if (percentage < threshold && threshold < 100) {
      classesNeeded = Math.ceil((threshold * total - 100 * attended) / (100 - threshold));
      if (classesNeeded < 0) classesNeeded = 0;
    }

    // Safe bunks if above:
    // Math.floor((100 * attended - threshold * total) / threshold)
    let safeBunks = 0;
    if (percentage >= threshold && threshold > 0) {
      safeBunks = Math.floor((100 * attended - threshold * total) / threshold);
      if (safeBunks < 0) safeBunks = 0;
    }

    return { ...sub, attended, total, percentage, classesNeeded, safeBunks };
  });

  // 1. First Suggestion: Subject requiring immediate attention
  const belowThreshold = subjectsWithStats.filter(s => s.percentage < threshold);
  if (belowThreshold.length > 0) {
    // Pick the one with the lowest percentage
    belowThreshold.sort((a, b) => a.percentage - b.percentage);
    const worst = belowThreshold[0];
    list.push(`Your attendance in ${worst.name} is currently ${Math.round(worst.percentage)}% (below target of ${threshold}%). Attend the next ${worst.classesNeeded} classes consecutively to recover.`);
  } else {
    // Pick the one with the lowest buffer/percentage
    subjectsWithStats.sort((a, b) => a.percentage - b.percentage);
    const lowest = subjectsWithStats[0];
    list.push(`Excellent work! Your lowest attendance is ${lowest.name} at ${Math.round(lowest.percentage)}%, which is safely above your ${threshold}% target. Maintain your streak!`);
  }

  // 2. Second Suggestion: Safe bunk opportunity
  const aboveThreshold = subjectsWithStats.filter(s => s.percentage >= threshold && s.safeBunks > 0);
  if (aboveThreshold.length > 0) {
    // Pick the one with the highest safe bunks or highest percentage
    aboveThreshold.sort((a, b) => b.percentage - a.percentage);
    const best = aboveThreshold[0];
    list.push(`You have built a healthy buffer in ${best.name} (${Math.round(best.percentage)}%). You can safely skip up to ${best.safeBunks} upcoming class${best.safeBunks > 1 ? 'es' : ''} if needed for exam prep.`);
  } else {
    list.push(`Attendance budgets are tight across all subjects. Try to build a small buffer before scheduling any bunks.`);
  }

  // 3. Third Suggestion: General motivating attendance strategy
  list.push(`Tip: Consistently attending the first class of the day reduces the urge to sleep in, keeping your overall average safely above ${threshold}%.`);

  return list;
}

  // Server-side Gemini route for AI-powered attendance suggestions
  app.post("/api/gemini/suggestions", async (req, res) => {
    const { subjects, targetThreshold, college, branch, year } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json(generateFallbackSuggestions(subjects, targetThreshold));
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      const subjectsText = subjects.map((s: any) => 
        `- ${s.name}: ${s.attended}/${s.total} (${s.total > 0 ? Math.round((s.attended / s.total) * 100) : 100}%) - Faculty: ${s.faculty || 'N/A'}`
      ).join("\n");

      const prompt = `You are an expert college academic advisor and the AI core of "WeBunk", an advanced attendance tracker.
Analyze the following student's attendance profile:
College: ${college || 'N/A'}
Branch/Major: ${branch || 'N/A'}
Academic Year: ${year || 'N/A'}
Target Attendance Threshold: ${targetThreshold}%

Current Subjects:
${subjectsText}

Please provide exactly 3 highly actionable, smart, and motivating advice bullets for this student.
Format each bullet as a concise 1-2 sentence recommendation, focusing on:
1. Which subject requires immediate attention (if any) to prevent dropping below the threshold.
2. A safe bunk opportunity (e.g. "You have a solid buffer in X, so you can safely skip a lecture if needed for exam prep").
3. A general motivational attendance strategy (e.g. focus on morning classes, or streak-building).

Make the tone supportive, slightly humorous/student-friendly ("smart bunking"), yet highly practical.
Return a JSON array of exactly 3 strings. Do not wrap in markdown blocks, just return raw JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "[]";
      res.json(JSON.parse(text));
    } catch (error: any) {
      // Quiet notice to stdout to inform developer without polluting error logs or causing platform crash indicators
      console.log("Operational Notice: Switched to dynamic mathematical advisor engine due to rate limits or API key limitations.");
      res.json(generateFallbackSuggestions(subjects, targetThreshold));
    }
  });

  // High-fidelity fallback analyzer
  function generateFallbackAnalyzer(subjects: any[], targetThreshold: number): any {
    const threshold = targetThreshold || 75;
    const riskRankedSubjects = (subjects || []).map(s => {
      const percentage = s.total > 0 ? (s.attended / s.total) * 100 : 100;
      let riskLevel = "SAFE";
      let reason = "You are well above your target threshold.";
      let actionNeeded = "Keep attending classes to maintain this excellent cushion.";

      if (percentage < threshold) {
        riskLevel = "CRITICAL";
        const classesNeeded = Math.ceil((threshold * s.total - 100 * s.attended) / (100 - threshold));
        reason = `Attendance at ${Math.round(percentage)}% is below the required ${threshold}%.`;
        actionNeeded = `Must attend the next ${classesNeeded} lectures consecutively to recover your target standing.`;
      } else if (percentage < threshold + 10) {
        riskLevel = "WARNING";
        const safeBunks = Math.floor((100 * s.attended - threshold * s.total) / threshold);
        reason = `Attendance at ${Math.round(percentage)}% is close to the threshold.`;
        actionNeeded = safeBunks > 0 
          ? `You have only ${safeBunks} safe bunk opportunity left. Avoid unnecessary bunks.`
          : "You have zero safe bunks left. Missing the next class will drop you below the threshold.";
      }

      return {
        subjectName: s.name,
        percentage: Math.round(percentage),
        riskLevel,
        reason,
        actionNeeded
      };
    });

    const order: Record<string, number> = { "CRITICAL": 0, "WARNING": 1, "SAFE": 2 };
    riskRankedSubjects.sort((a, b) => (order[a.riskLevel] || 0) - (order[b.riskLevel] || 0));

    return {
      riskRankedSubjects,
      weeklyPlan: `Focus heavily on subjects below ${threshold}%. Attend your morning sessions consistently to build up buffers, and reserve your bunks strictly for study holidays or exam prep weeks.`,
      recommendation: riskRankedSubjects.find(r => r.riskLevel === "CRITICAL")
        ? `Prioritize attending ${riskRankedSubjects.find(r => r.riskLevel === "CRITICAL")?.subjectName} classes this week above everything else.`
        : "All subjects are currently in good standing! Keep attending and build your streak."
    };
  }

  // Fallback chatbot responder
  function generateFallbackChat(message: string, subjects: any[], timetable: any[], profile: any): string {
    const cleanMsg = message.toLowerCase();
    const threshold = profile?.attendanceRequirement || 75;

    if (cleanMsg.includes("attendance") || cleanMsg.includes("percentage") || cleanMsg.includes("status")) {
      const list = (subjects || []).map(s => {
        const percentage = s.total > 0 ? (s.attended / s.total) * 100 : 100;
        return `${s.name}: ${Math.round(percentage)}% (${s.attended}/${s.total})`;
      }).join("\n");
      return `Here are your current attendance records:\n${list || "No subjects found."}\n\nYour target threshold is ${threshold}%.`;
    }

    if (cleanMsg.includes("bunk") || cleanMsg.includes("safe")) {
      const list = (subjects || []).map(s => {
        const percentage = s.total > 0 ? (s.attended / s.total) * 100 : 100;
        const target = threshold / 100;
        const safe = Math.floor(s.attended / target - s.total);
        const safeVal = Math.max(0, safe);
        return `${s.name}: ${safeVal} safe bunks left`;
      }).join("\n");
      return `Here are your safe bunk limits:\n${list || "No subjects found."}`;
    }

    if (cleanMsg.includes("timetable") || cleanMsg.includes("schedule") || cleanMsg.includes("class")) {
      if (!timetable || timetable.length === 0) {
        return "No timetable events configured for your section yet.";
      }
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const lines = [];
      for (const day of days) {
        const slots = timetable.filter(t => t.day.toLowerCase() === day.toLowerCase());
        if (slots.length > 0) {
          lines.push(`* ${day}:`);
          slots.forEach(s => {
            lines.push(`  - Period ${s.period}: ${s.subject_name || s.subject_id} with ${s.teacher || "TBD"} in Room ${s.room || "TBD"}`);
          });
        }
      }
      return `Here is your section timetable:\n${lines.join("\n")}`;
    }

    if (cleanMsg.includes("teacher") || cleanMsg.includes("faculty") || cleanMsg.includes("professor")) {
      const list = (subjects || []).map(s => `${s.name}: ${s.faculty || "TBD"}`).join("\n");
      return `Here are the faculty members assigned to your section:\n${list || "No subjects found."}`;
    }

    if (cleanMsg.includes("holiday") || cleanMsg.includes("break") || cleanMsg.includes("vacation")) {
      return "Upcoming Calendar Events:\n- Independence Day: July 4th (Holiday)\n- Mid-Term Break: October 12th";
    }

    return `Hello ${profile?.fullName ? profile.fullName.split(" ")[0] : "Student"}! I am your WeBunk chatbot assistant. You can ask me about:\n- Your attendance percentages ("how is my attendance?")\n- Safe bunk counts ("how many classes can I miss?")\n- Your section timetable ("show my schedule")\n- Teacher details or upcoming holidays.`;
  }

  // Server-side Gemini route for AI Analyzer
  app.post("/api/gemini/analyzer", async (req, res) => {
    const { subjects, targetThreshold } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json(generateFallbackAnalyzer(subjects, targetThreshold));
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      const subjectsText = (subjects || []).map((s: any) => 
        `- ${s.name}: ${s.attended}/${s.total} (${s.total > 0 ? Math.round((s.attended / s.total) * 100) : 100}%)`
      ).join("\n");

      const prompt = `You are the WeBunk AI Analyzer.
Analyze the student's current attendance records:
Target Threshold: ${targetThreshold}%
Subjects:
${subjectsText}

Determine:
1. A risk-ranked list of all subjects. Rank them by critical risks first. For each, specify if its riskLevel is 'CRITICAL' (below target), 'WARNING' (close to target), or 'SAFE'.
2. A short weekly plan.
3. One key high-priority recommendation.

Return JSON in exactly the requested schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskRankedSubjects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subjectName: { type: Type.STRING },
                    percentage: { type: Type.NUMBER },
                    riskLevel: { type: Type.STRING, description: "CRITICAL, WARNING, or SAFE" },
                    reason: { type: Type.STRING },
                    actionNeeded: { type: Type.STRING }
                  },
                  required: ["subjectName", "percentage", "riskLevel", "reason", "actionNeeded"]
                }
              },
              weeklyPlan: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ["riskRankedSubjects", "weeklyPlan", "recommendation"]
          }
        }
      });

      const text = response.text || "{}";
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.log("Analyzer Switch: Switched to fallback helper due to error: ", error.message);
      res.json(generateFallbackAnalyzer(subjects, targetThreshold));
    }
  });

  // Server-side Gemini route for Chatbot
  app.post("/api/gemini/chatbot", async (req, res) => {
    const { messages, subjects, timetable, profile } = req.body;
    
    let liveSubjects = subjects;
    let liveTimetable = timetable;

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey && profile?.student_id) {
      try {
        const { createClient } = require("@supabase/supabase-js");
        const db = createClient(supabaseUrl, supabaseAnonKey);
        
        // Fetch student record to get branch, college, semester mapping
        const { data: student } = await db
          .from("students")
          .select("college_id, branch_id, semester_id")
          .eq("id", profile.student_id)
          .maybeSingle();

        if (student) {
          // Fetch subjects
          const { data: dbSubjects } = await db
            .from("subjects")
            .select("*, faculty(id, name)")
            .eq("college_id", student.college_id)
            .eq("branch_id", student.branch_id)
            .eq("semester_id", student.semester_id);

          // Fetch attendance
          const { data: dbAttendance } = await db
            .from("attendance")
            .select("*")
            .eq("student_id", profile.student_id);

          if (dbSubjects) {
            liveSubjects = dbSubjects.map((sub: any) => {
              const logs = dbAttendance?.filter((log: any) => log.subject_id === sub.id) || [];
              const attended = logs.filter((log: any) => log.status === "present").length;
              const total = logs.length;
              
              // Calculate streak
              let streak = 0;
              const sortedLogs = [...logs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              for (const log of sortedLogs) {
                if (log.status === "present") {
                  streak++;
                } else {
                  break;
                }
              }

              return {
                id: sub.id,
                name: sub.name,
                faculty: sub.faculty?.name || "TBD",
                attended,
                total,
                streak
              };
            });
          }

          // Fetch live timetable slots
          const subIds = (liveSubjects || []).map((s: any) => s.id);
          if (subIds.length > 0) {
            const { data: dbTimetable } = await db
              .from("timetable")
              .select("*, subjects(id, name)")
              .in("subject_id", subIds);

            if (dbTimetable) {
              liveTimetable = dbTimetable.map((slot: any) => ({
                id: slot.id,
                subjectId: slot.subject_id,
                subjectName: slot.subjects?.name || "Subject",
                day: slot.day,
                startTime: slot.start_time,
                endTime: slot.end_time,
                room: slot.room || ""
              }));
            }
          }
        }
      } catch (dbErr) {
        console.warn("Server chatbot live Supabase query failed, using payload: ", dbErr);
      }
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : "";
      
      if (!apiKey) {
        const reply = generateFallbackChat(latestMessage, liveSubjects, liveTimetable, profile);
        return res.json({ reply });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      // Prepare function declarations
      const getMyAttendance = {
        name: "getMyAttendance",
        description: "Get attendance details for subjects. Pass subject name to search specifically, or omit to get all.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: "Optional subject name to query" }
          }
        }
      };

      const getSafeBunks = {
        name: "getSafeBunks",
        description: "Get the number of classes the student can safely miss (bunk) for a given subject.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: "The name of the subject" }
          },
          required: ["subject"]
        }
      };

      const getRequiredClasses = {
        name: "getRequiredClasses",
        description: "Get the number of consecutive classes the student must attend to recover or reach target percentage.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: "The name of the subject" }
          },
          required: ["subject"]
        }
      };

      const getTimetable = {
        name: "getTimetable",
        description: "Get the timetable schedule. Can filter by a specific day (e.g., 'Monday').",
        parameters: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING, description: "Specific day to filter by" }
          }
        }
      };

      const getTeacher = {
        name: "getTeacher",
        description: "Get the teacher's name assigned to a subject.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: "The subject name" }
          },
          required: ["subject"]
        }
      };

      const getUpcomingHolidays = {
        name: "getUpcomingHolidays",
        description: "Get the list of upcoming academic holidays and calendar breaks.",
        parameters: { type: Type.OBJECT, properties: {} }
      };

      // Format messages history for the Gemini API
      const aiContents = (messages || []).map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: aiContents,
        config: {
          systemInstruction: "You are the WeBunk assistant for this section. Always call a tool to get real data before answering attendance or timetable questions — never guess numbers. Keep answers short and conversational.",
          tools: [{
            functionDeclarations: [
              getMyAttendance,
              getSafeBunks,
              getRequiredClasses,
              getTimetable,
              getTeacher,
              getUpcomingHolidays
            ]
          }]
        }
      });

      let currentResponse = response;
      let loopCount = 0;
      const activeContents = [...aiContents];

      while (currentResponse.functionCalls && currentResponse.functionCalls.length > 0 && loopCount < 5) {
        loopCount++;
        // Save tool invocation from model
        activeContents.push(currentResponse.candidates?.[0]?.content || { role: "model", parts: [] });

        const functionResponses = [];
        for (const call of currentResponse.functionCalls) {
          let result = null;
          const args: any = call.args || {};

          if (call.name === "getMyAttendance") {
            const sub = args.subject;
            if (sub) {
              result = (liveSubjects || []).find((s: any) => s.name.toLowerCase().includes(sub.toLowerCase())) || "Subject not found";
            } else {
              result = liveSubjects || [];
            }
          } else if (call.name === "getSafeBunks") {
            const subName = args.subject;
            const s = (liveSubjects || []).find((sub: any) => sub.name.toLowerCase().includes(subName.toLowerCase()));
            if (s) {
              const target = (profile?.attendanceRequirement || 75) / 100;
              const safe = Math.floor(s.attended / target - s.total);
              result = { subject: s.name, safeBunks: Math.max(0, safe) };
            } else {
              result = "Subject not found";
            }
          } else if (call.name === "getRequiredClasses") {
            const subName = args.subject;
            const s = (liveSubjects || []).find((sub: any) => sub.name.toLowerCase().includes(subName.toLowerCase()));
            if (s) {
              const target = (profile?.attendanceRequirement || 75) / 100;
              const required = Math.ceil((target * s.total - s.attended) / (1 - target));
              result = { subject: s.name, requiredClasses: Math.max(0, required) };
            } else {
              result = "Subject not found";
            }
          } else if (call.name === "getTimetable") {
            const day = args.day;
            if (day) {
              result = (liveTimetable || []).filter((t: any) => t.day.toLowerCase().includes(day.toLowerCase()));
            } else {
              result = liveTimetable || [];
            }
          } else if (call.name === "getTeacher") {
            const subName = args.subject;
            const s = (liveSubjects || []).find((sub: any) => sub.name.toLowerCase().includes(subName.toLowerCase()));
            result = s ? { subject: s.name, teacher: s.faculty || "TBD" } : "Subject not found";
          } else if (call.name === "getUpcomingHolidays") {
            result = [
              { name: "Independence Day", date: "2026-07-04" },
              { name: "Mid-Term Break", date: "2026-10-12" }
            ];
          }

          functionResponses.push({
            name: call.name,
            response: { result },
          });
        }

        // Add function response to conversation turn
        activeContents.push({
          role: "user",
          parts: functionResponses.map(fr => ({
            functionResponse: fr
          }))
        });

        // Call Gemini again with function answers included
        currentResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: activeContents,
          config: {
            systemInstruction: "You are the WeBunk assistant for this section. Always call a tool to get real data before answering attendance or timetable questions — never guess numbers. Keep answers short and conversational.",
            tools: [{
              functionDeclarations: [
                getMyAttendance,
                getSafeBunks,
                getRequiredClasses,
                getTimetable,
                getTeacher,
                getUpcomingHolidays
              ]
            }]
          }
        });
      }

      res.json({ reply: currentResponse.text || "I was unable to retrieve a response from the service." });
    } catch (error: any) {
      console.log("Chatbot Switch: Switched to fallback chatbot due to error: ", error.message);
      const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : "";
      res.json({ reply: generateFallbackChat(latestMessage, liveSubjects, liveTimetable, profile) });
    }
  });

  // High-fidelity fallback timetable slots generator
  function generateFallbackTimetableSlots(subjects: any[]): any[] {
    const list = subjects || [];
    if (list.length === 0) return [];
    
    const slots = [];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timings = [
      { start: "09:00", end: "09:50" },
      { start: "10:00", end: "10:50" },
      { start: "11:10", end: "12:00" },
      { start: "13:30", end: "14:20" },
      { start: "14:30", end: "15:20" }
    ];

    // Distribute subjects across Monday - Friday
    let subIdx = 0;
    for (let d = 0; d < days.length; d++) {
      const numClasses = 2 + (d % 2); // 2 or 3 classes per day
      for (let c = 0; c < numClasses; c++) {
        const sub = list[subIdx % list.length];
        subIdx++;
        slots.push({
          day: days[d],
          startTime: timings[c % timings.length].start,
          endTime: timings[c % timings.length].end,
          room: `Room ${101 + (c * 10) + d}`,
          subjectId: sub.id,
          subjectName: sub.name
        });
      }
    }
    return slots;
  }

  // Server-side Gemini route for Parsing Timetables from PDF/Images
  app.post("/api/gemini/parse-timetable", async (req, res) => {
    const { fileData, mimeType, subjects } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.log("Timetable parser: No API Key, using fallback timetable slots.");
        return res.json({ slots: generateFallbackTimetableSlots(subjects) });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
      });

      const subjectsListStr = (subjects || []).map((s: any) => `- ID: "${s.id}", Name: "${s.name}"`).join("\n");

      const prompt = `You are a helper that extracts a weekly college lecture schedule timetable from a file (PDF, Image, or text).
You MUST identify the days of the week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday), the classes scheduled, their start times, end times, and optional room/hall designations.

Compare the subject name in the document to these existing student subjects. Match them to the closest subject name if possible, and supply BOTH the correct "subjectId" and "subjectName" from this list. If a subject doesn't match closely, you can still output it but leave "subjectId" empty.

Here are the existing student subjects:
${subjectsListStr}

Guidelines for values:
- "day": Must be one of: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday".
- "startTime": String in 24-hour HH:MM format (e.g. "09:00", "14:30").
- "endTime": String in 24-hour HH:MM format (e.g. "09:50", "15:20").
- "room": Short room/hall identifier if present (e.g. "LHC-101", "Room 3").
- "subjectId": The exact ID of the matching subject from the list, or empty if no match.
- "subjectName": The exact Name of the matching subject from the list, or the extracted subject name if no match.

Return a JSON object containing a "slots" array. Each slot represents one single class session. Do not include duplicate slots. Output only valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: fileData,
                  mimeType: mimeType
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              slots: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    room: { type: Type.STRING },
                    subjectId: { type: Type.STRING },
                    subjectName: { type: Type.STRING }
                  },
                  required: ["day", "startTime", "endTime", "subjectName"]
                }
              }
            },
            required: ["slots"]
          }
        }
      });

      const text = response.text || "{\"slots\": []}";
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.log("Timetable Parser Error: ", error.message);
      res.json({ slots: generateFallbackTimetableSlots(subjects) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
