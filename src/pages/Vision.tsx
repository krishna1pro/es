/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PublicLayout from "@/src/components/layout/PublicLayout";
import BrandedLoading from "@/src/components/BrandedLoading";
import OurVision from "@/src/components/home/OurVision";
import { motion } from "motion/react";
import { ShieldCheck, Target, Lightbulb } from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { use10SecPublicPolling } from "@/src/hooks/use10SecPublicPolling";

export default function Vision() {
  const [visionPage, setVisionPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchVision = async (isBackground = false) => {
    try {
      if (!isBackground && !visionPage) {
        setLoading(true);
      }
      const res = await fetch("/api/public/vision");
      if (res.ok) {
        const data = await res.json();
        if (!isMountedRef.current) return;
        if (data && data.visionPage) {
          setVisionPage(data.visionPage);
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Failed to load vision page:", err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchVision(false);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  use10SecPublicPolling(async (isBackground) => {
    if (isBackground) {
      await fetchVision(true);
    }
  });

  const pageTitle = visionPage?.pageTitle || "Vision for a Better Tomorrow";
  const pageSubtitle = visionPage?.pageSubtitle || "Building a prosperous, inclusive, and sustainable constituency through innovation, integrity, and hard work.";

  return (
    <PublicLayout>
      <section className="bg-blue-900 py-24 text-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6"
          >
            {pageTitle}
          </motion.h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto font-medium">
            {pageSubtitle}
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-24">
             {[
               { icon: Target, title: "Our Mission", text: "To serve the people with dedication and modernize every village with world-class infrastructure." },
               { icon: Lightbulb, title: "Development Goal", text: "100% literacy, accessible healthcare, and thriving local economies for all residents." },
               { icon: ShieldCheck, title: "Core Values", text: "Transparency, accountability, and citizen-first governance at every level." }
             ].map((item, i) => (
               <div key={i} className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center shadow-sm">
                 <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-6">
                    <item.icon size={32} />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-4">{item.title}</h3>
                 <p className="text-slate-500 font-bold leading-relaxed uppercase text-[10px] tracking-widest">{item.text}</p>
               </div>
             ))}
          </div>

          {loading ? (
            <BrandedLoading message="Namaste — Mee Chintada Ravi Kumar" minHeight="min-h-[40vh]" isFirstVisit={false} />
          ) : (
            <OurVision />
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
