import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import './App.css';

const App = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [status, setStatus] = useState('idle'); // 'idle' or 'success'
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    const isComplete = otp.every(digit => digit !== '');
    if (isComplete) {
      inputRefs.forEach(ref => {
        if (ref.current) ref.current.blur();
      });
      setStatus('success');
    } else {
      setStatus('idle');
    }
  }, [otp]);

  const handleChange = (index, e) => {
    if (status !== 'idle') return;
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (status !== 'idle') return;
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    if (status !== 'idle') return;
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4).split('');
    if (pastedData.some(char => isNaN(char))) return;

    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtp(newOtp);

    const nextEmptyIndex = pastedData.length < 4 ? pastedData.length : 3;
    if (inputRefs[nextEmptyIndex].current) {
      inputRefs[nextEmptyIndex].current.focus();
    }
  };

  const boxVariants = {
    idle: {
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    success: (i) => {
      const initialX = [-120, -40, 40, 120];
      const targetX = [-60, -60, 60, 60];
      const targetY = [-48, 48, -48, 48];

      const deltaXCenter = targetX[i] - initialX[i];
      const deltaYCenter = targetY[i];

      return {
        x: [0, deltaXCenter, deltaXCenter, -initialX[i]],
        y: [0, deltaYCenter, deltaYCenter, 0],
        scale: [1, 1, 1, 1],
        opacity: [1, 1, 1, 1],
        zIndex: 4 - i,
        transition: {
          duration: 2.1,
          times: [0, 0.19, 0.86, 1],
          ease: "easeInOut"
        }
      };
    }
  };

  const containerVariants = {
    idle: { rotate: 0 },
    success: {
      rotate: 0,
      transition: { duration: 2.1 }
    }
  };

  return (
    <div className="app-wrapper">
      <div className={`otp-container ${status === 'success' ? 'is-complete' : ''}`}>
        <div className="drag-handle"></div>
        <div className="otp-header">
          <AnimatePresence mode="wait">
            {status !== 'success' ? (
              <motion.div
                key="unverified"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { delay: 2.1, duration: 0.3 } }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <h1>Let's verify your number</h1>
                <p>
                  {"We've sent a 4-digit code to your phone.\nIt'll auto-verify once entered."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="verified"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <h1 style={{ color: '#22c55e' }}>Verified Successfully</h1>
                <p>
                  Your number has been verified.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          className="otp-inputs"
          onPaste={handlePaste}
          variants={containerVariants}
          initial="idle"
          animate={status}
        >
          <AnimatePresence>
            {status === 'success' && (
              <>
                {/* Connecting Dotted Line */}
                <motion.svg
                  viewBox="-100 -100 200 200"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    x: '-50%',
                    y: '-50%',
                    width: '200px',
                    height: '200px',
                    zIndex: 0,
                    pointerEvents: 'none'
                  }}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: [1, 1, 1, 1], scale: [1, 1, 1, 0] }}
                  transition={{ duration: 2.1, times: [0, 0.19, 0.86, 1], ease: "easeInOut" }}
                >
                  <motion.path
                    d="M -60 48 L -60 -48 L 60 -48 L 60 48 Z"
                    fill="none"
                    stroke="#888"
                    strokeWidth="4"
                    strokeDasharray="4 12"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 1.3, ease: "easeInOut" }}
                  />
                </motion.svg>



                {/* Success Shockwave */}
                <motion.div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    x: '-50%',
                    y: '-50%',
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    border: '1px solid #22c55e',
                    zIndex: 0,
                    pointerEvents: 'none'
                  }}
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: [0, 0.8, 0], scale: [1, 2.5, 3.5] }}
                  transition={{ delay: 2.1, duration: 0.8, ease: "easeOut" }}
                />

                {/* Confetti Explosion */}
                {[...Array(40)].map((_, i) => {
                  const colors = ['#22c55e', '#4ade80', '#16a34a'];
                  const color = colors[i % colors.length];
                  const angle = (i * 137.5) * (Math.PI / 180);
                  const distance = 100 + (i % 5) * 50;
                  const size = 6 + (i % 3) * 4;
                  const isCircle = i % 2 === 0;

                  return (
                    <motion.div
                      key={`confetti-${i}`}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginLeft: `-${size / 2}px`,
                        marginTop: `-${size / 2}px`,
                        width: `${size}px`,
                        height: `${size}px`,
                        backgroundColor: color,
                        borderRadius: isCircle ? '50%' : '2px',
                        zIndex: 15,
                        pointerEvents: 'none'
                      }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={{
                        x: Math.cos(angle) * distance,
                        y: Math.sin(angle) * distance + (distance * 0.2),
                        scale: [0, 1, 1, 0],
                        opacity: [0, 1, 1, 0],
                        rotate: isCircle ? 0 : [0, 360, 720]
                      }}
                      transition={{
                        delay: 2.1,
                        duration: 1.2 + (i % 3) * 0.2,
                        ease: "easeOut",
                        times: [0, 0.1, 0.8, 1]
                      }}
                    />
                  );
                })}

              </>
            )}
          </AnimatePresence>

          {otp.map((digit, index) => (
            <motion.div
              key={index}
              className="input-wrapper"
              custom={index}
              variants={boxVariants}
              initial="idle"
              animate={status}
            >
              <motion.input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                ref={inputRefs[index]}
                value={digit}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                readOnly={status !== 'idle'}
              />

              {index === 0 && (
                <motion.svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="final-tick"
                  initial={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
                  animate={status === 'success' ? { opacity: 1, scale: 1, x: "-50%", y: "-50%" } : { opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
                  transition={{ delay: 2.1, duration: 0.5, type: "spring", stiffness: 250, damping: 20 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '32px',
                    height: '32px',
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={status === 'success' ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ delay: 2.3, duration: 0.4, ease: "easeOut" }}
                  />
                </motion.svg>
              )}
            </motion.div>
          ))}
        </motion.div>

        <div className="footer-area">
          <AnimatePresence>
            {status !== 'success' && (
              <motion.div
                className="otp-footer"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Didn't receive the code? <button type="button">Resend</button>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 2.7, duration: 0.5, type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  color: '#22c55e',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '18px'
                }}
              >
                <Lock size={20} /> Verified and Secure
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default App;