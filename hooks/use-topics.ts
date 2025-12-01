"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTopics() {
  return useQuery({
    queryKey: ["topics"],
    queryFn: () => api.getTopics(),
  });
}



