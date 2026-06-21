import { useQuery } from "@tanstack/react-query";

import { analytics } from "../api";

export const useAnalytics = () => {
    return useQuery({
        queryKey: ["analytics"],
        queryFn: () => analytics(),
    });
};