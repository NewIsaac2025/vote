import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, CheckCircle, AlertCircle, Info, Shield, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Card from '../../components/UI/Card';

const WalletVerification: React.FC = () => {
  const navigate = useNavigate();
  const { student, updateStudent } = useAuth();
  
  const [walletAddress, setWalletAddress] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already verified
  useEffect(() => {
    if (student?.wallet_address) {
      navigate('/elections');
    }
  }, [student, navigate]);

  // Validate Ethereum wallet address format
  const validateWalletAddress = (address: string): boolean => {
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
    
    setLoading(true);
    setError('');
    
    try {
      await updateStudent({ 
        wallet_address: walletAddress.trim(),
        verified: true 
      });
      
      setSuccess('Wallet verified successfully! You can now participate in voting.');
      
      // Redirect to elections after a short delay
      setTimeout(() => {
        navigate('/elections');
      }, 2000);
      
    } catch (error: any) {
      console.error('Wallet verification error:', error);
      setError('Failed to verify wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Please sign in to verify your wallet</p>
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
            Verify Your Wallet
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect your MetaMask wallet to complete your verification and start voting
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
              <span>Back</span>
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
                Why verify your wallet?
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

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-3 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <p className="text-sm font-medium">{success}</p>
              </div>
            </div>
          )}

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
              {loading ? 'Verifying Wallet...' : 'Verify Wallet'}
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

export default WalletVerification;