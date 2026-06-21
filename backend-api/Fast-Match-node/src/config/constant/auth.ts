const auth = {
    noAuth: 'Authorization token required.',
    notAuthorized: 'You are not authorised to perform this task',
    tokenExpire: 'Token Expired',
    noAccount: 'No account registered with this username',
    ownAccountBlock: 'Your account has been blocked by admin',
    ownAccountDelete: 'Your account has been deleted by admin',
    loggedInAnotherDevice: 'Your account has been logged into on another device.',
    phoneAlreadyExist: 'This phone number already exist.',
    phoneNotExist: 'This phone number not exist.',
    invalidOtp: "Invalid Otp, please try again.",
    emailAlreadyExist: "This email address has already exist.",
    invalidEmailOrPass: 'Please enter valid email or password.',
    resendOtp: 'Otp resent successfully.',
    pseudoAlreadyExist: 'This pseudo already exist.',
    emailNotExist: "This email address not exist in DB.",
    // accountNotVerified: 'Please enter valid email.',

    phoneEmailAlExist: (isEmail: boolean) => `This ${isEmail ? 'email address' : 'phone number'} already exist.`,
    validEmailNPhone: (isEmail: boolean) => `Please enter valid ${isEmail ? 'email address' : 'phone number'} or password.`,
}

export default { auth }