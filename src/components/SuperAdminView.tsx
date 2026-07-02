import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building, Users, Shield, RefreshCw, Plus, ToggleLeft, ToggleRight, Key, BarChart3, 
  CheckCircle, AlertCircle, Trash2, Mail, ShieldAlert, BookOpen, Clock, Activity, Search
} from "lucide-react";
import { supabase } from "../supabase";
import { createClient } from "@supabase/supabase-js";

interface SuperAdminProps {
  profile: any;
  onLogout: () => void;
}

export default function SuperAdminView({ profile, onLogout }: SuperAdminProps) {
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "colleges" | "admins">("dashboard");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Data states
  const [colleges, setColleges] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [studentsCount, setStudentsCount] = useState(0);

  // Forms states
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newCollegeLoc, setNewCollegeLoc] = useState("");

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedCollegeId, setSelectedCollegeId] = useState("");

  // Search/Filter states
  const [collegeSearch, setCollegeSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4500);
  };

  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorMsg("");
    try {
      // 1. Fetch Colleges
      const { data: colData, error: colErr } = await supabase
        .from("colleges")
        .select("*")
        .order("name", { ascending: true });
      if (colErr) throw colErr;
      setColleges(colData || []);

      // 2. Fetch Admins
      const { data: admData, error: admErr } = await supabase
        .from("profiles")
        .select("*, colleges(name)")
        .eq("role", "admin")
        .order("full_name", { ascending: true });
      if (admErr) throw admErr;
      setAdmins(admData || []);

      // 3. Fetch Students count
      const { count, error: stdErr } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");
      if (!stdErr) {
        setStudentsCount(count || 0);
      }
    } catch (err: any) {
      console.error("SuperAdmin load failed:", err);
      triggerError(err.message || "Failed to load database records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Add College
  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !newCollegeName.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("colleges")
        .insert({
          name: newCollegeName.trim(),
          location: newCollegeLoc.trim() || null,
          status: "active"
        });
      if (error) throw error;

      setNewCollegeName("");
      setNewCollegeLoc("");
      triggerSuccess("College campus registered successfully!");
      loadData();
    } catch (err: any) {
      triggerError(err.message || "Failed to add college.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle College status (Enable/Disable)
  const handleToggleCollegeStatus = async (collegeId: string, currentStatus: string) => {
    if (!supabase) return;
    const nextStatus = currentStatus === "active" ? "disabled" : "active";
    setLoading(true);
    try {
      const { error } = await supabase
        .from("colleges")
        .update({ status: nextStatus })
        .eq("id", collegeId);
      if (error) throw error;

      triggerSuccess(`College status set to ${nextStatus}.`);
      loadData();
    } catch (err: any) {
      triggerError(err.message || "Failed to update college status.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Create College Admin Account
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !adminEmail || !adminPassword || !selectedCollegeId) {
      triggerError("Please fill in all admin credentials.");
      return;
    }
    setLoading(true);
    try {
      // Find college name
      const targetCollege = colleges.find(c => c.id === selectedCollegeId);
      if (!targetCollege) throw new Error("Selected college not found.");

      // Initialize a secondary supabase client instance to register the admin without logging out the Super Admin
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
      
      const secondarySupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });

      // Sign up the new admin user
      const { data, error: signUpErr } = await secondarySupabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            full_name: adminName || "College Admin",
            college_name: targetCollege.name,
            role: "admin"
          }
        }
      });

      if (signUpErr) throw signUpErr;

      // Update the created profile explicitly to ensure role is 'admin' and college_id is set
      if (data?.user) {
        const { error: pErr } = await supabase
          .from("profiles")
          .update({
            role: "admin",
            college_id: selectedCollegeId,
            full_name: adminName || "College Admin"
          })
          .eq("id", data.user.id);
        if (pErr) throw pErr;
      }

      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      triggerSuccess("College Admin account provisioned successfully!");
      loadData();
    } catch (err: any) {
      triggerError(err.message || "Failed to provision admin account.");
    } finally {
      setLoading(false);
    }
  };

  // Reset Admin Password
  const handleResetAdminPassword = async (email: string) => {
    if (!supabase) return;
    if (!confirm(`Are you sure you want to dispatch a password recovery link to ${email}?`)) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      triggerSuccess(`Password reset email dispatched to ${email}!`);
    } catch (err: any) {
      triggerError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  // Delete College Admin Profile record
  const handleDeleteAdmin = async (profileId: string) => {
    if (!supabase) return;
    if (!confirm("Are you sure you want to de-provision this admin? This will remove their dashboard access.")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);
      if (error) throw error;
      triggerSuccess("Admin account removed successfully.");
      loadData();
    } catch (err: any) {
      triggerError(err.message || "Failed to remove admin account.");
    } finally {
      setLoading(false);
    }
  };

  const filteredColleges = colleges.filter(c => 
    c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    (c.location && c.location.toLowerCase().includes(collegeSearch.toLowerCase()))
  );

  const filteredAdmins = admins.filter(a => 
    a.full_name.toLowerCase().includes(adminSearch.toLowerCase()) ||
    a.email.toLowerCase().includes(adminSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Super Admin Greeting header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-2">
          <ShieldAlert className="w-64 h-64 text-indigo-500" />
        </div>
        <div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">SUPER PLATFORM ADMIN</span>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            System Registrar Management
          </h2>
          <p className="text-xs text-slate-400 font-medium max-w-xl">
            SaaS Platform Administrator. Provision universities, authorize registrar accounts, audit system-wide analytics.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="text-xs font-bold text-indigo-400 bg-indigo-950 border border-indigo-900/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 fill-indigo-900" />
            Global Control
          </span>
        </div>
      </div>

      {/* Real-time Alerts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-500" />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Super Admin Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-zinc-800 pb-1">
        {[
          { id: "dashboard", label: "Overview Metrics", icon: <BarChart3 className="w-4 h-4" /> },
          { id: "colleges", label: "Campus Networks", icon: <Building className="w-4 h-4" /> },
          { id: "admins", label: "College Registrar Admins", icon: <Users className="w-4 h-4" /> }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                isActive 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                  : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-bold">Querying platform database...</p>
          </div>
        ) : (
          <div>
            {/* TAB 1: OVERVIEW */}
            {activeSubTab === "dashboard" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    Platform Summary
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Global SaaS metrics across all registered universities.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Campus Networks</span>
                      <Building className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{colleges.length}</div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Registered college systems</p>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Registrar Admins</span>
                      <Users className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{admins.length}</div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Campus administrators</p>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Active Students</span>
                      <Users className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{studentsCount}</div>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">Platform student enrollments</p>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-2xl">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-3">SaaS Activity Log</span>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs">
                      <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">System Online</span>
                        <span className="text-slate-400 dark:text-zinc-500 ml-2">WebBunk SaaS Platform engine fully operational (Uptime 99.98%).</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">Colleges Synced</span>
                        <span className="text-slate-400 dark:text-zinc-500 ml-2">Synced {colleges.length} campuses with Supabase schemas successfully.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COLLEGES */}
            {activeSubTab === "colleges" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Campus Network Administration
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Register campuses and manage their activation status.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left form column */}
                  <form onSubmit={handleAddCollege} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-4 h-fit">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Register New Campus</span>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">College Name</label>
                      <input
                        type="text"
                        required
                        value={newCollegeName}
                        onChange={(e) => setNewCollegeName(e.target.value)}
                        placeholder="e.g. Stanford University"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Location / City</label>
                      <input
                        type="text"
                        value={newCollegeLoc}
                        onChange={(e) => setNewCollegeLoc(e.target.value)}
                        placeholder="e.g. Stanford, California"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                      Register College
                    </button>
                  </form>

                  {/* Right list column */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={collegeSearch}
                        onChange={(e) => setCollegeSearch(e.target.value)}
                        placeholder="Filter campuses by name or location..."
                        className="pl-9 w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-250 dark:border-zinc-855">
                          <tr>
                            <th className="p-3">College Name</th>
                            <th className="p-3">Location</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                          {filteredColleges.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-slate-400">No campuses registered matching search criteria.</td>
                            </tr>
                          ) : (
                            filteredColleges.map((col) => (
                              <tr key={col.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40">
                                <td className="p-3 font-bold text-slate-800 dark:text-zinc-200">{col.name}</td>
                                <td className="p-3 font-medium text-slate-500 dark:text-zinc-400">{col.location || "N/A"}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    col.status === "disabled"
                                      ? "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                                      : "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                                  }`}>
                                    {col.status || "active"}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <button
                                    onClick={() => handleToggleCollegeStatus(col.id, col.status)}
                                    className={`p-1.5 rounded cursor-pointer ${
                                      col.status === "disabled"
                                        ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/25"
                                        : "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25"
                                    }`}
                                    title={col.status === "disabled" ? "Enable College" : "Disable College"}
                                  >
                                    {col.status === "disabled" ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ADMINS */}
            {activeSubTab === "admins" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    College Registrar Accounts
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Provision admin accounts and map them to their college campuses.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Form */}
                  <form onSubmit={handleCreateAdmin} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3.5 h-fit">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Create Admin User</span>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Admin Name</label>
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned College</label>
                      <select
                        value={selectedCollegeId}
                        onChange={(e) => setSelectedCollegeId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      >
                        <option value="">-- Select Campus --</option>
                        {colleges.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@vardhaman.edu"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Password</label>
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg cursor-pointer">
                      Create Admin Account
                    </button>
                  </form>

                  {/* Right List */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Filter admins by name or email..."
                        className="pl-9 w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-250 dark:border-zinc-855">
                          <tr>
                            <th className="p-3">Admin Name</th>
                            <th className="p-3">Email Address</th>
                            <th className="p-3">College Mapped</th>
                            <th className="p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                          {filteredAdmins.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-slate-400">No registrar admins matching search criteria.</td>
                            </tr>
                          ) : (
                            filteredAdmins.map((adm) => (
                              <tr key={adm.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40">
                                <td className="p-3 font-bold text-slate-800 dark:text-zinc-200">{adm.full_name}</td>
                                <td className="p-3 font-semibold text-indigo-500 dark:text-indigo-400">{adm.email}</td>
                                <td className="p-3 font-medium text-slate-500 dark:text-zinc-400">{adm.colleges?.name || "N/A"}</td>
                                <td className="p-3 flex items-center gap-1">
                                  <button
                                    onClick={() => handleResetAdminPassword(adm.email)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/25 rounded cursor-pointer"
                                    title="Send Password Reset Email"
                                  >
                                    <Key className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAdmin(adm.id)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded cursor-pointer"
                                    title="De-authorize Admin"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
