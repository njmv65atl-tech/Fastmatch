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

// Coupons Hooks
export const useCoupons = (params) => {
  return useQuery({
    queryKey: ["coupons", params],
    queryFn: () => api.getCoupons(params),
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createCoupon(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success(res?.message || "Coupon created successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create coupon");
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteCoupon(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success(res?.message || "Coupon deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete coupon");
    },
  });
};

// Dynamic Pricing Hooks
export const usePricing = () => {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: () => api.getPricing(),
  });
};

export const useUpdatePricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.updatePricing(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
      toast.success(res?.message || "Pricing updated successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update pricing");
    },
  });
};
