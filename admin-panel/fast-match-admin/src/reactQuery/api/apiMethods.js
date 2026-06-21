import { toast } from "react-toastify";
import { APIKit } from "./apiClient";
const handleAPIError = (error) => {
  if (error.response?.status === 403 || error.response?.status === 401) {
    // localStorage.clear();
    // toast.error(error.response.data.message);
    // window.location.href = "/login";
    throw {
      message: error.response?.data?.message || "Unauthorized access.",
      status: error.response?.status
    };
  }

  throw {
    message: error.response?.data?.message,
  };
};

export const apiMethods = {
  GET: async (url, params, headers) => {
    if (!navigator.onLine) {
      toast.error("Please check your internet connection.");
    }
    try {
      const response = await APIKit.get(url, { params, headers });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },

  POST: async (url, data, headers) => {
    // console.log("Navigator Online:", navigator.onLine);
    if (!navigator.onLine) {
      throw { message: "Please check your internet connection." };
    }
    try {
    //   console.log("POST Request:", url, data);
      const response = await APIKit.post(url, data, { headers });
    //   console.log("POST Response:", response.data);
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },
  PATCH: async (url, data, headers) => {
    if (!navigator.onLine) {
      throw { message: "Please check your internet connection." };
    }
    try {
      const response = await APIKit.patch(url, data, { headers });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },
  DELETE: async (url, data, headers) => {
    if (!navigator.onLine) {
      throw { message: "Please check your internet connection." };
    }
    try {
      // Axios DELETE expects config.data for body
      const response = await APIKit.delete(url, { data, headers });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },
  PUT: async (url, data, headers) => {
    if (!navigator.onLine) {
      throw { message: "Please check your internet connection." };
    }
    try {
      const response = await APIKit.put(url, data, { headers });
      return response.data;
    } catch (error) {
      return handleAPIError(error);
    }
  },
};
