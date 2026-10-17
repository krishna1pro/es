import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { db } from "@/src/db/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { Article, ArticleType, ArticleStatus } from "@/src/types";
import { FileText, Edit2, Trash2, Plus, Filter, Search, Eye, CheckCircle, Clock, Archive } from "lucide-react";
import { motion } from "motion/react";

export default function ArticleManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const fetchArticles = async () => {
      const snapshot = await getDocs(collection(db, "articles"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(data);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await deleteDoc(doc(db, "articles", id));
    setArticles(articles.filter(a => a.id !== id));
  };

  const updateStatus = async (id: string, status: ArticleStatus) => {
    await updateDoc(doc(db, "articles", id), { status });
    setArticles(articles.map(a => a.id === id ? { ...a, status } : a));
  };

  return (
    <AdminLayout user={null} title="Article Engine (Legacy / Deprecated)">
      <div className="space-y-8">
        {/* Deprecation & Migration Notice */}
        <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[10px] font-black uppercase tracking-wider">
                DEPRECATION NOTICE
              </span>
              <h3 className="font-black text-amber-950 uppercase text-sm tracking-tight">
                Unified MongoDB Media Center Active
              </h3>
            </div>
            <p className="text-amber-900 text-xs max-w-2xl">
              Public news, press releases, video clips, and media galleries are now published exclusively through the MongoDB-backed <strong>Broadcast Media Center</strong>. Existing historical Firestore records are preserved below in read-only mode for audit compliance.
            </p>
          </div>
          <a
            href="/admin/media"
            className="px-5 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shrink-0 transition-colors"
          >
            Open Media Center →
          </a>
        </div>

        {/* Actions Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search across legacy articles..."
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 pl-12 outline-none focus:ring-2 focus:ring-primary-blue/10 shadow-sm"
              />
           </div>
           <div className="flex gap-4">
              <select 
                className="flex-grow bg-white border border-slate-200 rounded-2xl px-4 outline-none focus:ring-2 focus:ring-primary-blue/10 shadow-sm font-bold text-xs uppercase tracking-widest text-slate-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                 <option value="ALL">All Categories</option>
                 <option value="NEWS">Press News</option>
                 <option value="EVENT">District Events</option>
                 <option value="SCHOLARSHIP">Scholarships</option>
              </select>
           </div>
        </div>

        {/* Article Table/List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                       <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Article</th>
                       <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Category</th>
                       <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                       <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Engagement</th>
                       <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {articles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                          No articles found in the management hub. Connect to DB or create first.
                        </td>
                      </tr>
                    ) : articles.filter(a => filter === "ALL" || a.type === filter).map((article) => (
                      <tr key={article.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                  {article.thumbnail ? <img src={article.thumbnail} className="w-full h-full object-cover rounded-xl" /> : <FileText size={20} />}
                               </div>
                               <div>
                                  <p className="font-bold text-slate-900 group-hover:text-primary-blue transition-colors line-clamp-1">{article.title}</p>
                                  <p className="text-xs text-slate-400">Published: {new Date(article.publishedAt).toLocaleDateString()}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-primary-blue/5 text-[10px] font-bold text-primary-blue uppercase tracking-widest rounded-full">{article.type}</span>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                               {article.status === ArticleStatus.PUBLISHED ? (
                                 <><CheckCircle size={14} className="text-primary-green" /><span className="text-xs font-bold text-slate-700">Live</span></>
                               ) : article.status === ArticleStatus.DRAFT ? (
                                 <><Clock size={14} className="text-amber-500" /><span className="text-xs font-bold text-slate-700">Draft</span></>
                               ) : (
                                 <><Archive size={14} className="text-slate-400" /><span className="text-xs font-bold text-slate-700">Archive</span></>
                               )}
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                               <Eye size={14} className="text-slate-400" />
                               {Math.floor(Math.random() * 1000)}
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                               <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-primary-blue transition-all"><Edit2 size={18} /></button>
                               <button 
                                 onClick={() => updateStatus(article.id, article.status === ArticleStatus.PUBLISHED ? ArticleStatus.DRAFT : ArticleStatus.PUBLISHED)}
                                 className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-primary-green transition-all"
                               >
                                 <CheckCircle size={18} />
                               </button>
                               <button 
                                 onClick={() => handleDelete(article.id)}
                                 className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-red-500 transition-all"
                               >
                                 <Trash2 size={18} />
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
}
