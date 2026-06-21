import { useMutation } from "@tanstack/react-query";
import { login, logout, forgotPassword, verifyOtp, resetPassword } from "../api";

export const useLogin = () => {
    return useMutation({
        mutationFn: (data) => login(data),
    });
};

export const useLogout = () => {
    return useMutation({
        mutationFn: () => logout(),
    });
};

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (data) => forgotPassword(data),
    });
};

export const useVerifyOtp = () => {
    return useMutation({
        mutationFn: (data) => verifyOtp(data),
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: (data) => resetPassword(data),
    });
};