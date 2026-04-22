import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { QK } from "../../lib/query-keys";
import type { AnalyticsData } from "../../lib/types";

export function useWorkspaceAnalytics(workspaceId: string) {
  return useQuery({
    queryKey: QK.workspaceAnalytics(workspaceId),
    queryFn: async () => {
      const { data } = await api.get<{ analytics: AnalyticsData }>(
        `/workspaces/${workspaceId}/analytics`
      );
      return data.analytics;
    },
    staleTime: 5 * 60 * 1000,
  });
}
