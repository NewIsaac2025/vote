import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, User, Mail, IdCard, Wallet, ArrowRight, Trophy, Sparkles, Shield } from 'lucide-react';
import { truncateAddress } from '../../lib/utils';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

interface StudentData {
  fullName: string;
  email: string;
  studentId: string;
  walletAddress: string;
}

const RegistrationSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const studentData = location.state?.studentData as StudentData;

  useEffect(() => {
    // Redirect if no student data
    if (!studentData) {
      navigate('/register');
      return;
    }
  }, [studentData, navigate]);

  const handleContinue = () => {
    navigate('/elections');
  };

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center py-12">
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
        {/* Success Animation */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-full animate-bounce">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Registration Successful! 🎉
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Welcome to UniVote! Your account has been created and your wallet has been successfully connected.
            </p>
          </div>
        </div>

        {/* Success Card */}
        <Card className="backdrop-blur-sm bg-white/90 border-white/20 shadow-2xl mb-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to the Future of Voting, {studentData.fullName.split(' ')[0]}!
            </h2>
            <p className="text-gray-600">
              Your account is now ready for secure, blockchain-powered voting
            </p>
          </div>

          {/* Account Details */}
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Account Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600 font-medium">Full Name</span>
                  </div>
                  <span className="font-semibold text-gray-900">{studentData.fullName}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600 font-medium">Email</span>
                  </div>
                  <span className="font-semibold text-gray-900">{studentData.email}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <IdCard className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600 font-medium">Student ID</span>
                  </div>
                  <span className="font-semibold text-gray-900">{studentData.studentId}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Wallet className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">Wallet Connected</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-green-800 text-sm">
                      {truncateAddress(studentData.walletAddress)}
                    </span>
                    <div className="flex items-center space-x-1 mt-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              What's Next?
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-medium text-blue-900">Explore Active Elections</p>
                  <p className="text-blue-700 text-sm">Browse current and upcoming elections you can participate in</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-medium text-blue-900">Review Candidates</p>
                  <p className="text-blue-700 text-sm">Learn about candidates, their manifestos, and campaign promises</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-medium text-blue-900">Cast Your Vote</p>
                  <p className="text-blue-700 text-sm">Participate in secure, blockchain-powered voting</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Your Vote is Protected
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800 text-sm">Blockchain secured</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800 text-sm">Completely anonymous</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800 text-sm">Tamper-proof</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-800 text-sm">Transparent results</span>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200"
            size="lg"
          >
            Start Voting Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Card>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            🎉 Congratulations! You're now part of the future of democratic participation.
          </p>
          <p className="text-xs text-gray-400">
            A welcome email has been sent to {studentData.email} with additional information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;