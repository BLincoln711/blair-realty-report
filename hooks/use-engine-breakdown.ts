"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useEngineBreakdown() {
  return useQuery({
    queryKey: ["engine-breakdown"],
    queryFn: () => api.getEngineBreakdown(),
  });
}



