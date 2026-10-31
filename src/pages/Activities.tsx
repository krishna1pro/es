/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PublicLayout from "@/src/components/layout/PublicLayout";
import BrandedLoading from "@/src/components/BrandedLoading";
import { DailyActivities, MonthlyActivities, YearlyReport } from "@/src/components/home/ActivitiesGrid";
import { motion } from "motion/react";
import { Calendar, Filter, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { use10SecPublicPolling } from "@/src/hooks/use10SecPublicPolling";

export default function Activities() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchActivities = async (isBackground = false) => {
    try {
      if (!isBackground && !data) {
        setLoading(true);
      }
      const res = await fetch("/api/public/activities");
      if (!res.ok) throw new Error("Failed to load activities");
      const json = await res.json();
      if (!isMountedRef.current) return;
      setData(json.data || json);
      setError(null);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error("Error fetching activities:", err);
      if (!data) {
        setError("Failed to load activities page content.");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchActivities(false);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  use10SecPublicPolling(async (isBackground) => {
    if (isBackground) {
      await fetchActivities(true);
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

  return (
    <PublicLayout>
      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6"
          >
            District Activities & Timeline
          </motion.h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto font-medium">
            Daily governance schedules, public interactions, and regular progress reports across constituencies.
          </p>
        </div>
      </section>

      <div className="py-24 bg-slate-50 space-y-32">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <DailyActivities />
        </div>
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <MonthlyActivities />
        </div>
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <YearlyReport />
        </div>
      </div>
    </PublicLayout>
  );
}
