import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { userManagement, banUser, unbanUser, getReports, deleteUser } from "../api";

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

export const useGetReports = (params) => {
    return useQuery({
        queryKey: ["reports", params],
        queryFn: () => getReports(params),
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userManagement"] });
        },
    });
};