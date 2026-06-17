import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { db } from "@/src/db/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { UserProfile, UserStatus, Volunteer, VolunteerStatus } from "@/src/types";
import { Users, UserCheck, UserPlus, ShieldAlert, CheckCircle, XCircle, Search, Mail, Phone, Calendar } from "lucide-react";

export default function VolunteerManager() {
  const [requests, setRequests] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const q = query(collection(db, "users"), where("status", "==", "PENDING"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
      setRequests(data);
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const handleApproval = async (uid: string, status: UserStatus) => {
    await updateDoc(doc(db, "users", uid), { status });
    setRequests(requests.filter(r => r.uid !== uid));
  };

  return (
    <AdminLayout user={null} title="Volunteer Management Hub">
      <div className="space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="p-4 bg-primary-blue/5 text-primary-blue rounded-2xl"><Users size={28} /></div>
            <div>
              <p className="text-3xl font-display font-bold text-slate-900">856</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Total Volunteers</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="p-4 bg-primary-green/5 text-primary-green rounded-2xl"><UserCheck size={28} /></div>
            <div>
              <p className="text-3xl font-display font-bold text-slate-900">{requests.length}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Pending Approvals</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="p-4 bg-amber-500/5 text-amber-500 rounded-2xl"><Calendar size={28} /></div>
            <div>
              <p className="text-3xl font-display font-bold text-slate-900">12</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Active Campaigns</p>
            </div>
          </div>
        </div>

        {/* Approval Queue */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-display font-bold text-slate-900">Role & Access Queue</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text" 
                  placeholder="Filter requests..." 
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary-blue/10" 
                />
              </div>
           </div>
           
           <div className="p-8 space-y-6">
              {requests.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto"><UserPlus size={32} /></div>
                   <p className="text-slate-400 font-medium italic">No pending registration requests at this moment.</p>
                </div>
              ) : requests.map((req) => (
                <div key={req.uid} className="bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-lg transition-all flex flex-col lg:flex-row lg:items-center gap-8 relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-2 h-full bg-primary-blue/10" />
                   
                   <div className="flex items-center gap-6 shrink-0 lg:w-1/4">
                      <img src={req.photoURL || `https://ui-avatars.com/api/?name=${req.displayName}`} className="w-16 h-16 rounded-2xl border-4 border-slate-50" />
                      <div>
                         <p className="font-bold text-slate-900 text-lg leading-tight">{req.displayName}</p>
                         <p className="text-xs text-slate-400 font-medium">{req.email}</p>
                      </div>
                   </div>

                   <div className="flex-grow flex flex-col sm:flex-row gap-8 items-center justify-between">
                      <div className="space-y-4 lg:w-1/2">
                         <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                               <ShieldAlert size={14} className="text-amber-500" /> Requested Role
                            </div>
                            <span className="px-3 py-1 bg-primary-blue/5 text-primary-blue text-xs font-bold rounded-full uppercase tracking-widest">{req.role}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-400 rounded border border-slate-100">Social Care</span>
                            <span className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-400 rounded border border-slate-100">Teaching</span>
                            <span className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-400 rounded border border-slate-100">+2 more</span>
                         </div>
                      </div>

                      <div className="flex gap-3 shrink-0">
                         <button 
                           onClick={() => handleApproval(req.uid, UserStatus.APPROVED)}
                           className="px-6 py-3 bg-primary-green text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-opacity-90 shadow-lg shadow-primary-green/20"
                         >
                            <CheckCircle size={18} /> Approve
                         </button>
                         <button 
                           onClick={() => handleApproval(req.uid, UserStatus.REJECTED)}
                           className="px-6 py-3 bg-white border border-red-100 text-red-500 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-50 transition-colors"
                         >
                            <XCircle size={18} /> Reject
                         </button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </AdminLayout>
  );
}
