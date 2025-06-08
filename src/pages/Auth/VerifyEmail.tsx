import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const { user, student } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (student?.verified) {
      navigate('/elections');
    }
  }, [student, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      // Implement resend verification email logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setResent(true);
      setCountdown(60);
    } catch (error) {
      console.error('Failed to resend email:', error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            Check your email
          </h2>

          <p className="text-gray-600 mb-6">
            We sent a verification link to{' '}
            <span className="font-medium text-gray-900">{user?.email}</span>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2 text-blue-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Verification pending</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Click the link in your email to verify your account
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              variant="outline"
              className="w-full"
              loading={resending}
              disabled={countdown > 0}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend verification email'}
            </Button>

            {resent && (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Verification email sent!</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Having trouble? Check your spam folder or{' '}
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                contact support
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;