/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AboutLeaderSectionData } from "@/src/types/homeCms";

interface AboutLeaderProps {
  content?: any;
  data?: AboutLeaderSectionData;
}

export default function AboutLeader({ content, data: propData }: AboutLeaderProps) {
  const { t, i18n } = useTranslation();
  const isTelugu = i18n.language === "te";

  const aboutData: AboutLeaderSectionData =
    propData || (content?.bullets ? content : content?.data) || {};

  const title =
    isTelugu && aboutData.titleTe ? aboutData.titleTe : aboutData.title || t("leader.title");
  const imageUrl =
    aboutData.imageUrl ||
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800";
  const imageAlt = aboutData.imageAlt || "Chintada Ravi Kumar MLA";
  const ctaText = aboutData.ctaText || t("leader.cta");
  const ctaLink = aboutData.ctaLink || "/about";

  const defaultBullets = [
    { key: "academic", label: t("leader.academic"), labelTe: "విద్యా నైపుణ్యం" },
    { key: "grassroots", label: t("leader.grassroots"), labelTe: "అట్టడుగు స్థాయి సంబంధం" },
    { key: "social", label: t("leader.social"), labelTe: "సామాజిక మార్పు" },
    { key: "party", label: t("leader.party"), labelTe: "పార్టీ విజనరీ" },
    { key: "constituency", label: t("leader.constituency"), labelTe: "నియోజకవర్గ దృష్టి" },
    { key: "committed", label: t("leader.committed"), labelTe: "కట్టుబడి ఉన్న నాయకత్వం" }
  ];

  const bullets =
    aboutData.bullets && aboutData.bullets.length > 0 ? aboutData.bullets : defaultBullets;

  return (
    <section className="py-12 bg-white border-b border-slate-50">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}>
          <div className="relative group max-w-sm mx-auto lg:mx-0">
            <div className="absolute -inset-2 bg-blue-50 rounded-[2rem] -z-10 group-hover:scale-105 transition-transform" />
            <img
              src={imageUrl}
              className="w-full h-[400px] object-cover rounded-[1.8rem] shadow-xl border-2 border-white grayscale hover:grayscale-0 transition-all duration-700"
              alt={imageAlt}
            />
          </div>
        </motion.div>

        <div className="space-y-6">
          <h2 className="text-lg font-black uppercase tracking-widest text-blue-900 flex items-center gap-3">
            <Users size={20} className="text-blue-600" /> {title}
          </h2>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {bullets.map((item, i) => {
              const displayLabel = isTelugu && item.labelTe ? item.labelTe : item.label;
              return (
                <li
                  key={item.key || i}
                  className="flex items-center gap-3 py-2 border-b border-slate-50 group"
                >
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full group-hover:scale-150 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-blue-900 transition-colors">
                    {displayLabel}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="pt-4">
            <Link
              to={ctaLink}
              className="inline-block px-8 py-3 bg-blue-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-800 transition-all shadow-lg active:scale-95"
            >
              {ctaText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
