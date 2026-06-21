import { useQuery } from "@tanstack/react-query";
import {    activitySessions, activityLogs } from "../api";

export const useActivitySessions = (params = {}) => {
  return useQuery({
    queryKey: ["activitySessions", params],
    queryFn: () => activitySessions(params),
  });
};


export const useActivityLogs = (params = {}) => {
  return useQuery({
    queryKey: ["activityLogs", params],
    queryFn: () => activityLogs(params),
  });
};
