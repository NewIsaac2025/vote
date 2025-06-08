import React, { useState } from 'react';
import { Monitor, Smartphone, Download, Play, CheckCircle, Shield, Lock, Users, AlertTriangle, Chrome, RefreshCw, Wallet, Vote, Eye, Award } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';

const RegistrationGuide: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<'pc' | 'mobile'>('pc');

  const securityFeatures = [
    {
      icon: Users,
      title: 'One Vote Per Student',
      description: 'Each student can only vote once per election, ensuring fair democratic participation.'
    },
    {
      icon: Lock,
      title: 'Email-Wallet Linking',
      description: 'Your email can only be linked to one MetaMask wallet for enhanced security.'
    },
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Your vote is securely recorded on the blockchain and cannot be altered or deleted.'
    },
    {
      icon: AlertTriangle,
      title: 'Duplicate Prevention',
      description: 'Advanced algorithms prevent any form of duplicate voting or fraud.'
    }
  ];

  const votingSteps = [
    {
      icon: Users,
      title: 'Sign In',
      description: 'Log in with your registered student account'
    },
    {
      icon: Eye,
      title: 'Browse Elections',
      description: 'View active elections and candidate profiles'
    },
    {
      icon: Vote,
      title: 'Select Candidate',
      description: 'Choose your preferred candidate and review their manifesto'
    },
    {
      icon: Award,
      title: 'Confirm Vote',
      description: 'Confirm your vote through MetaMask wallet verification'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How to Register & Vote
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Follow our comprehensive guide to register as a student and participate in secure blockchain voting
          </p>
        </div>

        {/* Device Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedDevice('pc')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedDevice === 'pc'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Monitor className="h-5 w-5" />
                <span>PC / Desktop</span>
              </button>
              <button
                onClick={() => setSelectedDevice('mobile')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedDevice === 'mobile'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Smartphone className="h-5 w-5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Step 1: Install MetaMask */}
        <Card className="mb-12 backdrop-blur-sm bg-white/90 border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Install MetaMask</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Watch this tutorial to set up your MetaMask wallet for secure blockchain voting:
              </p>

              {/* Video Embed */}
              <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6">
                <iframe
                  src="https://www.youtube.com/embed/u9vsiFcrVG4"
                  title="MetaMask Setup Tutorial"
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              <Button
                asChild
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download MetaMask
                </a>
              </Button>
            </div>

            <div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h4 className="font-bold text-amber-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Important Security Notes
                </h4>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-amber-900">Device & Wallet Exclusivity</p>
                      <p className="text-amber-800 text-sm">The device and MetaMask wallet you use for registration can only be used by you</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-amber-900">One Wallet Per Account</p>
                      <p className="text-amber-800 text-sm">Each wallet can only be linked to one student account</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-amber-900">Consistency Required</p>
                      <p className="text-amber-800 text-sm">For security, use the same browser and MetaMask wallet throughout the process</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedDevice === 'mobile' && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-bold text-blue-900 mb-3">📱 Mobile Instructions</h4>
                  <ol className="text-blue-800 text-sm space-y-2">
                    <li>1. Download MetaMask app from App Store or Google Play</li>
                    <li>2. Create a new wallet or import existing one</li>
                    <li>3. Save your seed phrase securely</li>
                    <li>4. Use the in-app browser to access UniVote</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Step 2: Register as Student */}
        <Card className="mb-12 backdrop-blur-sm bg-white/90 border-white/20">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Register as a Student</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <p className="font-medium text-gray-900">Click "Register"</p>
              <p className="text-sm text-gray-600">Start the registration process</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <p className="font-medium text-gray-900">Fill Details</p>
              <p className="text-sm text-gray-600">Enter your personal information</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <p className="font-medium text-gray-900">Verify Email</p>
              <p className="text-sm text-gray-600">Enter OTP from your email</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <p className="font-medium text-gray-900">Connect Wallet</p>
              <p className="text-sm text-gray-600">Link your MetaMask wallet</p>
            </div>
          </div>

          {/* Troubleshooting Section */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h4 className="font-bold text-red-900 mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Troubleshooting "Failed to create account" Error
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-red-900 mb-2">Common Solutions:</h5>
                <ul className="text-red-800 text-sm space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-red-600" />
                    <span>Ensure you're using the correct MetaMask wallet</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Chrome className="h-4 w-4 mt-0.5 text-red-600" />
                    <span>Try using Google Chrome browser (recommended)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <RefreshCw className="h-4 w-4 mt-0.5 text-red-600" />
                    <span>Clear browser cache and cookies, then try again</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Wallet className="h-4 w-4 mt-0.5 text-red-600" />
                    <span>Make sure MetaMask is unlocked and connected</span>
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-red-900 mb-2">Browser Recommendations:</h5>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Chrome className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Google Chrome</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Recommended</span>
                  </div>
                  <p className="text-sm text-gray-600">Best compatibility with MetaMask and blockchain features</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Step 3: Voting Process */}
        <Card className="mb-12 backdrop-blur-sm bg-white/90 border-white/20">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Voting Process</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {votingSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  index === 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                  index === 1 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  index === 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                  'bg-gradient-to-r from-orange-500 to-red-500'
                }`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Security Features */}
        <Card className="backdrop-blur-sm bg-white/90 border-white/20">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Security Features</h3>
            <p className="text-gray-600">Your vote is protected by multiple layers of blockchain security</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center">
            <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-green-900 mb-2">100% Secure & Transparent</h4>
            <p className="text-green-800">
              Every vote is cryptographically secured, publicly verifiable, and permanently recorded on the blockchain. 
              Your privacy is protected while ensuring complete election transparency.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default RegistrationGuide;