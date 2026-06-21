import React, { useState, useRef, useEffect } from "react";
import { Eye, Camera, Loader2, User, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetProfile,
  useUpdateProfile,
  useChangePassword,
} from "../../reactQuery/hooks/profileHook";
import { imageUrl } from "../../reactQuery/api/apiClient";
import { cn } from "../../utils/utils";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";

export const Profile = () => {
  const navigate = useNavigate();
  const { data: response, isLoading } = useGetProfile();
  const admin = response?.data || {};

  if (isLoading)
    return (
      <div className="p-8 text-center text-gray-500 font-medium mt-20 flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" /> Loading profile...
      </div>
    );

  return (
    <div className="p-8 space-y-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 space-y-10 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              My Profile
            </h2>
            <p className="text-gray-500 mt-1 font-medium">
              Manage your personal information and security
            </p>
          </div>
          <button
            onClick={() => navigate("/profile/edit")}
            className="px-8 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-100 active:scale-95"
          >
            Edit Profile
          </button>
        </div>

        <div className="flex items-center gap-8 relative z-10">
          <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-purple-50 shrink-0">
            {admin.profilePicture ? (
              <img
                src={imageUrl + admin.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
                crossOrigin="*"
              />
            ) : (
              <div className="w-full h-full bg-purple-50 flex items-center justify-center">
                <User size={48} className="text-purple-200" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-gray-900">
              {admin.fullName}
            </h1>
            <p className="text-purple-600 font-bold tracking-wide uppercase text-xs">
              Administrator
            </p>
            <div className="flex items-center gap-2 text-gray-500 mt-2 text-sm font-medium">
              <Mail size={16} /> {admin.email}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-3">
            <label className="text-xs font-bold text-purple-600 uppercase tracking-widest ml-1">
              Full Name
            </label>
            <div className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl text-gray-900 font-bold text-lg">
              {admin.fullName || "Not provided"}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold text-purple-600 uppercase tracking-widest ml-1">
              Email Address
            </label>
            <div className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl text-gray-900 font-bold text-lg">
              {admin.email || "Not provided"}
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-gray-50 flex items-center justify-between relative z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Account Security
            </h3>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Keep your account secure by using a strong password
            </p>
          </div>
          <button
            onClick={() => navigate("/profile/security")}
            className="px-8 py-3 bg-white border-2 border-[#7C3AED] text-[#7C3AED] hover:bg-purple-50 font-bold rounded-xl transition-all cursor-pointer active:scale-95"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

export const EditProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: response, isLoading: isFetching } = useGetProfile();
  const updateProfileMutation = useUpdateProfile();
  const admin = response?.data || {};

  const formik = useFormik({
    initialValues: {
      fullName: admin.fullName || "",
      email: admin.email || "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      fullName: Yup.string()
        .min(3, "Name must be at least 3 characters")
        .max(30, "Name must not exceed 30 characters")
        .required("Please enter your full name"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Please enter your email address"),
    }),
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("fullName", values.fullName);
      formData.append("email", values.email);
      if (selectedFile) {
        formData.append("profilePicture", selectedFile);
      }

      updateProfileMutation.mutate(formData, {
        onSuccess: (res) => {
          if (res.success) {
            toast.success("Profile updated successfully!");
            navigate("/profile");
          } else {
            toast.error(res.message || "Failed to update profile");
          }
        },
        onError: (error) => {
          toast.error(error?.response?.data?.message || "Something went wrong");
        },
      });
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024)
        return toast.error("Image size should be less than 5MB");
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  if (isFetching)
    return (
      <div className="p-8 text-center mt-20 flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" /> Loading data...
      </div>
    );

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-2 text-sm font-bold">
        <button
          onClick={() => navigate("/profile")}
          className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
        >
          My Profile
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-[#7C3AED]">Edit Profile</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 space-y-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          Edit Profile
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-10">
          <div className="relative group">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-purple-50 group-hover:ring-purple-100 transition-all">
              <img
                src={
                  imagePreview ||
                  (admin.profilePicture
                    ? imageUrl + admin.profilePicture
                    : "https://picsum.photos/seed/roger/200/200")
                }
                alt="Profile"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 w-11 h-11 bg-[#7C3AED] rounded-full border-4 border-white flex items-center justify-center text-white hover:bg-[#6D28D9] transition-all cursor-pointer shadow-lg active:scale-90"
            >
              <Camera size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-900">Profile Photo</p>
            <p className="text-xs text-gray-400 font-medium max-w-[200px]">
              Update your profile image. PNG or JPG, max 5MB.
            </p>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-purple-600 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <input
                name="fullName"
                type="text"
                {...formik.getFieldProps("fullName")}
                maxLength={30}
                className={cn(
                  "w-full p-5 bg-gray-50 border rounded-2xl text-lg font-bold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-purple-50",
                  formik.touched.fullName && formik.errors.fullName
                    ? "border-red-300 bg-red-50"
                    : "border-gray-100 focus:border-purple-200",
                )}
                placeholder="Enter your full name"
              />
              {formik.touched.fullName && formik.errors.fullName && (
                <p className="text-xs text-red-500 font-bold ml-1">
                  {formik.errors.fullName}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                {...formik.getFieldProps("email")}
                disabled
                className={cn(
                  "w-full p-5 bg-gray-100/50 border border-gray-100 rounded-2xl text-lg font-bold transition-all outline-none cursor-not-allowed text-gray-400 opacity-75"
                )}
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-10 py-4 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-300 text-white font-black rounded-2xl transition-all cursor-pointer shadow-xl shadow-purple-100 flex items-center gap-2 active:scale-95"
            >
              {updateProfileMutation.isPending && (
                <Loader2 size={18} className="animate-spin" />
              )}
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="px-10 py-4 border-2 border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ChangePassword = () => {
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changePasswordMutation = useChangePassword();

  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required("Please enter current password"),
      newPassword: Yup.string()
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})(^\S*$)/,
          "New password must be at least 8 characters long with uppercase, lowercase, number, special character, and no spaces.",
        )
        .required("Please enter new password"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword"), null], "New password and confirm new password does not match.")
        .required("Please enter confirm new password"),
    }),
    onSubmit: (values) => {
      changePasswordMutation.mutate(
        {
          oldPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
        {
          onSuccess: (res) => {
            if (res.success) {
              toast.success("Password changed successfully!");
              navigate("/profile");
            } else {
              toast.error(res.message || "Please enter valid current password");
            }
          },
          onError: (error) => {
            toast.error(
              error?.response?.data?.message || "Please enter valid current password",
            );
          },
        },
      );
    },
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-2 text-sm font-bold">
        <button
          onClick={() => navigate("/profile")}
          className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
        >
          My Profile
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-[#7C3AED]">Change Password</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 space-y-10 relative">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          Change Password
        </h2>

        <form onSubmit={formik.handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-purple-600 uppercase tracking-widest ml-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  {...formik.getFieldProps("currentPassword")}
                  placeholder="Enter Current Password"
                  className={cn(
                    "w-full p-5 bg-gray-50 border rounded-2xl text-lg font-bold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-purple-50",
                    formik.touched.currentPassword &&
                      formik.errors.currentPassword
                      ? "border-red-300 bg-red-50"
                      : "border-gray-100 focus:border-purple-200",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors"
                >
                  <Eye
                    size={22}
                    className={showCurrent ? "text-purple-600" : ""}
                  />
                </button>
              </div>
              {formik.touched.currentPassword &&
                formik.errors.currentPassword && (
                  <p className="text-xs text-red-500 font-bold ml-1">
                    {formik.errors.currentPassword}
                  </p>
                )}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-purple-600 uppercase tracking-widest ml-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  {...formik.getFieldProps("newPassword")}
                  placeholder="Enter New Password"
                  className={cn(
                    "w-full p-5 bg-gray-50 border rounded-2xl text-lg font-bold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-purple-50",
                    formik.touched.newPassword && formik.errors.newPassword
                      ? "border-red-300 bg-red-50"
                      : "border-gray-100 focus:border-purple-200",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors"
                >
                  <Eye size={22} className={showNew ? "text-purple-600" : ""} />
                </button>
              </div>
              {formik.touched.newPassword && formik.errors.newPassword && (
                <p className="text-xs text-red-500 font-bold ml-1">
                  {formik.errors.newPassword}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-purple-600 uppercase tracking-widest ml-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  {...formik.getFieldProps("confirmPassword")}
                  placeholder="Enter Confirm New Password"
                  className={cn(
                    "w-full p-5 bg-gray-50 border rounded-2xl text-lg font-bold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-purple-50",
                    formik.touched.confirmPassword &&
                      formik.errors.confirmPassword
                      ? "border-red-300 bg-red-50"
                      : "border-gray-100 focus:border-purple-200",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors"
                >
                  <Eye
                    size={22}
                    className={showConfirm ? "text-purple-600" : ""}
                  />
                </button>
              </div>
              {formik.touched.confirmPassword &&
                formik.errors.confirmPassword && (
                  <p className="text-xs text-red-500 font-bold ml-1">
                    {formik.errors.confirmPassword}
                  </p>
                )}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 relative z-10">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-10 py-4 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-300 text-white font-black rounded-2xl transition-all cursor-pointer shadow-xl shadow-purple-100 flex items-center gap-2 active:scale-95"
            >
              {changePasswordMutation.isPending && (
                <Loader2 size={18} className="animate-spin" />
              )}
              Update Password
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="px-10 py-4 border-2 border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

