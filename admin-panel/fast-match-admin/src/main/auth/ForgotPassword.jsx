import React from 'react';
import { X, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { Button } from '../../components/common/Button';
import { AuthCard } from '../../components/common/card';
import { useForgotPassword } from '../../reactQuery/hooks/authHook';
import logo from '../../assets/logo.svg';

const validationSchema = Yup.object({
  email: Yup.string()
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/, 'Please enter valid email address')
    .required('Please enter email address'),
});

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { mutate: sendResetLink, isPending } = useForgotPassword();

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: (values) => {
      sendResetLink(values, {
        onSuccess: (data) => {
          toast.success(data.message || 'Reset OTP sent successfully to your registered email address!');
          navigate('/verify-email', { state: { email: values.email } });
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to send reset OTP.');
        },
      });
    },
  });

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <AuthCard className="max-w-xl w-full p-16 relative">
        <button 
          onClick={() => navigate('/login')}
          className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center gap-10">
          <img src={logo} alt="Logo" className="w-50 h-50" />

          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold text-white">Forgot Password</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">Enter your email Address to receive a password reset link.</p>
          </div>

          <form onSubmit={formik.handleSubmit} className="w-full space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#7C3AED] transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Enter your email address"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-[#0A0B1A] border ${formik.touched.email && formik.errors.email ? 'border-red-500' : 'border-white/5'} rounded-2xl py-5 pl-14 pr-6 text-white text-lg focus:ring-2 focus:ring-[#7C3AED]/50 outline-none transition-all`}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-500 text-xs ml-1">{formik.errors.email}</p>
              )}
            </div>

            <Button 
              type="submit" 
              size="full" 
              disabled={isPending}
              className="py-5 text-lg rounded-2xl"
            >
              {isPending ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </div>
      </AuthCard>
    </div>
  );
};
