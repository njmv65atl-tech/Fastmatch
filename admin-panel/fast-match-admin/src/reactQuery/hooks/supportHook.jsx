import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as api from "../api";

export const useSupportTickets = (params) => {
  return useQuery({
    queryKey: ["support-tickets", params],
    queryFn: () => api.getSupportTickets(params),
  });
};

export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.updateSupportTicket(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success(res?.message || "Ticket updated successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update ticket");
    },
  });
};
