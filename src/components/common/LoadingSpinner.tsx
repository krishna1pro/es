import React from "react";
import { motion } from "motion/react";

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="w-16 h-16 relative"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="5" fill="#475569" />
          <path d="M50 50 L85 30 A40 40 0 0 0 50 10 Z" fill="#475569" />
          <path d="M50 50 L15 70 A40 40 0 0 0 50 90 Z" fill="#475569" />
          <path d="M50 50 L85 70 A40 40 0 0 0 50 50 Z" fill="#475569" />
        </svg>
      </motion.div>
      <p className="mt-6 text-sm text-slate-500 font-medium">
        Namaste — Mee Chintada Ravi Kumar
      </p>
    </div>
  );
};
