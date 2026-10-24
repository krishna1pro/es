/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Image as ImageIcon, PlayCircle, ExternalLink, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import HomeIcon from "./HomeIcon";

export function MediaCenterRevamp({ data, content }: { data?: any; content?: any }) {
  const [mediaData, setMediaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("ALL");

  const TABS = [
    { label: "All Featured", key: "ALL" },
    { label: "Photo Gallery", key: "PHOTO_GALLERY" },
    { label: "Video Gallery", key: "VIDEO_GALLERY" },
    { label: "Press Releases", key: "PRESS_RELEASES" },
    { label: "News Coverage", key: "NEWS_COVERAGE" },
    { label: "Interviews", key: "INTERVIEWS" }
  ];

  const fetchHomepageMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/public/media");
      if (!res.ok) {
        throw new Error(`Failed to load homepage media: HTTP ${res.status}`);
      }
      const json = await res.json();
      setMediaData(json.data || json);
    } catch (err: any) {
      console.error("[MediaCenterRevamp] Error fetching homepage media:", err);
      setError(err.message || "Failed to load featured media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepageMedia();
  }, []);

  const rawItems = Array.isArray(mediaData?.items) ? mediaData.items : [];
  const homeItems = rawItems
    .filter((item: any) => item.showOnHome === true && item.status === "PUBLISHED")
    .sort((a: any, b: any) => {
      const orderA = typeof a.sortOrder === "number" ? a.sortOrder : (typeof a.order === "number" ? a.order : 0);
      const orderB = typeof b.sortOrder === "number" ? b.sortOrder : (typeof b.order === "number" ? b.order : 0);
      if (orderA !== orderB) return orderA - orderB;
      const timeA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    })
    .slice(0, 4);

  const displayItems = activeTab === "ALL"
    ? homeItems
    : homeItems.filter((item: any) => {
        if (!item.category) return false;
        const itemCat = item.category.toUpperCase().replace(/\s+/g, "_");
        const tabCat = activeTab.toUpperCase().replace(/\s+/g, "_");
        return itemCat === tabCat;
      });

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <h2 className="text-xl font-black uppercase tracking-tighter text-blue-900 flex items-center gap-3">
          <ImageIcon size={24} className="text-blue-600" /> {mediaData?.pageTitle || mediaData?.title || data?.title || "Media Center"}
        </h2>
        <div className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-xl overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-blue-800 text-white shadow-xl"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center items-center">
          <Activity className="animate-spin text-blue-600" size={32} />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500 font-bold uppercase text-xs tracking-widest flex flex-col items-center gap-3">
          <AlertCircle size={28} className="text-red-500" />
          <span>Unable to load featured media from authoritative storage.</span>
          <button
            onClick={fetchHomepageMedia}
            className="mt-2 px-6 py-2.5 bg-blue-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-800 transition-all shadow-md flex items-center gap-2"
          >
            <RefreshCw size={12} /> Retry Connection
          </button>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-16 text-slate-400 font-bold uppercase text-xs tracking-widest">
          {activeTab === "ALL" ? "No featured media items for home." : `No featured ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()} items for home.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayItems.map((item: any, i: number) => {
            const streamUrl = item.publicMediaUrl || `/api/public/media/stream/${item.mediaId || item.id}`;
            return (
              <motion.div
                key={item.mediaId || item.id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
              >
                <a href={streamUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="aspect-[16/10] bg-slate-100 rounded-3xl overflow-hidden relative mb-4 border border-slate-100">
                    <img
                      src={item.thumbnailUrl || item.img || "https://picsum.photos/seed/med1/600/400"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://picsum.photos/seed/med1/600/400";
                      }}
                    />
                    {item.mediaType === "VIDEO" && (
                      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur text-white p-2 rounded-full shadow-lg">
                        <PlayCircle size={16} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent flex items-end p-6">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest line-clamp-2">
                        {item.title} &rarr;
                      </p>
                    </div>
                  </div>
                </a>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <Link
          to="/media-center"
          className="px-12 py-4 bg-white border-2 border-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-all active:scale-95 inline-block shadow-sm"
        >
          View All Media Archive
        </Link>
      </div>
    </div>
  );
}

export function SocialMediaHub({ data, content }: { data?: any; content?: any }) {
  const [channels, setChannels] = useState<any[]>(data?.platforms || content?.platforms || []);
  const [loading, setLoading] = useState(channels.length === 0);

  useEffect(() => {
    fetch("/api/public/social/channels")
      .then(res => res.json())
      .then(json => {
        if (json.channels && Array.isArray(json.channels) && json.channels.length > 0) {
          setChannels(json.channels);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching homepage social channels:", err);
        setLoading(false);
      });
  }, []);

  const homeChannels = channels
    .filter((ch: any) => ch.showOnHome !== false && ch.enabled !== false && ch.status !== "DELETED")
    .sort((a, b) => (a.homepagePosition || 0) - (b.homepagePosition || 0))
    .slice(0, 4);

  const defaultPlatforms = [
    { displayName: "YouTube", url: "https://youtube.com", platform: "YOUTUBE" },
    { displayName: "Facebook", url: "https://facebook.com", platform: "FACEBOOK" },
    { displayName: "Instagram", url: "https://instagram.com", platform: "INSTAGRAM" },
    { displayName: "Twitter / X", url: "https://twitter.com", platform: "TWITTER" }
  ];

  const displayPlatforms = homeChannels.length > 0 ? homeChannels : defaultPlatforms;

  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-xl font-black uppercase tracking-tighter text-blue-900 flex items-center gap-3">
          <PlayCircle size={24} className="text-blue-600" /> Social Media Hub
        </h2>
        <Link to="/social-hub" className="text-xs font-black uppercase tracking-widest text-blue-600 hover:underline">
          View All Networks &rarr;
        </Link>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center items-center">
          <Activity className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayPlatforms.map((s: any, i: number) => (
            <div key={s.channelId || i} className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <HomeIcon name={s.displayName || s.name} size={18} />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                      {s.displayName || s.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest px-2 py-0.5 bg-blue-50 rounded">
                    {s.platform || "Official"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate mb-6">{s.url}</p>
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                <span>Connect</span>
                <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
