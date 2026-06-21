import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as api from "../api";

export const useSubscribers = (params) => {
  return useQuery({
    queryKey: ["subscribers", params],
    queryFn: () => api.getSubscribers(params),
  });
};

export const useGrantPremium = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.grantPremium(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(res.message || "Premium granted successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to grant premium");
    },
  });
};

export const useRevokePremium = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => api.revokePremium(userId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(res.message || "Premium revoked successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to revoke premium");
    },
  });
};
