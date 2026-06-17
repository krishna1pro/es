import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { db } from "@/src/db/firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { Grievance, GrievanceStatus } from "@/src/types";
import { MessageSquare, Clock, CheckCircle, Search, Filter, AlertCircle, User, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function GrievanceManager() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrievances = async () => {
      const q = query(collection(db, "grievances"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grievance));
      setGrievances(data);
      setLoading(false);
    };
    fetchGrievances();
  }, []);

  const updateStatus = async (id: string, status: GrievanceStatus) => {
    await updateDoc(doc(db, "grievances", id), { status });
    setGrievances(grievances.map(g => g.id === id ? { ...g, status } : g));
  };

  const selectedGrievance = grievances.find(g => g.id === selectedId);

  return (
    <AdminLayout user={null} title="Grievance Redressal Officer">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-160px)]">
        {/* List Column */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="font-display font-bold text-slate-900">Inbound Cases</h3>
                 <span className="px-2 py-0.5 bg-primary-blue text-white text-[10px] font-bold rounded-full">{grievances.length}</span>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search ID, Subject..." 
                   className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary-blue/10" 
                 />
              </div>
           </div>

           <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {grievances.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedId(g.id)}
                  className={`w-full text-left p-5 rounded-2xl transition-all border ${
                    selectedId === g.id 
                      ? "bg-primary-blue text-white border-primary-blue shadow-lg shadow-primary-blue/20" 
                      : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                  }`}
                >
                   <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedId === g.id ? "text-blue-200" : "text-slate-400"}`}>
                        {g.trackingNumber}
                      </span>
                      <span className="text-[10px] font-medium opacity-60">2h ago</span>
                   </div>
                   <p className="font-bold text-sm leading-tight line-clamp-1 mb-2">{g.subject}</p>
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        g.status === GrievanceStatus.RESOLVED ? "bg-primary-green" : "bg-amber-500"
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
                           className="btn-secondary px-4 py-2 flex items-center gap-2"
                         >
                            <CheckCircle size={18} /> Resolve
                         </button>
                         <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 font-medium hover:bg-slate-50">Transfer Case</button>
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
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Submitted by {selectedGrievance.userId || "Anonymous Citizen"} • 2:45 PM</div>
                         </div>
                      </div>

                      <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-6">
                         <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 rounded-xl text-primary-green"><AlertCircle size={20} /></div>
                            <p className="font-bold text-lg">Officer Notes & Logs</p>
                         </div>
                         <div className="space-y-4 px-2">
                             <div className="flex gap-4">
                               <div className="w-1px bg-white/10 shrink-0 self-stretch mt-3 ml-2 relative">
                                  <div className="absolute top-0 -left-1 w-2 h-2 rounded-full bg-primary-green" />
                               </div>
                               <div>
                                  <p className="text-xs font-bold text-white/90">Case logged and status set to {selectedGrievance.status}</p>
                                  <p className="text-[10px] text-white/50 font-medium">Automatic system log • June 15, 2026</p>
                               </div>
                             </div>
                         </div>
                      </div>
                   </div>

                   <div className="p-6 border-t border-slate-100 sticky bottom-0 bg-white">
                      <div className="relative">
                         <input 
                           type="text" 
                           placeholder="Write a message to the citizen (public response)..." 
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-32 outline-none focus:ring-2 focus:ring-primary-blue/10"
                         />
                         <button className="absolute right-3 top-3 btn-primary py-2 px-6 text-xs">Send Response</button>
                      </div>
                   </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-12 space-y-4">
                   <div className="w-20 h-20 bg-slate-50 text-slate-100 rounded-full flex items-center justify-center">
                      <MessageSquare size={48} />
                   </div>
                   <p className="text-slate-300 font-medium italic">Select a case from the inbound list to view details and take action.</p>
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
}
