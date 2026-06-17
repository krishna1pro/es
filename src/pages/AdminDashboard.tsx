import { UserProfile, UserStatus } from "@/src/types";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/src/db/firebase";
import { collection, query, where, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { 
  Users, Activity, MessageSquare, Heart, 
  TrendingUp, ArrowUpRight, ArrowDownRight,
  Plus, Calendar, Eye, Check, X
} from "lucide-react";

interface AdminDashboardProps {
  user: UserProfile | null;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("status", "==", UserStatus.PENDING),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setPendingUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (uid: string) => {
    try {
      await updateDoc(doc(db, "users", uid), {
        status: UserStatus.APPROVED
      });
    } catch (err) {
      console.error(err);
    }
  };

  const STATS = [
    { label: "Public Visitors", value: "24.8K", change: "+14.2%", trending: "up", icon: Eye, color: "blue" },
    { label: "Booth Workers", value: "1,240", change: "+2.1%", trending: "up", icon: Users, color: "indigo" },
    { label: "Open Issues", value: "18", change: "-12.4%", trending: "down", icon: MessageSquare, color: "amber" },
    { label: "Community Rating", value: "4.8/5", change: "+0.2", trending: "up", icon: Activity, color: "green" },
  ];

  return (
    <AdminLayout user={user} title="Leadership Command Center">
      <div className="space-y-10">
        {/* Superior Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-[#001D3D] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full" />
          <div className="relative z-10">
            <span className="text-blue-400 font-black uppercase tracking-[0.4em] text-[9px] mb-4 block">Centralized Operations Hub</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9] mb-4">
              Control <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">Session Active</span>
            </h2>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <span className="flex items-center gap-2 text-green-500"><Activity size={12} /> Live Link established</span>
               <span className="w-1 h-1 bg-white/20 rounded-full" />
               <span>Admin: {user?.displayName}</span>
            </div>
          </div>
          <div className="flex gap-4 relative z-10 shrink-0">
             <button className="px-8 py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-2">
                <Plus size={16} /> New Broadcast
             </button>
             <button 
               onClick={() => navigate("/admin/analytics")}
               className="px-8 py-4 bg-white/10 border border-white/10 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/20 transition-all"
             >
                Deep Analytics
             </button>
          </div>
        </div>

        {/* Tactical Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-blue-700 transition-all group"
            >
              <div className="flex justify-between items-start mb-8">
                 <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-700 group-hover:bg-blue-50 transition-all">
                    <stat.icon size={22} />
                 </div>
                 <div className={`px-2 py-1 rounded text-[9px] font-black flex items-center gap-1 ${stat.trending === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {stat.change} {stat.trending === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                 </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
           {/* Section Manager Cards */}
           <div className="xl:col-span-8 space-y-8">
              <div className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] shadow-sm">
                 <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 border-l-4 border-blue-700 pl-4">Digital Presence</h3>
                    <button onClick={() => navigate("/admin/cms")} className="text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline">Launch CMS</button>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { title: "Home Page Edition", status: "Published", date: "Jun 15" },
                      { title: "Press Release Center", status: "Updated", date: "Just now" }
                    ].map((item, i) => (
                      <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                         <div>
                            <p className="text-xs font-black text-slate-800 uppercase mb-1">{item.title}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{item.date}</p>
                         </div>
                         <span className="px-3 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded-full">{item.status}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-slate-900 p-10 rounded-[3rem] text-white">
                    <h4 className="text-lg font-black uppercase tracking-tight mb-8">System Health</h4>
                    <div className="space-y-6">
                       {['Database Latency', 'Global Availability', 'Secure Sync'].map((sys, i) => (
                         <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                            <span className="text-[10px] font-bold uppercase text-slate-400">{sys}</span>
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest leading-none">Optimal</span>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-white border-2 border-slate-100 p-10 rounded-[3rem]">
                    <h4 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-8 text-center">Operational Alerts</h4>
                    <div className="flex flex-col items-center justify-center py-4 space-y-4">
                       <MessageSquare size={32} className="text-blue-700 opacity-20" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All communication channels clear</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Access Management Sidebar */}
           <div className="xl:col-span-4">
              <div className="bg-[#F9F9F8] border-2 border-slate-200 p-10 rounded-[3.5rem] sticky top-24">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-700 border border-slate-100">
                       <Shield size={22} className="text-blue-700" />
                    </div>
                    <div>
                       <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 leading-none">Access Control</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Clearances</p>
                    </div>
                 </div>

                 <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                   {loading ? (
                     <div className="py-12 flex justify-center">
                       <Activity size={24} className="animate-spin text-blue-700" />
                     </div>
                   ) : pendingUsers.length > 0 ? (
                     pendingUsers.map((u) => (
                       <div key={u.uid} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                             <img src={u.photoURL || 'https://ui-avatars.com/api/?name='+u.displayName} className="w-10 h-10 rounded-xl" />
                             <div>
                                <p className="text-[10px] font-black text-slate-900 uppercase leading-none mb-1">{u.displayName}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">{u.role}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleApprove(u.uid)}
                            className="w-8 h-8 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                             <Check size={14} />
                          </button>
                       </div>
                     ))
                   ) : (
                     <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                        <Users size={32} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">No active requests</p>
                     </div>
                   )}
                 </div>

                 <button 
                   onClick={() => navigate("/admin/users")}
                   className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all"
                 >
                    User Management Console
                 </button>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
}

import { Shield } from "lucide-react";
