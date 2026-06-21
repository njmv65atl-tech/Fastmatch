import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as api from "../api";

export const useIcebreakers = (params) => {
  return useQuery({
    queryKey: ["icebreakers", params],
    queryFn: () => api.getIcebreakers(params),
  });
};

export const useCreateIcebreaker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createIcebreaker(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["icebreakers"] });
      toast.success(res.message || "Icebreaker created successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create icebreaker");
    },
  });
};

export const useUpdateIcebreaker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateIcebreaker(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["icebreakers"] });
      toast.success(res.message || "Icebreaker updated successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update icebreaker");
    },
  });
};

export const useDeleteIcebreaker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteIcebreaker(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["icebreakers"] });
      toast.success(res.message || "Icebreaker deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete icebreaker");
    },
  });
};
