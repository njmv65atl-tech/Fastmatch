import * as yup from 'yup';

export const loginSchema = yup.object({
    body: yup.object({
        email: yup.string().email('Email must be a valid email address').required('Email is required'),
        password: yup.string().required('Password is required')
    })
});

export const forgotPasswordSchema = yup.object({
    body: yup.object({
        email: yup.string().email('Email must be a valid email address').required('Email is required')
    })
});

export const verifyOtpSchema = yup.object({
    body: yup.object({
        email: yup.string().email('Email must be a valid email address').required('Email is required'),
        otp: yup.number().required('OTP is required')
    })
});

export const resetPasswordSchema = yup.object({
    body: yup.object({
        password: yup.string().min(8, 'Password must be at least 8 characters long').required('Password is required')
    })
});
