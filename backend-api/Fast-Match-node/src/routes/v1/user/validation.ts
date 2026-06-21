import * as yup from 'yup';

export const signUp = yup.object({
    body: yup.object({
        fullName: yup.string().optional(),
        email: yup.string().email('Please enter a valid email address').nullable(),
        phone: yup.string().nullable(),
        password: yup.string().min(6).required(),
        deviceId: yup.string().optional(),
        deviceName: yup.string().optional(),
        platform: yup.string().oneOf(['android', 'ios', 'web']).optional(),
        gender: yup.string().oneOf(['male', 'female', 'other']).optional(),
    }).test('email-or-phone', 'Email or phone is required', function (value) {
        return !!(value.email || value.phone);
    })
})

export const verifyOtpSignUp = yup.object({
    body: yup.object({
        email: yup.string().email('Please enter a valid email address').nullable(),
        phone: yup.string().nullable(),
        otp: yup.number().required(),
        deviceId: yup.string().optional(),
        deviceName: yup.string().optional(),
        platform: yup.string().oneOf(['android', 'ios']).optional(),
    }).test('email-or-phone', 'Email or phone is required', function (value) {
        return !!(value.email || value.phone);
    })
})

export const resendOtp = yup.object({
    body: yup.object({
        email: yup.string().email('Please enter a valid email address').nullable(),
        phone: yup.string().nullable(),
    }).test('email-or-phone', 'Email or phone is required', function (value) {
        return !!(value.email || value.phone);
    })
})

export const signIn = yup.object({
    body: yup.object({
        email: yup.string().email('Please enter a valid email address').nullable(),
        phone: yup.string().nullable(),
        password: yup.string().required(),
        deviceId: yup.string().optional(),
        deviceName: yup.string().optional(),
        platform: yup.string().oneOf(['android', 'ios']).optional(),
        fcmToken: yup.string().optional(),
    }).test('email-or-phone', 'Email or phone is required', function (value) {
        return !!(value.email || value.phone);
    })
})

export const completeProfile = yup.object({
    body: yup.object({
        displayName: yup.string().optional(),
        age: yup.string().optional(),
        location: yup.string().optional(),
        interests: yup.mixed().optional(),
        deviceId: yup.string().optional(),
        deviceName: yup.string().optional(),
        platform: yup.string().oneOf(['android', 'ios']).optional(),
        language: yup.string().optional(),
        fcmToken: yup.string().optional(),
        deviceToken: yup.string().optional(),
        isUpdate: yup.boolean().optional(),
        gender: yup.string().oneOf(['male', 'female', 'other']).optional(),
        preference: yup.string().oneOf(['everyone', 'male', 'female']).optional(),
    })
})

export const forgotPasswordValidation = yup.object({
    body: yup.object({
        email: yup.string().email('Please enter a valid email address').required()
    })
})

export const changePasswordValidation = yup.object({
    body: yup.object({
        oldPassword: yup.string().required(),
        newPassword: yup.string().required()
    })
})

export const resetPasswordValidation = yup.object({
    body: yup.object({
        newPassword: yup.string().required(),
    })
})

export const verifyOtpValidation = yup.object({
    body: yup.object({
        email: yup.string().required(),
        otp: yup.number().required()
    })
})