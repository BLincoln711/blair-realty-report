"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCompetitors(topicId?: string) {
  return useQuery({
    queryKey: ["competitors", topicId],
    queryFn: () => api.getCompetitors(topicId),
  });
}



