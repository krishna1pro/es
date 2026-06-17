import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { db, auth } from "@/src/db/firebase";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { CMSPage, CMSSection } from "@/src/types";
import { Edit2, Layout, Plus, Trash2, Save, MoveUp, MoveDown } from "lucide-react";
import { motion } from "motion/react";

export default function CMSManager() {
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<CMSPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchPages = async () => {
      const snapshot = await getDocs(collection(db, "pages"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CMSPage));
      setPages(data);
      setLoading(false);
    };
    fetchPages();
  }, []);

  const handleSave = async () => {
    if (!selectedPage) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "pages", selectedPage.id), {
        ...selectedPage,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid || "system"
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSectionContent = (sectionId: string, field: string, value: any) => {
    if (!selectedPage) return;
    const newSections = selectedPage.sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, content: { ...s.content, [field]: value } };
      }
      return s;
    });
    setSelectedPage({ ...selectedPage, sections: newSections });
  };

  return (
    <AdminLayout user={null} title="Content Infrastructure">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Page List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Portal Nodes</h3>
            <button className="w-8 h-8 bg-blue-900 text-white rounded-xl flex items-center justify-center hover:rotate-90 transition-all shadow-lg">
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-3">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedPage(p); setIsEditing(false); }}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all border-2 ${
                  selectedPage?.id === p.id 
                    ? "bg-blue-900 border-blue-900 text-white shadow-xl translate-x-2" 
                    : "bg-white text-slate-500 hover:border-blue-700 hover:text-blue-900 border-slate-100"
                }`}
              >
                <div className="flex items-center gap-4">
                   <Layout size={18} className={selectedPage?.id === p.id ? "text-blue-400" : "text-slate-300"} />
                   <span className="font-black text-[10px] uppercase tracking-widest">{p.title}</span>
                </div>
                <Edit2 size={12} className="opacity-20" />
              </button>
            ))}
          </div>
        </div>

        {/* Page Editor */}
        <div className="lg:col-span-3">
          {selectedPage ? (
            <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                   <span className="text-blue-700 font-black text-[9px] uppercase tracking-widest block mb-1">Active Editor Mode</span>
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">{selectedPage.title} Configuration</h3>
                </div>
                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <button onClick={handleSave} className="px-6 py-3 bg-blue-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                        <Save size={16} /> Deploy Changes
                      </button>
                      <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="px-8 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                      <Edit2 size={16} /> Reconfigure Structure
                    </button>
                  )}
                </div>
              </div>

              <div className="p-10 space-y-8 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
                {selectedPage.sections.sort((a, b) => a.order - b.order).map((section, idx) => (
                  <div key={section.id} className="border-2 border-slate-50 rounded-[2.5rem] p-8 bg-[#F9F9F8] relative group">
                    <div className="flex justify-between items-center mb-10">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl text-slate-900 flex items-center justify-center font-black text-xs shadow-sm">
                          {idx + 1}
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest leading-none mb-1">Section Component</p>
                           <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">{section.type}</h4>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-900 transition-colors flex items-center justify-center"><MoveUp size={16} /></button>
                        <button className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-900 transition-colors flex items-center justify-center"><MoveDown size={16} /></button>
                        <button className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {Object.keys(section.content).map((field) => (
                        <div key={field} className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{field}</label>
                          {typeof section.content[field] === 'string' ? (
                            <input 
                              type="text"
                              disabled={!isEditing}
                              value={section.content[field]}
                              onChange={(e) => updateSectionContent(section.id, field, e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-sm font-bold shadow-inner focus:ring-4 focus:ring-blue-900/5 outline-none disabled:opacity-50 transition-all"
                            />
                          ) : (
                            <div className="p-5 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-400 italic shadow-inner">
                               Structured Media Node - Visual UI Required
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {isEditing && (
                  <button className="w-full py-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 hover:text-blue-900 hover:border-blue-900 transition-all flex flex-col items-center justify-center gap-4 group">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                       <Plus size={24} />
                    </div>
                    <span className="font-black uppercase tracking-[0.2em] text-[10px]">Append New Content Node</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex items-center justify-center border-4 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-center mx-auto shadow-xl text-slate-200">
                   <Layout size={32} />
                </div>
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">Initialize Operational Session</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
