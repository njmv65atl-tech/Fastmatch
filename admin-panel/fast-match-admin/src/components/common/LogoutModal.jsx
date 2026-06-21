import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';
import { useLogout } from '../../reactQuery/hooks/authHook';
import { toast } from 'react-toastify';

export const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  const { mutate: logout, isPending } = useLogout();

  const handleLogout = () => {
    console.log('DEBUG: Token in localStorage before mutation:', localStorage.getItem('token'));
    logout(null, {
      onSuccess: (data) => {
        console.log('Logout API Success Response:', data);
        localStorage.removeItem('token');
        localStorage.removeItem('wf_user');
        toast.success('Logged out successfully');
        onConfirm();
      },
      onError: (error) => {
        console.error('Logout API Error Response:', error);
        toast.error(error.message || 'Logout failed');
        // Even if API fails, we might want to logout locally
        localStorage.removeItem('token');
        localStorage.removeItem('wf_user');
        onConfirm();
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[32px] p-12 max-w-lg w-full relative z-10 shadow-2xl text-center space-y-10"
          >
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              Are You Sure You Want To Logout?
            </h2>
            
            <div className="flex gap-4">
              <Button 
                variant="secondary" 
                size="full" 
                onClick={onClose}
                disabled={isPending}
                className="rounded-2xl py-5 text-xl"
              >
                No
              </Button>
              <Button 
                variant="primary" 
                size="full" 
                onClick={handleLogout}
                disabled={isPending}
                className="rounded-2xl py-5 text-xl"
              >
                {isPending ? 'Logging out...' : 'Yes'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
