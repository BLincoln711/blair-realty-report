"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.getAlerts(),
  });
}



