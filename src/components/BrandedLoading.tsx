/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface BrandedLoadingProps {
  message?: string;
  minHeight?: string;
  isFirstVisit?: boolean;
}

export default function BrandedLoading({
  message = "Namaste — Mee Chintada Ravi Kumar",
  minHeight = "py-12"
}: BrandedLoadingProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 ${minHeight} px-4 select-none`}
    >
      {/* Animated 3-Blade Fan SVG */}
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Rotating Blades Group */}
          <motion.g
            animate={shouldReduceMotion ? { rotate: 0 } : { rotate: 360 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { repeat: Infinity, duration: 1.8, ease: "linear" }
            }
            style={{ originX: "50px", originY: "50px" }}
          >
            {/* Blade 1 */}
            <path
              d="M50 45 L50 15 C60 10, 85 25, 85 30 L50 45 Z"
              className="fill-[#555B65]"
              strokeWidth="1"
            />
            {/* Blade 2 */}
            <g transform="rotate(120 50 50)">
              <path
                d="M50 45 L50 15 C60 10, 85 25, 85 30 L50 45 Z"
                className="fill-[#555B65]"
                strokeWidth="1"
              />
            </g>
            {/* Blade 3 */}
            <g transform="rotate(240 50 50)">
              <path
                d="M50 45 L50 15 C60 10, 85 25, 85 30 L50 45 Z"
                className="fill-[#555B65]"
                strokeWidth="1"
              />
            </g>
          </motion.g>

          {/* Stationary Hub/Motor */}
          <circle cx="50" cy="50" r="8" className="fill-[#333842]" />
          <circle cx="50" cy="50" r="3" className="fill-[#555B65]" />
        </svg>
      </div>

      {/* Branded Greeting */}
      <h2 className="text-sm sm:text-base font-medium tracking-[0.02em] text-[#555B65] whitespace-nowrap">
        {message}
      </h2>
    </div>
  );
}
