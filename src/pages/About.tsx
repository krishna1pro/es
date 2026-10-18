/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PublicLayout from "@/src/components/layout/PublicLayout";
import BrandedLoading from "@/src/components/BrandedLoading";
import { motion } from "motion/react";
import { Shield, Target, Landmark, History } from "lucide-react";
import { useState, useEffect } from "react";

export default function About() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/about")
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setContent(data.data);
        }
      })
      .catch(err => console.error("Failed to load about page:", err))
      .finally(() => setLoading(false));
  }, []);

  const pageTitle = content?.pageTitle || "Our District Core";
  const pageSubtitle = content?.pageSubtitle || "Founded on the principles of transparency and development, we work tirelessly to serve every citizen in the district.";
  const missionTitle = content?.missionTitle || "Our Mission";
  const missionText = content?.missionText || "\"To bridge the gap between governance and citizens using technology and human-centric policies, ensuring sustainable development across all mandals.\"";
  const heroImageUrl = content?.heroImageUrl || "https://images.unsplash.com/photo-1541802645635-11f2286a7482?auto=format&fit=crop&q=80&w=1200";

  return (
    <PublicLayout>
      <div className="bg-slate-50 pb-24">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center space-y-6">
            <h1 className="text-6xl font-display font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
              {pageSubtitle}
            </p>
            <div className="flex justify-center gap-4 pt-8">
              <div className="h-2 w-2 bg-blue-900 rounded-full" />
              <div className="h-2 w-2 bg-emerald-600 rounded-full" />
              <div className="h-2 w-12 bg-blue-900 rounded-full" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-24">
           {loading ? (
             <BrandedLoading message="Namaste — Mee Chintada Ravi Kumar" minHeight="min-h-[50vh]" isFirstVisit={false} />
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <div className="space-y-8">
                   <h2 className="text-4xl font-display font-bold text-blue-900 leading-tight uppercase tracking-[0.2em]">{missionTitle}</h2>
                   <p className="text-lg text-slate-600 leading-relaxed font-light italic">
                     {missionText}
                   </p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                      <div className="space-y-3">
                         <div className="p-3 bg-blue-900/5 text-blue-900 rounded-2xl w-fit"><Landmark size={24} /></div>
                         <h4 className="font-bold text-slate-900">Land Governance</h4>
                         <p className="text-sm text-slate-500">Transparent management of land resources and planning.</p>
                      </div>
                      <div className="space-y-3">
                         <div className="p-3 bg-emerald-600/5 text-emerald-600 rounded-2xl w-fit"><Shield size={24} /></div>
                         <h4 className="font-bold text-slate-900">Security & Safety</h4>
                         <p className="text-sm text-slate-500">Ensuring a safe living environment for every family.</p>
                      </div>
                      <div className="space-y-3">
                         <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit"><Target size={24} /></div>
                         <h4 className="font-bold text-slate-900">Goal Driven</h4>
                         <p className="text-sm text-slate-500">Meeting quarterly targets for infrastructure and health.</p>
                      </div>
                      <div className="space-y-3">
                         <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit"><History size={24} /></div>
                         <h4 className="font-bold text-slate-900">Our Heritage</h4>
                         <p className="text-sm text-slate-500">Preserving the rich cultural history of our ancient district.</p>
                      </div>
                   </div>
                </div>
                <div className="relative">
                   <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
                      <img src={heroImageUrl} className="w-full h-full object-cover" alt="History" />
                      <div className="absolute inset-0 bg-blue-900/20" />
                   </div>
                   <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-600/30 rounded-full blur-3xl" />
                   <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl shadow-2xl" />
                </div>
             </div>
           )}
        </div>
      </div>
    </PublicLayout>
  );
}
