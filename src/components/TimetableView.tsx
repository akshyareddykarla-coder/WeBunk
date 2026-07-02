import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { 
  Plus, Trash2, Calendar, Clock, MapPin, X, AlertCircle, BookOpen, User2,
  UploadCloud, Sparkles, Loader2, Check, HelpCircle, FileText
} from "lucide-react";
import { TimetableSlot, Subject, Profile } from "../types";

interface TimetableProps {
  timetable: TimetableSlot[];
  subjects: Subject[];
  profile?: Profile;
  onAddSlot: (subId: string, name: string, day: string, start: string, end: string, room: string) => void;
  onDeleteSlot: (id: string) => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export default function TimetableView({
  timetable,
  subjects,
  profile,
  onAddSlot,
  onDeleteSlot
}: TimetableProps) {
  const isStudent = profile?.role === "student" || profile?.role === "Student" || !profile?.role;
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'>('Monday');
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedSlots, setExtractedSlots] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:50");
  const [roomName, setRoomName] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;

    const matchedSub = subjects.find(s => s.id === subjectId);
    if (!matchedSub) return;

    onAddSlot(subjectId, matchedSub.name, selectedDay, startTime, endTime, roomName.trim());
    // Reset form
    setRoomName("");
    setShowAddModal(false);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setExtractedSlots([]);

