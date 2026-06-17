import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle, db, auth } from "@/src/db/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile, UserStatus } from "@/src/types";
import { motion } from "motion/react";
import { ShieldCheck, UserPlus, Lock, ArrowRight } from "lucide-react";

interface AdminAccessProps {
  user: UserProfile | null;
}

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
  "Other"
];

export default function AdminAccess({ user }: AdminAccessProps) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [requestedRole, setRequestedRole] = useState(ROLES[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.status === UserStatus.APPROVED || user.uid.startsWith('mock_')) {
        navigate("/admin");
      } else if (user.status === UserStatus.PENDING) {
        navigate("/waiting-room");
      }
    }
  }, [user, navigate]);

  const handleMockLogin = async (email: string) => {
    setLoading(true);
    try {
      const mockUid = `mock_${email.replace(/[@.]/g, '_')}`;
      const userDoc = await getDoc(doc(db, "users", mockUid));
      
      if (userDoc.exists()) {
        localStorage.setItem("mock_user_id", mockUid);
        window.location.href = "/admin"; 
      } else {
        localStorage.setItem("temp_mock_email", email);
        localStorage.setItem("temp_mock_uid", mockUid);
        setIsRegistering(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    const mockUid = localStorage.getItem("temp_mock_uid");
    const mockEmail = localStorage.getItem("temp_mock_email");
    
    if (!mockUid || !mockEmail) return;
    
    try {
      const newUser: UserProfile = {
        uid: mockUid,
        email: mockEmail,
        displayName: mockEmail.split('@')[0].toUpperCase(),
        photoURL: `https://ui-avatars.com/api/?name=${mockEmail}&background=random`,
        role: requestedRole as any,
        status: UserStatus.PENDING, // REQUIRE APPROVAL as per prompt
        permissions: [], 
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", mockUid), {
        ...newUser,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      
      localStorage.setItem("mock_user_id", mockUid);
      window.location.href = "/waiting-room";
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] shadow-2xl overflow-hidden"
        >
          <div className="bg-blue-900 p-12 text-center text-white relative">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl backdrop-blur-xl">
              <Lock size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">Leadership Control</h1>
            <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.2em]">Authorized Personnel Only</p>
          </div>

          <div className="p-10">
            {!isRegistering ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-1.5 h-4 bg-blue-700 rounded-full" />
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Security Console</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => handleMockLogin("krishnapro216@gmail.com")}
                      className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-600 hover:bg-white hover:shadow-xl transition-all"
                    >
                      <div className="text-left">
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-400">Super Admin Access</p>
                        <p className="text-sm font-black text-slate-800">krishnapro216@gmail.com</p>
                      </div>
                      <ArrowRight size={20} className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </button>

                    <div className="pt-6 mt-2 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Access Request Center</p>
                      <div className="flex gap-2">
                        <input 
                          id="new-tester-email"
                          type="email" 
                          placeholder="your.name@team.com"
                          className="flex-grow bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-bold outline-none focus:bg-white focus:border-blue-700 transition-all shadow-inner"
                        />
                        <button 
                          onClick={() => {
                            const email = (document.getElementById("new-tester-email") as HTMLInputElement).value;
                            if (email) handleMockLogin(email);
                          }}
                          className="px-8 py-4 bg-blue-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-900 active:scale-95 transition-all"
                        >
                          Request
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Select Your Functional Role</label>
                   <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                     {ROLES.map(role => (
                       <button
                         key={role}
                         onClick={() => setRequestedRole(role)}
                         className={`w-full p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-left border-2 transition-all ${requestedRole === role ? "bg-blue-800 border-blue-800 text-white shadow-lg" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"}`}
                       >
                         {role}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full py-5 bg-blue-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-blue-800 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <UserPlus size={18} />
                    {loading ? "Processing..." : "Submit Access Request"}
                  </button>
                  <button 
                    onClick={() => setIsRegistering(false)} 
                    className="w-full text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-slate-800 transition-colors"
                  >
                    Back to Security Console
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        
        <p className="mt-8 text-center text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] opacity-50">
          Encrypted Leadership Node • v4.0.0
        </p>
      </div>
    </div>
  );
}
