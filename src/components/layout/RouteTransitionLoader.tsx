/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import BrandedLoading from "@/src/components/BrandedLoading";

/**
 * Hook to manage route transitions with a mandatory 5-second loading minimum.
 */
export function useRouteTransitionLoading() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return loading;
}

export const RouteTransitionLoader = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50">
    <BrandedLoading minHeight="py-0" />
  </div>
);
