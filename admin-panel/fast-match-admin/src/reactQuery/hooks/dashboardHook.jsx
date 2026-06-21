import { useQuery } from "@tanstack/react-query";

import { dashboardStats } from "../api";

export const useDashboardStats = () => {
    return useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: () => dashboardStats(),
    });
};
