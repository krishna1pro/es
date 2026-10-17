/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { StatsSectionData, StatItem } from "@/src/types/homeCms";
import HomeIcon from "./HomeIcon";

interface MLAStatsProps {
  content?: any;
  data?: StatsSectionData;
}

export default function MLAStats({ content, data: propData }: MLAStatsProps) {
  const { t, i18n } = useTranslation();
  const isTelugu = i18n.language === "te";

  const statsData: StatsSectionData =
    propData || (content?.stats ? content : content?.data) || {};

  const defaultStats: StatItem[] = [
    { id: "s1", label: t("stats.villages"), labelTe: "సందర్శించిన గ్రామాలు", value: "500+", icon: "MapPin", color: "text-green-600", bg: "bg-green-50" },
    { id: "s2", label: t("stats.meetings"), labelTe: "బహిరంగ సభలు", value: "1000+", icon: "Users", color: "text-blue-600", bg: "bg-blue-50" },
    { id: "s3", label: t("stats.resolved"), labelTe: "పరిష్కరించబడిన సమస్యలు", value: "2000+", icon: "CheckCircle", color: "text-amber-600", bg: "bg-amber-50" },
    { id: "s4", label: t("stats.volunteers"), labelTe: "క్రియాశీల వాలంటీర్లు", value: "15K+", icon: "Heart", color: "text-purple-600", bg: "bg-purple-50" },
    { id: "s5", label: t("stats.benefited"), labelTe: "ప్రజలు ప్రయోజనం పొందారు", value: "3L+", icon: "Heart", color: "text-red-500", bg: "bg-red-50" },
    { id: "s6", label: t("stats.followers"), labelTe: "సోషల్ మీడియా ఫాలోవర్స్", value: "1M+", icon: "ThumbsUp", color: "text-blue-500", bg: "bg-blue-50" }
  ];

  const statsList = statsData.stats && statsData.stats.length > 0 ? statsData.stats : defaultStats;

  return (
    <section className="py-2 pb-10 bg-white border-b border-slate-50">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
        <div className="flex overflow-x-auto pb-6 sm:pb-0 sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-6 scrollbar-hide pt-4">
          {statsList.map((stat, i) => {
            const displayLabel = isTelugu && stat.labelTe ? stat.labelTe : stat.label;
            return (
              <motion.div
                key={stat.id || i}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="min-w-[130px] sm:min-w-0 flex flex-col items-center text-center p-5 sm:p-8 bg-white border border-slate-100 rounded-3xl sm:rounded-[2rem] shadow-sm hover:shadow-xl hover:border-slate-200 transition-all group"
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${stat.bg || "bg-blue-50"} ${
                    stat.color || "text-blue-600"
                  } flex items-center justify-center mb-4 sm:mb-6 shadow-sm`}
                >
                  <HomeIcon name={stat.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter mb-1 sm:mb-2">
                  {stat.value}
                </p>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  {displayLabel}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
