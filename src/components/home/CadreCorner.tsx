/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import {
  CadreCornerSectionData,
  PeoplesVoiceSectionData,
  CadreWingItem,
  VoiceServiceItem
} from "@/src/types/homeCms";
import HomeIcon from "./HomeIcon";

export function CadreCorner({
  content,
  data: propData
}: {
  content?: any;
  data?: CadreCornerSectionData;
}) {
  const cadreData: CadreCornerSectionData =
    propData || (content?.wings ? content : content?.data) || {};

  const title = cadreData.title || "Cadre Corner";
  const defaultWings: CadreWingItem[] = [
    { id: "w1", label: "Youth Wing", icon: "Users", color: "text-orange-600" },
    { id: "w2", label: "Women Wing", icon: "Venus", color: "text-pink-600" },
    { id: "w3", label: "Student Wing", icon: "GraduationCap", color: "text-blue-600" },
    { id: "w4", label: "BC Wing", icon: "Briefcase", color: "text-amber-600" },
    { id: "w5", label: "SC/ST Wing", icon: "ShieldAlert", color: "text-red-600" },
    { id: "w6", label: "Minority Wing", icon: "Heart", color: "text-purple-600" },
    { id: "w7", label: "Booth Committees", icon: "Building2", color: "text-slate-800" },
    { id: "w8", label: "Mandal Teams", icon: "UserCheck", color: "text-green-600" }
  ];

  const wings = cadreData.wings && cadreData.wings.length > 0 ? cadreData.wings : defaultWings;
  const ctaText = cadreData.ctaText || "Join the Cadre";
  const ctaLink = cadreData.ctaLink || "/cadre-corner";

  return (
    <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-10 border-b border-slate-100 pb-4 flex items-center gap-2">
          <Users size={18} className="text-orange-600" /> {title}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {wings.map((w, i) => (
            <motion.div
              key={w.id || i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center text-center p-6 bg-slate-50 border border-transparent hover:border-orange-200 hover:bg-white hover:shadow-lg transition-all rounded-2xl group"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  w.color || "text-orange-600"
                } bg-white shadow-sm group-hover:scale-110 transition-transform`}
              >
                <HomeIcon name={w.icon} size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 leading-tight">
                {w.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mt-10 flex justify-center">
        <Link
          to={ctaLink}
          className="px-10 py-3 border-2 border-orange-100 text-[10px] font-black uppercase tracking-widest text-orange-600 rounded-xl hover:bg-orange-50 transition-all shadow-sm inline-block"
        >
          {ctaText}
        </Link>
      </div>
    </div>
  );
}

export function PeopleVoiceGrid({
  content,
  data: propData
}: {
  content?: any;
  data?: PeoplesVoiceSectionData;
}) {
  const voiceData: PeoplesVoiceSectionData =
    propData || (content?.services ? content : content?.data) || {};

  const title = voiceData.title || "People's Voice";
  const defaultServices: VoiceServiceItem[] = [
    { id: "pv1", label: "Submit Grievance", sub: "We are here to listen & help", icon: "ShieldAlert", link: "/public-voice" },
    { id: "pv2", label: "Give Suggestions", sub: "Your ideas, Our Future", icon: "Activity", link: "/public-voice" },
    { id: "pv3", label: "Success Stories", sub: "Real Stories, Real Change", icon: "UserCheck", link: "/public-voice" },
    { id: "pv4", label: "Track Your Request", sub: "Know the status of your request", icon: "Search", link: "/public-voice" }
  ];

  const services =
    voiceData.services && voiceData.services.length > 0 ? voiceData.services : defaultServices;

  return (
    <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-10 border-b border-slate-100 pb-4 flex items-center gap-2">
          <Heart size={18} className="text-purple-600" /> {title}
        </h3>
        <div className="space-y-6">
          {services.map((item, i) => (
            <Link
              key={item.id || i}
              to={item.link || "/public-voice"}
              className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-purple-200 hover:bg-white hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                <HomeIcon name={item.icon} size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-800 mb-0.5">
                  {item.label}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  {item.sub}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Link
        to="/public-voice"
        className="block text-center w-full mt-10 py-3 bg-blue-900 border-2 border-blue-900 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-lg hover:bg-blue-800 active:scale-95 transition-all"
      >
        Submit Your Request
      </Link>
    </div>
  );
}
