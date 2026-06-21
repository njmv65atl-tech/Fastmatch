import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { AuthCard } from '../../components/common/card';
import { useResetPassword } from '../../reactQuery/hooks/authHook';
import logo from '../../assets/logo.svg';

const validationSchema = Yup.object({
  password: Yup.string()
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})(^\S*$)/,
      'New password must be at least 8 characters long with uppercase, lowercase, number, special character, and no spaces.'
    )
    .required('Please enter new password'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'New password and confirm new password does not match.')
    .required('Please enter confirm new password'),
});

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { mutate: resetPassword, isPending } = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: (values) => {
      const email = sessionStorage.getItem('last_forgot_email');
      if (!email) {
        toast.error('Email not found. Please start the process again.');
        navigate('/forgot-password');
        return;
      }

      resetPassword(
        { email, password: values.password },
        {
          onSuccess: (data) => {
            toast.success(data.message || 'Password reset successfully!');
            sessionStorage.removeItem('last_forgot_email');
            localStorage.removeItem('token');
            localStorage.removeItem('wf_user');
            navigate('/login');
          },
          onError: (error) => {
            toast.error(error.message || 'Failed to reset password.');
          },
        }
      );
    },
  });

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <AuthCard className="max-w-xl w-full p-16 space-y-12">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} alt="Logo" className="w-50 h-50" />
        </div>

        <div className="text-center space-y-3">
          <h3 className="text-3xl font-bold text-white">Reset Your Password</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">Enter your new password below. Make sure it&apos;s strong and unique.</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="w-full space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 ml-1">New Password</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#7C3AED] transition-colors">
                <Lock size={20} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password"
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full bg-[#0A0B1A] border ${formik.touched.password && formik.errors.password ? 'border-red-500' : 'border-white/5'} rounded-2xl py-5 pl-14 pr-14 text-white text-lg focus:ring-2 focus:ring-[#7C3AED]/50 outline-none transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#7C3AED] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-xs ml-1">{formik.errors.password}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 ml-1">Confirm New Password</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#7C3AED] transition-colors">
                <Lock size={20} />
              </div>
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                name="confirmPassword"
                placeholder="••••••••"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full bg-[#0A0B1A] border ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'border-red-500' : 'border-white/5'} rounded-2xl py-5 pl-14 pr-14 text-white text-lg focus:ring-2 focus:ring-[#7C3AED]/50 outline-none transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#7C3AED] transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-red-500 text-xs ml-1">{formik.errors.confirmPassword}</p>
            )}
          </div>

          <Button 
            type="submit" 
            size="full" 
            disabled={isPending}
            className="py-5 text-lg rounded-2xl"
          >
            {isPending ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </AuthCard>
    </div>
  );
};
