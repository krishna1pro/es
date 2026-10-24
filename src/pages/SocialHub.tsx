/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { PlayCircle, ExternalLink, Globe, Activity, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function SocialHub() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/social/channels")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load social channels");
        return res.json();
      })
      .then(json => {
        setChannels(json.channels || json.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching social hub:", err);
        setError("Failed to load social media channels.");
        setLoading(false);
      });
  }, []);

  return (
    <PublicLayout>
      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 text-center">
          <span className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Official Networks</span>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4"
          >
            Social Media Hub
          </motion.h1>
          <p className="text-slate-400 text-sm font-medium max-w-2xl mx-auto leading-relaxed">
            Connect across verified official channels for live updates, video streams, press statements, and public announcements.
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Activity className="animate-spin text-blue-600" size={40} />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-600 font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">
              No active social channels currently available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {channels.map((ch, i) => (
                <motion.div
                  key={ch.channelId || i}
                  whileHover={{ y: -8 }}
                  className="bg-slate-50 border border-slate-200 p-8 rounded-[2.5rem] flex flex-col justify-between shadow-sm hover:shadow-xl transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center uppercase shadow-lg">
                        {ch.platform?.[0] || "S"}
                      </div>
                      <span className="px-3 py-1 bg-white rounded-full text-[9px] font-black uppercase tracking-widest text-slate-700 shadow-sm border border-slate-100">
                        {ch.platform || "Official"}
                      </span>
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">
                      {ch.displayName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mb-6">
                      Official verified channel updates and broadcasts.
                    </p>
                  </div>

                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm"
                  >
                    <span>Visit Channel</span>
                    <ExternalLink size={14} />
                  </a>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
