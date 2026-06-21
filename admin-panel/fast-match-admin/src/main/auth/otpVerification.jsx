import React, { useState, useRef, useEffect } from 'react';
import { Shield, X, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { AuthCard } from '../../components/common/card';
import { toast } from 'react-toastify';
import { useVerifyOtp, useForgotPassword } from '../../reactQuery/hooks/authHook';

export const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Use state email or fallback to sessionStorage to handle page refreshes
  const email = location.state?.email || sessionStorage.getItem('last_forgot_email') || '';
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const { mutate: verifyOtp, isPending } = useVerifyOtp();
  const { mutate: resendOtp } = useForgotPassword();
  const inputRefs = useRef([]);

  // Store email in sessionStorage whenever it's available
  useEffect(() => {
    if (location.state?.email) {
      sessionStorage.setItem('last_forgot_email', location.state.email);
    }
  }, [location.state?.email]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleResend = () => {
    if (!email) {
      toast.error('Email not found. Please try again.');
      navigate('/forgot-password');
      return;
    }
    setIsResending(true);
    resendOtp(
      { email },
      {
        onSuccess: () => {
          setTimer(30);
          setIsResending(false);
          toast.success('OTP resent successfully!');
        },
        onError: (error) => {
          setIsResending(false);
          toast.error(error.message || 'Failed to resend OTP');
        },
      }
    );
  };

  const handleSubmit = () => {
    const code = otp.join('');
    if (code.length < 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }

    verifyOtp(
      { email, otp: code },
      {
        onSuccess: (data) => {
          // Store the reset token returned by the OTP verification
          const resetToken = data.data?.token || data.token;
          if (resetToken) {
            localStorage.setItem('token', resetToken);
          }
          toast.success(data.message || 'OTP verified successfully!');
          navigate('/reset-password');
        },
        onError: (error) => {
          toast.error(error.message || 'Invalid or expired OTP');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <AuthCard className="max-w-xl w-full p-16 text-center space-y-10 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#7C3AED] to-transparent opacity-50"></div>
        
        <button 
          onClick={() => navigate('/login')}
          className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors cursor-pointer p-2 hover:bg-white/5 rounded-full"
        >
          <X size={24} />
        </button>
        
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-[#7C3AED]/10 rounded-3xl flex items-center justify-center text-[#7C3AED] shadow-2xl border border-[#7C3AED]/20 animate-pulse">
              <Shield size={48} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white tracking-tight">Security Verification</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
            Enter the 4-digit code sent to your email address to verify your identity.
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex justify-center gap-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-18 bg-[#0A0B1A] border border-white/10 rounded-xl text-center text-3xl font-bold text-white focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 outline-none transition-all"
              />
            ))}
          </div>

          <div className="space-y-4">
            <Button 
              size="full" 
              onClick={handleSubmit} 
              disabled={isPending}
              className="py-5 text-lg rounded-2xl shadow-lg shadow-[#7C3AED]/20"
            >
              {isPending ? 'Verifying...' : 'Verify Code'}
            </Button>

            <p className="text-sm text-gray-500">
              Didn't get the code?{' '}
              {timer > 0 ? (
                <span className="text-gray-400 font-medium">Resend in {timer}s</span>
              ) : (
                <button 
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-[#7C3AED] hover:text-[#6D28D9] font-semibold cursor-pointer transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {isResending ? <RefreshCw size={14} className="animate-spin" /> : null}
                  Resend OTP
                </button>
              )}
            </p>
          </div>
        </div>
      </AuthCard>
    </div>
  );
};
