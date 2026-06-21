import axios from "axios";

export const serverURL = import.meta.env.VITE_API_SERVER;
const baseURL = `${serverURL}/api/v1/`;
export const imageUrl = serverURL;


export const APIKit = axios.create({
  baseURL,
  timeout: 600000,
  referrerPolicy: 'strict-origin-when-cross-origin',
});

APIKit.interceptors.request.use(async (config) => {
  const tokenFromStorage = localStorage.getItem("token");
  let token = tokenFromStorage;

  // Fallback: Check if token is inside the user object
  if (!token) {
    const userData = localStorage.getItem("wf_user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        token = user.token || user.accessToken;
      } catch (e) {
        // console.error("DEBUG: Error parsing user data for token", e);
      }
    }
  }

//   console.log("DEBUG: Final token derived for request:", token);

  const apiKey = import.meta.env.VITE_X_API_KEY;
  if (apiKey) {
    config.headers["x-api-key"] = apiKey;
  }

  if (token) {
    const bearerToken = `Bearer ${token}`;
    // Using set() if available (Axios 1.0+), or direct property assignment
    if (config.headers.set) {
      config.headers.set("Authorization", bearerToken);
      config.headers.set("x-access-token", bearerToken);
    } else {
      config.headers.Authorization = bearerToken;
      config.headers["x-access-token"] = bearerToken;
    }
  } else {
    // console.warn("DEBUG: No token found in any storage.");
  }
  
  // Create a plain object representation for logging
  const plainHeaders = config.headers.toJSON ? config.headers.toJSON() : config.headers;
//   console.log("DEBUG: Final request headers before sending:", JSON.stringify(plainHeaders));
  
  return config;
});

APIKit.interceptors.response.use(
  (response) => {
  
    return response;
  },
  (error) => {
    console.error("Axios Error Response:", {
      status: error.response?.status,
      data: JSON.stringify(error.response?.data),
      message: error.message,
      config: error.config
    });
    return Promise.reject(error);
  }
);
