



export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^[0-9]{7,16}$/;
export const passwordRegex =/^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&^#()_+=\-{}[\]:;"'<>,.?/\\|`~])[^\s]{8,}$/;
// Only 4‑digit numeric OTP

export const otpRegex = /^[0-9]{4}$/;

export const Validators = {


  required: (value: string) => {
    if (!value || value.trim() === "") {
      return "This field is required";
    }
    return "";
  },

  emailOrPhone: (value: string) => {
    if (!value || value.trim() === "") {
      return "Email or phone is required";
    }
    const trimmed = value.trim();
    const isEmail = emailRegex.test(trimmed);
    const isPhone = phoneRegex.test(trimmed);
    if (!isEmail && !isPhone) {
      return "Enter a valid email or phone number";
    }
    return "";
  },

  email: (value: string) => {
    if (!value || value.trim() === "") {
      return "Email is required";
    }
    if (!emailRegex.test(value.trim())) {
      return "Enter a valid email";
    }
    return "";
  },

  passwordSignup: (value: string) => {
    if (!value || value.trim() === "") {
      return "Password is required";
    }
    if (!passwordRegex.test(value)) {
      return "Password must be 8+ chars, include uppercase, lowercase, number & special character";
    }
    return "";
  },

  passwordSignin: (value: string) => {
    if (!value || value.trim() === "") {
      return "Password is required";
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }
    return "";
  },

  otp: (value: string) => {
    if (!value) {
      return "OTP is required";
    }
    if (!otpRegex.test(value)) {
      return "OTP must be 4 digits";
    }
    return "";
  },
};

export const validateSignup = (data: any) => {
  const gender = data.gender?.trim() || "";
  const emailOrPhone = data.emailOrPhone?.trim() || "";
  const password = data.password || "";

  if (!gender || !["male", "female", "other"].includes(gender as any)) {
    return { error: "Please select your gender" };
  }

  if (!emailOrPhone) {
    return { error: "Please enter email address" };
  }

  const isEmail = emailRegex.test(emailOrPhone);
  const isPhone = phoneRegex.test(emailOrPhone);

  if (!isEmail && !isPhone) {
    return { error: "Please enter valid email address" };
  }

  if (!password) {
    return { error: "Please enter password" };
  }

  if (!passwordRegex.test(password)) {
    return {
      error:
        "Password must be at least 8 characters long with uppercase, lowercase, number, special character, and no spaces",
    };
  }

  return {
    error: "",
    type: isEmail ? "email" : "phone",
    formattedData: {
      gender,
      password,
      ...(isEmail ? { email: emailOrPhone } : { phone: emailOrPhone }),
    },
  };
};

export const validateForgotPassword = (data: any) => {
  const email = data?.email?.trim() || "";

  console.log("the email is coming : " , email)
  if (!email) {
    return { error: "Please enter email address" };
  }

  if (email && !emailRegex.test(email)) {
    return { error: "Please enter valid email address" };
  }

  return {
    error: "",
    formattedData: { email },
  };
};

export const validateSignin = (data: any) => {

  const email = data.email?.trim() || "";
  const password = data.password || "";

  if(!email && !password){
    return {error : "Please enter email address"}
  }

  if (email && !emailRegex.test(email)) {
    return { error: "Please enter valid email address" };
  }

  if(email && !password){
    return {error : "Please enter password"}
  }

  if(!email && password){
    return {error : "Please enter email address"}
  } 

  return {
    error: "",
    formattedData: { email, password },
  };
};

export const validateCompleteProfile = (data: any) => {
  const displayName = data.displayName?.trim() || "";
  const interests = Array.isArray(data.interests) ? data.interests : [];
  const profilePicture = data.profilePicture || "";
  const age = data.age?.trim() || "";
  const location = data.location?.trim() || "";
  const language = data.language?.trim() || "";

  if (!profilePicture) {
    return { error: "Please upload profile picture" };
  }

  if (!displayName) {
    return { error: "Please enter display name" };
  }

  if (displayName.length < 3 || displayName.length > 8) {
    return {
      error: "Display name must be at least 3 characters and atmost 8 characters",
    };
  }

  if (!age) {
    return { error: "Please enter your age" };
  }

  const numericAge = Number(age);
  if (isNaN(numericAge) || numericAge > 99 || numericAge < 12) {
    return { error: "Please enter valid age between 12 to 99" };
  }

  if (!location) {
    return { error: "Please enter location" };
  }

  if (!language) {
    return { error: "Please select language" };
  }

  if (!interests.length) {
    return { error: "Please choose at least one interest" };
  }

  return {
    error: "",
    formattedData: {
      displayName,
      interests,
      profilePicture,
      age,
      location,
      language,
    },
  };
};

export const validateEditProfile = (data: any) => {
  const displayName = data.displayName?.trim() || "";
  const interests = Array.isArray(data.interests) ? data.interests : [];
  const age = data.age?.trim() || "";
  const location = data.location?.trim() || "";
  const language = data.language?.trim() || "";

  if (!displayName) {
    return { error: "Please enter display name" };
  }

  if (displayName.length < 3 || displayName.length > 8) {
    return {
      error: "Display name must be at least 3 characters and atmost 8 characters",
    };
  }

  if (!age) {
    return { error: "Please enter your age" };
  }

  const numericAge = Number(age);
  if (isNaN(numericAge) || numericAge > 99 || numericAge < 12) {
    return { error: "Please enter valid age between 12 to 99" };
  }

  if (!location) {
    return { error: "Please enter location" };
  }

  if (!language) {
    return { error: "Please select language" };
  }

  if (!interests.length) {
    return { error: "Please choose at least one interest" };
  }

  return {
    error: "",
    formattedData: { displayName, interests, age, location, language },
  };
};

export const validateOTP = (otp: string[]) => {
  const otpStr = otp.filter((d) => d).join("");

  if (otp.some((d) => !/^[0-9]?$/.test(d))) {
    return "OTP must contain only digits";
  }

  if (otpStr.length !== 4) {
    return "OTP must be 4 digits";
  }

  return "";
};

export const validateResetPassword = (data: any) => {
  const password = data.password || "";
  const confirmPassword = data.confirmPassword || "";

  if (!password) {
    return { error: "Please enter new password" };
  }

  // Reuse your existing passwordRegex
  if (!passwordRegex.test(password)) {
    return {
      error: "New password must be at least 8 characters long with uppercase, lowercase, number, special character, and no spaces.",
    };
  }

  if (!confirmPassword) {
    return { error: "Please enter confirm new password" };
  }

  if (password !== confirmPassword) {
    return { error: "New password and confirm new password does not match" };
  }

  return {
    error: "",
    formattedData: { password },
  };
};