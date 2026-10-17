/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DevelopmentProjectsSectionData,
  DevelopmentProjectItem,
  WorkflowStep
} from "@/src/types/homeCms";
import HomeIcon from "./HomeIcon";

interface ConstituencyDevelopmentProps {
  content?: any;
  data?: DevelopmentProjectsSectionData;
}

export default function ConstituencyDevelopment({
  content,
  data: propData
}: ConstituencyDevelopmentProps) {
  const devData: DevelopmentProjectsSectionData =
    propData || (content?.projects ? content : content?.data) || {};

  const title = devData.title || "District Transformation";
  const viewAllText = devData.viewAllText || "View All Projects";
  const viewAllLink = devData.viewAllLink || "/development";

  const defaultSteps: WorkflowStep[] = [
    { label: "Identify", icon: "Search" },
    { label: "Plan", icon: "FileText" },
    { label: "Execute", icon: "Zap" },
    { label: "Monitor", icon: "Activity" }
  ];

  const defaultProjects: DevelopmentProjectItem[] = [
    { id: "p1", name: "Roads", category: "Infrastructure", progress: 75, color: "bg-green-500", imageSeed: "road" },
    { id: "p2", name: "Water", category: "Public Utilities", progress: 60, color: "bg-blue-500", imageSeed: "water" },
    { id: "p3", name: "Schools", category: "Education", progress: 80, color: "bg-amber-500", imageSeed: "school" },
    { id: "p4", name: "Hospitals", category: "Healthcare", progress: 70, color: "bg-red-500", imageSeed: "hospital" },
    { id: "p5", name: "Employment", category: "Livelihood", progress: 65, color: "bg-purple-500", imageSeed: "work" }
  ];

  const steps = devData.workflowSteps && devData.workflowSteps.length > 0 ? devData.workflowSteps : defaultSteps;
  const projects = devData.projects && devData.projects.length > 0 ? devData.projects : defaultProjects;

  return (
    <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] shadow-xl border border-slate-100">
      {/* Workflow */}
      <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-12 mb-10 sm:mb-16 px-2 sm:px-12">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-3 sm:gap-4 text-center min-w-[70px]">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 text-green-600 flex items-center justify-center shadow-inner">
                <HomeIcon name={s.icon} size={24} />
              </div>
              <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-800">
                {s.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="text-slate-200 hidden sm:block" size={32} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
        {projects.map((p, i) => {
          const imgUrl = `https://picsum.photos/seed/${p.imageSeed || p.name}/400/225`;
          return (
            <div key={p.id || i} className="group">
              <div className="aspect-video bg-slate-100 rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 relative">
                <img
                  src={imgUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-slate-800">
                  {p.name}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                  {p.progress}%
                </span>
              </div>
              <div className="w-full h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${p.progress}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className={`h-full ${p.color || "bg-blue-600"}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 sm:mt-12 flex justify-center">
        <Link
          to={viewAllLink}
          className="px-10 py-3 sm:px-12 sm:py-4 bg-blue-900/5 hover:bg-blue-900/10 text-blue-900 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-xl sm:rounded-2xl border-2 border-blue-900/10 transition-all inline-block"
        >
          {viewAllText}
        </Link>
      </div>
    </div>
  );
}
