import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Car as IdCard, ArrowRight, ArrowLeft, Check, Sparkles, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateOTP, validateEmail, validatePhone, validateStudentId } from '../../lib/utils';
import { sendEmail, generateOTPEmail } from '../../lib/email';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  studentId: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    studentId: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    } else if (!validateStudentId(formData.studentId)) {
      newErrors.studentId = 'Student ID must be 6-12 alphanumeric characters';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep1()) return;

    setLoading(true);
    setErrors({});
    
    try {
      // Check if email or student ID already exists
      const { data: existingStudent, error: checkError } = await supabase
        .from('students')
        .select('email, student_id')
        .or(`email.eq.${formData.email},student_id.eq.${formData.studentId}`);

      // Handle the case where no existing user is found (PGRST116 error is expected)
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Database error:', checkError);
        setErrors({ general: 'Database error. Please try again.' });
        return;
      }

      // Check if any existing records were found
      if (existingStudent && existingStudent.length > 0) {
        const existingRecord = existingStudent[0];
        if (existingRecord.email === formData.email) {
          setErrors({ email: 'This email is already registered' });
        }
        if (existingRecord.student_id === formData.studentId) {
          setErrors({ studentId: 'This student ID is already registered' });
        }
        return;
      }

      // Generate and send OTP
      const otpCode = generateOTP();
      setGeneratedOtp(otpCode);

      // Send OTP email using the edge function
      const emailSent = await sendEmail({
        to: formData.email,
        subject: 'UniVote - Email Verification Code',
        html: generateOTPEmail(otpCode, formData.fullName)
      });

      if (emailSent) {
        setCurrentStep(2);
        setErrors({ general: 'Verification code sent! Check your email inbox.' });
      } else {
        // For demo purposes, still proceed but show the OTP in console
        console.log('OTP Code (for demo):', otpCode);
        setCurrentStep(2);
        setErrors({ general: 'Email service temporarily unavailable. For demo purposes, check the browser console for your verification code.' });
      }
    } catch (error: any) {
      console.error('Error:', error);
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setErrors({ otp: 'Please enter the verification code' });
      return;
    }

    if (otp !== generatedOtp) {
      setErrors({ otp: 'Invalid verification code. Please try again.' });
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      // Navigate to wallet input page with registration data
      navigate('/wallet-input', {
        state: {
          registrationData: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            studentId: formData.studentId,
            password: formData.password
          }
        }
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      setErrors({ otp: 'Verification failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', completed: currentStep > 1 },
    { number: 2, title: 'Verify Email', completed: currentStep > 2 },
    { number: 3, title: 'Connect Wallet', completed: false },
    { number: 4, title: 'Complete', completed: false }
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center relative z-10">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                    ${step.completed ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-110' : 
                      currentStep === step.number ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110' : 
                      'bg-gray-200 text-gray-600'}
                  `}>
                    {step.completed ? <Check className="h-6 w-6" /> : step.number}
                  </div>
                  <span className="mt-3 text-sm font-medium text-gray-600 text-center max-w-20">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-4 rounded-full transition-all duration-500
                    ${step.completed ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-200'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 border-white/20 shadow-2xl">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                  Create Your Account
                </h2>
                <p className="text-gray-600 text-lg">Enter your personal information to get started</p>
              </div>

              {errors.general && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-600 text-sm">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleStep1Submit} className="space-y-6">
                <Input
                  label="Full Name"
                  icon={User}
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  error={errors.fullName}
                  placeholder="Enter your full name"
                  required
                  className="transition-all duration-200 focus:scale-[1.01]"
                />

                <Input
                  label="Email Address"
                  type="email"
                  icon={Mail}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  error={errors.email}
                  placeholder="Enter your university email"
                  required
                  className="transition-all duration-200 focus:scale-[1.01]"
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  icon={Phone}
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  error={errors.phone}
                  placeholder="+1 (555) 123-4567"
                  required
                  className="transition-all duration-200 focus:scale-[1.01]"
                />

                <Input
                  label="Student ID"
                  icon={IdCard}
                  value={formData.studentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                  error={errors.studentId}
                  placeholder="e.g., STU123456"
                  required
                  className="transition-all duration-200 focus:scale-[1.01]"
                />

                <Input
                  label="Password"
                  type="password"
                  icon={Lock}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  error={errors.password}
                  placeholder="Create a secure password"
                  required
                  className="transition-all duration-200 focus:scale-[1.01]"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  icon={Lock}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  error={errors.confirmPassword}
                  placeholder="Confirm your password"
                  required
                  className="transition-all duration-200 focus:scale-[1.01]"
                />

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200" 
                  size="lg" 
                  loading={loading}
                >
                  Continue to Verification
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                  Verify Your Email
                </h2>
                <p className="text-gray-600 text-lg mb-2">
                  We sent a 6-digit verification code to
                </p>
                <p className="font-semibold text-blue-600 text-lg">{formData.email}</p>
              </div>

              {errors.general && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-600 text-sm">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleOtpVerification} className="space-y-6">
                <Input
                  label="Verification Code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  error={errors.otp}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono transition-all duration-200 focus:scale-[1.01]"
                  required
                />

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 transition-all duration-200 hover:scale-[1.02]"
                    size="lg"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-[1.02]" 
                    loading={loading}
                    size="lg"
                  >
                    Verify & Continue
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?{' '}
                  <button 
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    onClick={() => {/* Implement resend logic */}}
                  >
                    Resend Code
                  </button>
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Security Notice */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 flex items-center justify-center">
            <span className="mr-2">🔒</span>
            Your data is protected with end-to-end encryption and blockchain security
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;