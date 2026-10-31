/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PublicLayout from "@/src/components/layout/PublicLayout";
import BrandedLoading from "@/src/components/BrandedLoading";
import { motion } from "motion/react";
import { Activity, Construction, Droplets, HeartPulse, GraduationCap, Tractor, Home as HomeIcon, MapPin, ArrowRight, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const ICON_MAP: Record<string, any> = {
  "Infrastructure & Roads": Construction,
  "Water & Sanitation": Droplets,
  "Healthcare Facilities": HeartPulse,
  "Education & Schools": GraduationCap,
  "Agriculture & Allied": Tractor,
  "Housing Projects": HomeIcon
};

import { use10SecPublicPolling } from "@/src/hooks/use10SecPublicPolling";

export default function Development() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchDevelopment = async (isBackground = false) => {
    try {
      if (!isBackground && !data) {
        setLoading(true);
      }
      const res = await fetch("/api/public/development");
      if (!res.ok) throw new Error("Failed to load development data");
      const json = await res.json();
      if (!isMountedRef.current) return;
      setData(json.data || json);
      setError(null);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error("Error fetching development data:", err);
      if (!data) {
        setError("Failed to load development page content.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchDevelopment(false);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  use10SecPublicPolling(async (isBackground) => {
    if (isBackground) {
      await fetchDevelopment(true);
    }
  });

  if (loading) {
    return (
      <PublicLayout>
        <BrandedLoading message="Namaste — Mee Chintada Ravi Kumar" isFirstVisit={false} />
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="py-32 flex flex-col justify-center items-center bg-slate-50 text-slate-900 min-h-[60vh] space-y-4">
          <AlertCircle size={48} className="text-red-500" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      </PublicLayout>
    );
  }

  const pageTitle = data?.pageTitle || "Development & Infrastructure";
  const pageSubtitle = data?.pageSubtitle || "Tracking mega projects, rural electrification, road networks, and welfare delivery across all mandals.";
  const projects = data?.projects || [];

  return (
    <PublicLayout>
      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6"
          >
            {pageTitle}
          </motion.h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto font-medium">
            {pageSubtitle}
          </p>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {projects.map((proj: any, i: number) => {
              const IconComponent = ICON_MAP[proj.category] || Construction;
              const progress = proj.progress || 0;
              return (
                <div key={i} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center">
                        <IconComponent size={28} />
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        proj.status === "Completed" ? "bg-green-50 text-green-700" :
                        proj.status === "In Progress" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {proj.status || "In Progress"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">{proj.category}</span>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mt-1 mb-3">{proj.title}</h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{proj.description}</p>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Execution Progress</span>
                        <span className="text-slate-900">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-900 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-blue-700" /> {proj.location}</span>
                    <span>Budget: {proj.budget}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
