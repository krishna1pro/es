import { UserProfile, UserStatus } from "@/src/types";
import { motion } from "motion/react";
import { Clock, ShieldAlert, LogOut, RefreshCw } from "lucide-react";
import { auth, db } from "@/src/db/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";

interface WaitingRoomProps {
  user: UserProfile | null;
}

export default function WaitingRoom({ user }: WaitingRoomProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UserProfile;
        if (data.status === UserStatus.APPROVED) {
          window.location.href = "/admin"; // Force reload for fresh state
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    localStorage.removeItem("mock_user_id");
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full text-center space-y-12"
      >
        <div className="space-y-6">
          <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center mx-auto shadow-sm">
            <Clock size={24} className="text-slate-400" />
          </div>
          <h1 className="text-3xl font-medium text-slate-900 tracking-tight">
            Thank you for registering.
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            Your request for access as <span className="font-semibold text-slate-800">{user?.role}</span> is under review. You will receive access after administrator approval.
          </p>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col items-center gap-6">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
             <RefreshCw size={12} className="animate-spin" />
             Awaiting System Approval
           </div>
           
           <button
             onClick={handleLogout}
             className="text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors"
           >
             Return Home
           </button>
        </div>
      </motion.div>
    </div>
  );
}