    if (subjects.length === 0) {
      setUploadError("Please add your subjects first so WeBunk can map the imported schedule correctly!");
      setIsUploading(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64WithHeader = reader.result as string;
          const base64Data = base64WithHeader.split(",")[1];
          const mimeType = file.type || "application/pdf";

          const response = await fetch("/api/gemini/parse-timetable", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileData: base64Data,
              mimeType,
              subjects
            })
          });

          if (!response.ok) {
            throw new Error("Failed to process parsing with Gemini server.");
          }

          const data = await response.json();
          if (data.slots && data.slots.length > 0) {
            setExtractedSlots(data.slots);
          } else {
            setUploadError("Gemini could not identify any valid schedule slots in this document. Please verify the content has clear time schedules.");
          }
        } catch (innerErr: any) {
          setUploadError(innerErr.message || "An error occurred while uploading file payload.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError("Error reading the file. Please try a different document format.");
        setIsUploading(false);
      };
    } catch (err: any) {
      setUploadError(err.message || "Could not start file reader.");
      setIsUploading(false);
    }
  };

  const confirmImport = () => {
    if (extractedSlots.length === 0) return;

    extractedSlots.forEach(slot => {
      // Find matching subject ID
      let matchedId = slot.subjectId;
      if (!matchedId) {
        const matchedSub = subjects.find(s => 
          s.name.toLowerCase().includes(slot.subjectName.toLowerCase()) || 
          slot.subjectName.toLowerCase().includes(s.name.toLowerCase())
        );
        matchedId = matchedSub ? matchedSub.id : (subjects[0]?.id || "");
      }

      const finalName = subjects.find(s => s.id === matchedId)?.name || slot.subjectName;

      onAddSlot(
        matchedId,
        finalName,
        slot.day,
        slot.startTime,
        slot.endTime,
        slot.room || ""
      );
    });

    setExtractedSlots([]);
    alert(`Successfully imported ${extractedSlots.length} sessions directly to your schedule!`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Weekly Calendar Schedule</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Establish your active semester lectures layout to compute your daily checklist automations.</p>
        </div>
        {!isStudent && (
          <button
            onClick={() => {
              if (subjects.length === 0) {
                alert("Please add at least one subject first before configuring timetable slots!");
                return;
              }
              setSubjectId(subjects[0].id);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none"
          >
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        )}
      </div>

      {/* AI Timetable PDF & Document Smart Parser Zone */}
      {!isStudent && (
        <div className="bg-gradient-to-br from-indigo-500/5 via-transparent to-indigo-500/10 dark:from-indigo-950/20 dark:to-transparent border border-indigo-100 dark:border-indigo-950/40 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
                AI Timetable Parser
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                Upload your official section schedule (PDF, Image, or text file) to automatically extract, align, and sync lecture timings.
              </p>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">
              Gemini Core
            </span>
          </div>

          {/* Upload Dropzone */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
              dragActive 
                ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20" 
                : "border-slate-200 dark:border-zinc-800 hover:border-indigo-400 bg-white/50 dark:bg-zinc-900/50"
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
              className="hidden" 
            />
            
            {isUploading ? (
              <div className="space-y-1.5 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Scanning & Parsing Schedule...</p>
                <p className="text-[10px] text-slate-400">Gemini is aligning days, hours, and subject maps...</p>
              </div>
            ) : (
              <div className="space-y-1.5 flex flex-col items-center justify-center">
                <UploadCloud className="w-9 h-9 text-indigo-500" />
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Drag and drop your file here, or <span className="text-indigo-600 dark:text-indigo-400 hover:underline">browse files</span>
                </p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">
                  Supports PDF, images, and texts (Max 5MB)
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 flex items-start gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-rose-700 dark:text-rose-400">
                <p>{uploadError}</p>
              </div>
            </div>
          )}

          {/* Extraction Preview list */}
          {extractedSlots.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl p-4 space-y-4 animate-in fade-in-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-950 dark:text-white uppercase tracking-tight">
                    Extracted Lectures Preview
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">Verify extracted slots before merging into your calendar</p>
                </div>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                  {extractedSlots.length} slots found
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {extractedSlots.map((slot, idx) => {
                  const isMatched = !!slot.subjectId;
                  return (
                    <div key={idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-855 bg-slate-50/50 dark:bg-zinc-950/40 flex items-start justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800 dark:text-zinc-200">
                            {slot.subjectName}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full font-black uppercase">
                            {slot.day}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {slot.startTime} - {slot.endTime}
                          </span>
                          {slot.room && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> Room {slot.room}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isMatched ? (
                          <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Mapped
                          </span>
                        ) : (
                          <span className="text-[8px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded font-black uppercase">
                            No ID Match
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  onClick={() => setExtractedSlots([])}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 cursor-pointer"
                >
                  Clear Preview
                </button>
                <button
                  onClick={confirmImport}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> Confirm Import ({extractedSlots.length} Slots)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-850 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-slate-950 dark:text-white text-base">Plan Timetable Lecture</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 dark:text-zinc-300 mb-1">Select Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.faculty})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1">Day of Week</label>
                  <select
                    value={selectedDay}
                    onChange={(e: any) => setSelectedDay(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1">Room / Hall (Optional)</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="E.g., LHC-101"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Add to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {timetable.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <Calendar className="w-12 h-12 text-slate-350 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
            {isStudent ? "No timetable has been published yet." : "No Timetable Available"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
            {isStudent 
              ? "Your college admin has not published the academic calendar timetable for your section yet. Please check back later."
              : "Your timetable is currently empty. Use our AI Timetable Parser above to upload a PDF or image of your timetable, or manually add a slot!"
            }
          </p>
        </div>
      ) : (
        <>
          {/* Week Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 dark:border-zinc-850 custom-scrollbar">
            {DAYS_OF_WEEK.map((day) => {
              const slotsCount = timetable.filter(slot => slot.day === day).length;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50"
                  }`}
                >
                  {day}
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                  }`}>
                    {slotsCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Calendar list for the selected day */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                Lectures for {selectedDay}
              </h3>
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">
                {timetable.filter(s => s.day === selectedDay).length} sessions planned
              </span>
            </div>

            {timetable.filter(s => s.day === selectedDay).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400">
                  {isStudent 
                    ? `No classes scheduled for ${selectedDay}.`
                    : `No classes scheduled for ${selectedDay}. Add slot above!`
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {timetable
                  .filter(s => s.day === selectedDay)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((slot) => {
                    const sub = subjects.find(s => s.id === slot.subjectId);
                    return (
                      <div 
                        key={slot.id}
                        className="p-4 border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/50 dark:bg-zinc-950/20 hover:bg-slate-50 dark:hover:bg-zinc-950/40 transition-all flex justify-between items-start"
                      >
                        <div className="flex gap-3">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-lg h-fit shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{slot.subjectName}</h4>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                              <span className="flex items-center gap-1 font-semibold">
                                <Clock className="w-3.5 h-3.5 text-slate-400" /> {slot.startTime} - {slot.endTime}
                              </span>
                              {slot.room && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Room {slot.room}
                                </span>
                              )}
                              {sub && (
                                <span className="flex items-center gap-1">
                                  <User2 className="w-3.5 h-3.5 text-slate-400" /> {sub.faculty}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isStudent && (
                          <button
                            onClick={() => onDeleteSlot(slot.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0 ml-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
