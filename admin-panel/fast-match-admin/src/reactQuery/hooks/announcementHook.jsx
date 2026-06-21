import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as api from "../api";

export const useAnnouncements = (params) => {
  return useQuery({
    queryKey: ["announcements", params],
    queryFn: () => api.getAnnouncements(params),
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.createAnnouncement(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success(res.message || "Announcement created successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create announcement");
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteAnnouncement(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success(res.message || "Announcement deleted successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete announcement");
    },
  });
};
