import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { db } from "@/src/db/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { UserProfile, UserStatus } from "@/src/types";
import { Users, UserCheck, Shield, Trash2, Search, Filter, ShieldAlert, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const ROLES = [
    "Volunteer Manager",
    "Media Publisher",
    "Content Creator",
    "Event Manager",
    "Research Team",
    "Analytics Team",
    "Outreach Team",
    "Office Staff",
    "District Coordinator",
    "Other",
    "SUPER_ADMIN"
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
      setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleUpdate = async (uid: string, updates: Partial<UserProfile>) => {
    try {
      await updateDoc(doc(db, "users", uid), updates);
      setUsers(users.map(u => u.uid === uid ? { ...u, ...updates } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      setUsers(users.filter(u => u.uid !== uid));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || u.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminLayout user={null} title="Leadership Access & Roles">
      <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            {["ALL", "APPROVED", "PENDING"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? "bg-blue-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-[2rem] py-3 pl-12 pr-6 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-700/5 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* User Card List */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((u) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={u.uid}
                className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="flex flex-col sm:flex-row gap-8">
                  {/* Profile Info */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="relative">
                      <img 
                        src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} 
                        className="w-20 h-20 rounded-[2rem] object-cover border-4 border-slate-50 shadow-inner" 
                      />
                      <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center border-2 border-white shadow-lg ${u.status === "APPROVED" ? "bg-green-500" : "bg-amber-500"}`}>
                        {u.status === "APPROVED" ? <UserCheck size={14} className="text-white" /> : <ShieldAlert size={14} className="text-white" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 leading-tight">{u.displayName}</h4>
                      <p className="text-xs font-bold text-slate-400 mt-1">{u.email}</p>
                      <div className="flex items-center gap-2 mt-4">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                           {u.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-grow flex flex-col justify-between items-end gap-6">
                     <div className="flex gap-2">
                        {u.status === "PENDING" && (
                          <button 
                            onClick={() => handleUpdate(u.uid, { status: UserStatus.APPROVED })}
                            className="px-6 py-3 bg-blue-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-800 transition-all active:scale-95"
                          >
                            Approve
                          </button>
                        )}
                        <select 
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-700 transition-colors"
                          value={u.role}
                          onChange={(e) => handleUpdate(u.uid, { role: e.target.value as any })}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button 
                          onClick={() => handleDelete(u.uid)}
                          className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                     </div>
                     
                     <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                       <Award size={12} />
                       UID: {u.uid.substring(0, 12)}...
                     </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
}
