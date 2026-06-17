import { UserProfile } from "@/src/types";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, Layout, FileText, MessageSquare, 
  LogOut, Menu, Bell, Image as ImageIcon,
  ShieldCheck, Activity, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { signOut } from "firebase/auth";
import { auth } from "@/src/db/firebase";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  title: string;
}

const MENU_ITEMS = [
  { name: "Command Center", path: "/admin", icon: Activity },
  { name: "Content Infra", path: "/admin/cms", icon: Layout },
  { name: "Broadcast Media", path: "/admin/media", icon: ImageIcon },
  { name: "Article Engine", path: "/admin/articles", icon: FileText },
  { name: "Volunteer Hub", path: "/admin/volunteers", icon: UserCheck },
  { name: "Public Grievance", path: "/admin/grievances", icon: MessageSquare },
  { name: "Access & Roles", path: "/admin/users", icon: Users },
  { name: "System Analytics", path: "/admin/analytics", icon: ShieldCheck },
];

export default function AdminLayout({ children, user, title }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    localStorage.removeItem("mock_user_id");
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "w-72" : "w-20"
        } bg-[#001D3D] text-slate-400 transition-all duration-300 flex flex-col fixed h-full z-50 shadow-2xl border-r border-[#002B5B]`}
      >
        <div className="h-20 flex items-center px-6 bg-[#001D3D] border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg border border-white/10">
              LCC
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <span className="font-black text-white tracking-tighter uppercase truncate text-sm block leading-none">Leadership</span>
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-1 block leading-none">Control Center</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-grow py-8 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white text-slate-400 hover:text-blue-900 transition-all overflow-hidden relative shadow-inner"
              >
                <Icon size={20} className="shrink-0 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
                {isSidebarOpen && <span className="font-black text-[10px] uppercase tracking-widest leading-none">{item.name}</span>}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[9px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-2xl z-50 border border-slate-700 uppercase tracking-widest">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-500"
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span className="font-bold text-[11px] uppercase tracking-wider">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-grow flex flex-col transition-all duration-300 ${isSidebarOpen ? "pl-72" : "pl-20"}`}>
        {/* Header */}
        <header className="h-16 sm:h-20 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-black text-slate-800 tracking-tighter uppercase">{title}</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button className="relative p-2 text-slate-400 hover:text-blue-700 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-black text-slate-900 leading-none mb-1 uppercase tracking-tight">{user?.displayName || "Admin User"}</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <ShieldCheck size={10} className="text-green-600" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || "System Admin"}</span>
                </div>
              </div>
              <img 
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'Admin'}&background=1d4ed8&color=fff`} 
                alt="Profile" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover border border-slate-200 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
