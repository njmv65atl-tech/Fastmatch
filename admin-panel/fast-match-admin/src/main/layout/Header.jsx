import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetProfile } from "../../reactQuery/hooks/profileHook";
import { imageUrl } from "../../reactQuery/api/apiClient";
import { User } from "lucide-react";

export const Header = () => {
  const navigate = useNavigate();
  const { data: response } = useGetProfile();
  const admin = response?.data || {};

  return (
    <header className="h-[88px] bg-white flex items-center justify-end px-12 sticky top-0 z-10 border-b border-gray-100">
      <div
        className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity group"
        onClick={() => navigate("/profile")}
      >
        <div className="flex flex-col items-end">
          <span className="text-[15px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {admin.fullName || "Admin"}
          </span>
          <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest leading-tight">
            Administrator
          </span>
        </div>
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-indigo-50 group-hover:ring-indigo-100 transition-all">
          {admin.profilePicture ? (
            <img
              src={imageUrl + admin.profilePicture}
              alt="Admin"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
              <User size={20} className="text-indigo-300" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

