"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type CitationShareFilters = {
  topicId?: string;
  brandId?: string;
};

export function useCitationShare(filters: CitationShareFilters) {
  return useQuery({
    queryKey: ["citation-share", filters],
    queryFn: () =>
      api.getCitationShare({
        topicId: filters.topicId,
        brandId: filters.brandId,
      }),
  });
}



