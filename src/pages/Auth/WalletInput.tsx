import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, CheckCircle, AlertCircle, Info, ArrowLeft, Shield, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendEmail, generateWelcomeEmail } from '../../lib/email';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';

interface RegistrationData {
  fullName: string;
  email: string;
  phone: string;
  studentId: string;
  password: string;
}

const WalletInput: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  
  const [walletAddress, setWalletAddress] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get registration data from navigation state
  const registrationData = location.state?.registrationData as RegistrationData;

  useEffect(() => {
    // Redirect if no registration data
    if (!registrationData) {
      navigate('/register');
      return;
    }
  }, [registrationData, navigate]);

  // Validate Ethereum wallet address format
  const validateWalletAddress = (address: string): boolean => {
    // Ethereum address format: 0x followed by 40 hexadecimal characters
    const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumRegex.test(address);
  };

  useEffect(() => {
    if (walletAddress.trim()) {
      const valid = validateWalletAddress(walletAddress.trim());
      setIsValid(valid);
      
      if (!valid && walletAddress.length > 5) {
        setError('Invalid wallet address format. Please enter a valid Ethereum address.');
      } else {
        setError('');
      }
    } else {
      setIsValid(false);
      setError('');
    }
  }, [walletAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress.trim()) {
      setError('Please enter your wallet address');
      return;
    }
    
    if (!isValid) {
      setError('Please enter a valid Ethereum wallet address');
      return;
    }

    if (!registrationData) {
      setError('Registration data not found. Please start over.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Starting registration with wallet:', walletAddress.trim());
      
      // Step 1: Create Supabase auth user
      console.log('Creating Supabase auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationData.email.trim().toLowerCase(),
        password: registrationData.password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation since we already verified
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Handle specific auth errors
        if (authError.message.includes('User already registered')) {
          setError('This email is already registered. Please use a different email or sign in instead.');
        } else if (authError.message.includes('Invalid email')) {
          setError('Invalid email format. Please check your email address.');
        } else if (authError.message.includes('Password')) {
          setError('Password is too weak. Please use a stronger password.');
        } else {
          setError(`Account creation failed: ${authError.message}`);
        }
        return;
      }

      if (!authData.user) {
        setError('Failed to create user account. Please try again.');
        return;
      }

      console.log('Auth user created:', authData.user.id);

      // Step 2: Create student record with the authenticated user's ID
      console.log('Creating student record...');
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          id: authData.user.id, // Use the auth user's ID
          full_name: registrationData.fullName.trim(),
          email: registrationData.email.trim().toLowerCase(),
          phone: registrationData.phone.trim(),
          student_id: registrationData.studentId.trim(),
          wallet_address: walletAddress.trim(),
          verified: true
        })
        .select()
        .single();

      if (studentError) {
        console.error('Student creation error:', studentError);
        
        // Handle specific student creation errors
        if (studentError.code === '23505') { // Unique constraint violation
          if (studentError.message.includes('email')) {
            setError('This email is already registered. Please use a different email.');
          } else if (studentError.message.includes('student_id')) {
            setError('This student ID is already registered. Please use a different student ID.');
          } else {
            setError('Account already exists. Please sign in instead.');
          }
        } else {
          setError(`Failed to create student profile: ${studentError.message}`);
        }
        return;
      }

      console.log('Student record created:', studentData);

      // Step 3: Send welcome email (non-blocking)
      try {
        await sendEmail({
          to: registrationData.email,
          subject: 'Welcome to UniVote - Your Account is Ready!',
          html: generateWelcomeEmail(registrationData.fullName)
        });
        console.log('Welcome email sent');
      } catch (emailError) {
        console.warn('Failed to send welcome email:', emailError);
        // Don't fail the registration if email fails
      }

      // Step 4: Auto sign in the user
      console.log('Auto-signing in user...');
      const { error: signInError } = await signIn(registrationData.email, registrationData.password);
      
      if (signInError) {
        console.warn('Auto sign-in failed:', signInError);
        // Don't fail registration if auto sign-in fails
      }

      // Navigate to success page
      navigate('/registration-success', {
        state: {
          studentData: {
            fullName: registrationData.fullName,
            email: registrationData.email,
            studentId: registrationData.studentId,
            walletAddress: walletAddress.trim()
          }
        }
      });

      console.log('Registration completed successfully');

    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific errors
      if (error.message?.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(`Registration failed: ${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/register');
  };

  if (!registrationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Registration data not found</h3>
          <p className="text-gray-600 mb-6">Please start the registration process again.</p>
          <Button onClick={() => navigate('/register')}>
            Start Registration
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Enter your MetaMask wallet address to secure your votes on the blockchain
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 border-white/20 shadow-2xl">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Registration</span>
            </Button>
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-start space-x-3">
                <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-3">How to get your wallet address:</h4>
                  <ol className="text-blue-800 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                      <span>Open your MetaMask browser extension</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                      <span>Click on your account name at the top</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                      <span>Copy the address (starts with "0x")</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                      <span>Paste it in the field below</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Why Connect Wallet */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Why connect a wallet?
              </h4>
              <ul className="text-green-800 space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Secure your votes with blockchain technology</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Ensure voting transparency and auditability</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Prevent fraud and duplicate voting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Maintain complete anonymity</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-3 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Wallet Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Input
                label="MetaMask Wallet Address"
                icon={Wallet}
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                className={`transition-all duration-200 ${
                  isValid ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
                }`}
                required
              />
              
              {/* Validation Indicator */}
              {walletAddress.trim() && (
                <div className="absolute right-4 top-9 flex items-center">
                  {isValid ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Valid</span>
                    </div>
                  ) : walletAddress.length > 5 ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : null}
                </div>
              )}
            </div>

            {/* Format Example */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Expected format:</strong>
              </p>
              <p className="text-sm font-mono text-gray-500 bg-white px-3 py-2 rounded border break-all">
                0x1234567890abcdef1234567890abcdef12345678
              </p>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <Lock className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-3">Security Notice</h4>
                  <ul className="text-amber-800 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Only enter your own wallet address</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>This address will be permanently linked to your account</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Never share your private keys or seed phrase</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>We only need your public wallet address</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isValid || loading}
              loading={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200"
              size="lg"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </Button>
          </form>
        </Card>

        {/* Security Notice */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 flex items-center justify-center">
            <span className="mr-2">🔒</span>
            Your wallet address is secured with end-to-end encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletInput;