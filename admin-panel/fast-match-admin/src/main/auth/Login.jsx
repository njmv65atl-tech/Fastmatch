import React, { useContext, useEffect, useState } from 'react';
import { Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { AuthCard } from '../../components/common/card';
import { AuthContext } from '../../contexts/AuthContext';
import { useLogin } from '../../reactQuery/hooks/authHook';
import logo from '../../assets/logo.svg';

const validationSchema = Yup.object({
  email: Yup.string()
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/, 'Please enter valid email address.')
    .required('Please enter email address.'),
  password: Yup.string()
    // .min(6, 'Password must be at least 6 characters')
    .required('Please enter password.'),
  rememberMe: Yup.boolean(),
});

export const Login = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AuthContext);
  const { mutate: login, isPending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: Cookies.get('remember_email') || '',
      password: Cookies.get('remember_password') || '',
      rememberMe: Cookies.get('remember_me') === 'true',
    },
    validationSchema,
    onSubmit: (values) => {
      // console.log('Login attempt with values:', values);
      login(
        { email: values.email, password: values.password },
        {
          onSuccess: (data) => {
            if (values.rememberMe) {
              Cookies.set('remember_email', values.email, { expires: 30 });
              Cookies.set('remember_password', values.password, { expires: 30 });
              Cookies.set('remember_me', 'true', { expires: 30 });
            } else {
              Cookies.remove('remember_email');
              Cookies.remove('remember_password');
              Cookies.remove('remember_me');
            }

            // Use data.data.token if present or data.token as fallback
            const accessToken = data.data?.token || data.token || data.accessToken;
            localStorage.setItem('token', accessToken);
            localStorage.setItem('wf_user', JSON.stringify(data.data?.user || data.user || data));
            
            setIsLoggedIn(true);
            toast.success('Logged in successfully!');
            navigate('/dashboard');
          },
          onError: (error) => {
            toast.error(error.message || 'Login failed. Please check your credentials.');
          },
        }
      );
    },
  });

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <AuthCard className="max-w-2xl w-full p-16 space-y-12">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} alt="Logo" className="w-50 h-40" />
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#7C3AED] transition-colors">
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                name="email"
                placeholder="Enter your email"
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

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#7C3AED] transition-colors">
                <Lock size={20} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password"
                placeholder="Enter your password"
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

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  name="rememberMe"
                  checked={formik.values.rememberMe}
                  onChange={formik.handleChange}
                  className="peer appearance-none w-5 h-5 rounded border border-white/10 bg-[#0A0B1A] checked:bg-[#7C3AED] checked:border-[#7C3AED] transition-all cursor-pointer" 
                />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Remember Me</span>
            </label>
            <button 
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-gray-400 hover:text-[#7C3AED] font-medium transition-colors cursor-pointer"
            >
              Forget Password?
            </button>
          </div>

          <Button 
            type="submit" 
            size="full" 
            disabled={isPending}
            className="py-5 text-lg rounded-2xl"
          >
            {isPending ? 'Signing In...' : 'Sign In Securely'}
          </Button>
        </form>

        <div className="bg-[#0A0B1A]/40 border border-white/5 rounded-[24px] p-6 flex items-start gap-5">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] shrink-0">
            <Shield size={22} />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-white tracking-wide">Encrypted Connection</p>
            <p className="text-xs text-gray-500 leading-relaxed">All admin sessions are encrypted and monitored for security.</p>
          </div>
        </div>
      </AuthCard>
    </div>
  );
};
