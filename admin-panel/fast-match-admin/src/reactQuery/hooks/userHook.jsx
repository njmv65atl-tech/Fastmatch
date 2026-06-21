import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { userManagement, banUser, unbanUser } from "../api";

export const useUserManagement = (params) => {
    return useQuery({
        queryKey: ["userManagement", params],
        queryFn: () => userManagement(params),
    });
};

export const useBanUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: banUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userManagement"] });
        },
    });
};

export const useUnbanUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: unbanUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userManagement"] });
        },
    });
};