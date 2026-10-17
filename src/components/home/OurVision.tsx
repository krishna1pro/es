/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { OurVisionSectionData, VisionItem } from "@/src/types/homeCms";
import HomeIcon from "./HomeIcon";

interface OurVisionProps {
  content?: any;
  data?: OurVisionSectionData;
}

export default function OurVision({ content, data: propData }: OurVisionProps) {
  const { t, i18n } = useTranslation();
  const isTelugu = i18n.language === "te";

  const visionData: OurVisionSectionData =
    propData || (content?.visions ? content : content?.data) || {};

  const title = visionData.title || t("sections.vision") || "Our Vision";
  const manifestoCtaText = visionData.manifestoCtaText || "View Full Manifesto";
  const manifestoCtaLink = visionData.manifestoCtaLink || "/vision";

  const defaultVisions: VisionItem[] = [
    { id: "v1", title: "Education For All", titleTe: "అందరికీ విద్య", icon: "GraduationCap", color: "text-blue-600", bg: "bg-blue-50" },
    { id: "v2", title: "Agriculture & Farmers", titleTe: "వ్యవసాయం & రైతులు", icon: "Sprout", color: "text-green-600", bg: "bg-green-50" },
    { id: "v3", title: "Youth Employment", titleTe: "యువత ఉపాధి", icon: "Briefcase", color: "text-amber-600", bg: "bg-amber-50" },
    { id: "v4", title: "Women Empowerment", titleTe: "మహిళా సాధికారత", icon: "Venus", color: "text-pink-600", bg: "bg-pink-50" },
    { id: "v5", title: "Healthcare For All", titleTe: "అందరికీ ఆరోగ్యం", icon: "Heart", color: "text-red-600", bg: "bg-red-50" },
    { id: "v6", title: "Infrastructure Dev", titleTe: "మౌలిక సదుపాయాలు", icon: "Zap", color: "text-indigo-600", bg: "bg-indigo-50" },
    { id: "v7", title: "Clean Water For All", titleTe: "పరిశుభ్రమైన తాగునీరు", icon: "Waves", color: "text-cyan-600", bg: "bg-cyan-50" },
    { id: "v8", title: "Transparent Governance", titleTe: "పారదర్శక పాలన", icon: "ShieldCheck", color: "text-slate-800", bg: "bg-slate-100" }
  ];

  const visionsList =
    visionData.visions && visionData.visions.length > 0 ? visionData.visions : defaultVisions;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-50 pb-3">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 gap-2 sm:gap-3 flex-grow">
        {visionsList.map((v, i) => {
          const displayTitle = isTelugu && v.titleTe ? v.titleTe : v.title;
          return (
            <motion.div
              key={v.id || i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-xl bg-slate-50/50 border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-sm transition-all group"
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${v.bg || "bg-blue-50"} ${
                  v.color || "text-blue-600"
                } flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shrink-0 shadow-sm`}
              >
                <HomeIcon name={v.icon} size={26} />
              </div>
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-900 leading-tight">
                {displayTitle}
              </p>
            </motion.div>
          );
        })}
      </div>
      <Link
        to={manifestoCtaLink}
        className="block text-center w-full mt-6 py-2.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-blue-800 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all"
      >
        {manifestoCtaText}
      </Link>
    </div>
  );
}
