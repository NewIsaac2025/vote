import React, { useState, useEffect } from 'react';
import { X, Wallet, CheckCircle, AlertCircle, Info } from 'lucide-react';
import Button from './Button';
import Input from './Input';

interface WalletInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletSubmit: (walletAddress: string) => void;
  loading?: boolean;
}

const WalletInputModal: React.FC<WalletInputModalProps> = ({
  isOpen,
  onClose,
  onWalletSubmit,
  loading = false
}) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress.trim()) {
      setError('Please enter your wallet address');
      return;
    }
    
    if (!isValid) {
      setError('Please enter a valid Ethereum wallet address');
      return;
    }
    
    onWalletSubmit(walletAddress.trim());
  };

  const handleClose = () => {
    if (!loading) {
      setWalletAddress('');
      setIsValid(false);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-0 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Wallet className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Connect Your Wallet</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">How to get your wallet address:</h4>
                  <ol className="text-blue-800 text-sm space-y-1">
                    <li>1. Open your MetaMask extension</li>
                    <li>2. Click on your account name at the top</li>
                    <li>3. Copy the address (starts with "0x")</li>
                    <li>4. Paste it in the field below</li>
                  </ol>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  label="MetaMask Wallet Address"
                  icon={Wallet}
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x1234567890abcdef..."
                  error={error}
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
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Expected format:</strong>
                </p>
                <p className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded border">
                  0x1234567890abcdef1234567890abcdef12345678
                </p>
              </div>

              {/* Security Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Security Notice</h4>
                    <ul className="text-amber-800 text-sm space-y-1">
                      <li>• Only enter your own wallet address</li>
                      <li>• This address will be permanently linked to your account</li>
                      <li>• Never share your private keys or seed phrase</li>
                      <li>• We only need your public wallet address</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || loading}
                  loading={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletInputModal;