import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { useAuth } from "@/src/context/AuthContext";
import { Grievance, GrievanceStatus } from "@/src/types";
import { MessageSquare, Clock, CheckCircle, Search, Filter, AlertCircle, User, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function GrievanceManager() {
  const { authFetch, user: authUser } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const fetchGrievances = async () => {
    try {
      const res = await authFetch("/api/admin/submissions/grievances");
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.submissions || []).map((item: any) => ({
          id: item.trackingNumber || item._id,
          trackingNumber: item.trackingNumber,
          userId: item.fullName,
          subject: item.subject,
          description: item.description,
          status: item.status || GrievanceStatus.SUBMITTED,
          createdAt: item.createdAt,
          notes: item.notes || []
        }));
        setGrievances(mapped);
        if (mapped.length > 0 && !selectedId) {
          setSelectedId(mapped[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching grievances:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  const updateStatus = async (id: string, status: GrievanceStatus) => {
    try {
      const res = await authFetch(`/api/admin/submissions/grievances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setGrievances(grievances.map(g => g.id === id ? { ...g, status } : g));
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const sendNote = async (id: string) => {
    if (!noteText.trim()) return;
    try {
      const res = await authFetch(`/api/admin/submissions/grievances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText })
      });
      if (res.ok) {
        setNoteText("");
        fetchGrievances();
      }
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  const selectedGrievance = grievances.find(g => g.id === selectedId);

  return (
    <AdminLayout user={authUser} title="Grievance Redressal Officer">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-160px)]">
        {/* List Column */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="font-display font-bold text-slate-900">Inbound Cases</h3>
                 <span className="px-2 py-0.5 bg-blue-900 text-white text-[10px] font-bold rounded-full">{grievances.length}</span>
              </div>
           </div>

           <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {loading ? (
                <p className="text-center text-slate-400 py-10 text-xs">Loading grievances from MongoDB...</p>
              ) : grievances.length === 0 ? (
                <p className="text-center text-slate-400 py-10 text-xs italic">No grievance submissions found.</p>
              ) : grievances.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedId(g.id)}
                  className={`w-full text-left p-5 rounded-2xl transition-all border ${
                    selectedId === g.id 
                      ? "bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-900/20" 
                      : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                  }`}
                >
                   <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedId === g.id ? "text-blue-200" : "text-slate-400"}`}>
                        {g.trackingNumber}
                      </span>
                   </div>
                   <p className="font-bold text-sm leading-tight line-clamp-1 mb-2">{g.subject}</p>
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        g.status === GrievanceStatus.RESOLVED ? "bg-green-500" : "bg-amber-500"
                      }`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{g.status}</span>
                   </div>
                </button>
              ))}
           </div>
        </div>

        {/* Detail Column */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
           <AnimatePresence mode="wait">
              {selectedGrievance ? (
                <motion.div 
                  key={selectedGrievance.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full"
                >
                   <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center sticky top-0 bg-white z-10">
                      <div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{selectedGrievance.trackingNumber}</p>
                         <h3 className="text-2xl font-display font-bold text-slate-900">{selectedGrievance.subject}</h3>
                      </div>
                      <div className="flex gap-3">
                         <button 
                           onClick={() => updateStatus(selectedGrievance.id, GrievanceStatus.RESOLVED)}
                           className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-green-700"
                         >
                            <CheckCircle size={18} /> Resolve
                          </button>
                      </div>
                   </div>

                   <div className="flex-grow overflow-y-auto p-12 space-y-12">
                      <div className="flex gap-8">
                         <div className="shrink-0">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                               <User size={24} />
                            </div>
                         </div>
                         <div className="space-y-4 max-w-xl">
                            <div className="bg-slate-50 p-6 rounded-3xl rounded-tl-none border border-slate-100">
                               <p className="text-slate-600 leading-relaxed italic">"{selectedGrievance.description}"</p>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Submitted by {selectedGrievance.userId || "Citizen"}</div>
                         </div>
                      </div>

                      <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-6">
                         <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 rounded-xl text-green-400"><AlertCircle size={20} /></div>
                            <p className="font-bold text-lg">Officer Notes & Logs</p>
                         </div>
                         <div className="space-y-4 px-2">
                             {(selectedGrievance.notes || []).map((note: any, idx: number) => (
                               <div key={idx} className="flex gap-4">
                                  <div className="w-1px bg-white/10 shrink-0 self-stretch mt-3 ml-2 relative">
                                     <div className="absolute top-0 -left-1 w-2 h-2 rounded-full bg-green-400" />
                                  </div>
                                  <div>
                                     <p className="text-xs font-bold text-white/90">{note.text}</p>
                                     <p className="text-[10px] text-white/50 font-medium">{note.author} • {new Date(note.createdAt).toLocaleString()}</p>
                                  </div>
                               </div>
                             ))}
                             {(!selectedGrievance.notes || selectedGrievance.notes.length === 0) && (
                               <p className="text-xs text-slate-400 italic">No notes added yet.</p>
                             )}
                         </div>
                      </div>
                   </div>

                   <div className="p-6 border-t border-slate-100 sticky bottom-0 bg-white">
                      <div className="relative">
                         <input 
                           type="text" 
                           value={noteText}
                           onChange={e => setNoteText(e.target.value)}
                           placeholder="Add internal officer note..." 
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-32 outline-none focus:ring-2 focus:ring-blue-700/10"
                         />
                         <button 
                           onClick={() => sendNote(selectedGrievance.id)}
                           className="absolute right-3 top-3 py-2 px-6 bg-blue-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-800"
                         >
                            Add Note
                         </button>
                      </div>
                   </div>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                   Select a grievance item to review details.
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
}
