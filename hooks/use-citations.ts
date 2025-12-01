"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type CitationFilters = {
  topicId?: string;
  brandId?: string;
  engine?: string;
};

export function useCitations(filters: CitationFilters) {
  return useQuery({
    queryKey: ["citations", filters],
    queryFn: () =>
      api.getCitations({
        topicId: filters.topicId,
        brandId: filters.brandId,
        engine: filters.engine,
      }),
  });
}



