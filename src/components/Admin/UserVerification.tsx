import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, AlertCircle, Users, Wallet, 
  RefreshCw, Eye, UserCheck, UserX, Database,
  Mail, Phone, Calendar, Award, TrendingUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { verifySpecificUsers, UserVerificationResult } from '../../utils/verifyUsers';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';

const UserVerification: React.FC = () => {
  const [verificationResults, setVerificationResults] = useState<UserVerificationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const targetEmails = [
    'ceo@project100.space',
    'tradestacksfin@gmail.com',
    'esther_chizaram@yahoo.com',
    'somyfrancis@yahoo.com',
    'metceoai@gmail.com'
  ];

  const checkAndVerifyUsers = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔍 Starting user verification process...');
      
      const results = await verifySpecificUsers();
      setVerificationResults(results);
      setLastChecked(new Date());

      const canVoteCount = results.filter(u => u.can_vote).length;
      const totalCount = results.length;
      const foundCount = results.filter(u => u.user_id).length;

      if (foundCount === 0) {
        setError('None of the specified users were found in the database. They need to register first.');
      } else if (canVoteCount === foundCount) {
        setSuccess(`✅ All ${foundCount} registered users are verified and can vote!`);
      } else {
        setSuccess(`✅ Verification completed. ${canVoteCount}/${foundCount} users can vote. Check details below.`);
      }

    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify users. Please check your admin permissions and try again.');
    } finally {
      setLoading(false);
    }
  };

  const enableVotingForUser = async (email: string) => {
    try {
      const { data, error } = await supabase
        .rpc('verify_and_enable_users_by_email', { user_emails: [email] });

      if (error) throw error;

      // Refresh the results
      await checkAndVerifyUsers();
      
    } catch (error) {
      console.error('Error enabling voting:', error);
      setError(`Failed to enable voting for ${email}`);
    }
  };

  useEffect(() => {
    checkAndVerifyUsers();
  }, []);

  const stats = {
    total: verificationResults.length,
    found: verificationResults.filter(u => u.user_id).length,
    verified: verificationResults.filter(u => u.verified).length,
    canVote: verificationResults.filter(u => u.can_vote).length,
    withWallet: verificationResults.filter(u => u.wallet_address).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">User Verification Status</h3>
          <p className="text-gray-600">Check and enable voting for specified user accounts</p>
        </div>
        <div className="flex items-center space-x-3">
          {lastChecked && (
            <span className="text-sm text-gray-500">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={checkAndVerifyUsers}
            loading={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {loading ? 'Checking...' : 'Check & Verify'}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center space-x-3 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <p>{success}</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.found}/{stats.total}</p>
          <p className="text-xs text-gray-600">Found/Target</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <UserCheck className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.verified}</p>
          <p className="text-xs text-gray-600">Verified</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Wallet className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.withWallet}</p>
          <p className="text-xs text-gray-600">With Wallet</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-emerald-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.canVote}</p>
          <p className="text-xs text-gray-600">Can Vote</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            {stats.found > 0 ? Math.round((stats.canVote / stats.found) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-600">Ready Rate</p>
        </Card>
      </div>

      {/* Target Emails List */}
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Target User Accounts</h4>
        <div className="space-y-3">
          {targetEmails.map((email, index) => {
            const result = verificationResults.find(r => r.email === email);
            
            return (
              <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{email}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {result ? (
                    <>
                      {result.can_vote ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready to Vote
                        </span>
                      ) : result.user_id ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Needs Setup
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <UserX className="h-3 w-3 mr-1" />
                          Not Registered
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Database className="h-3 w-3 mr-1" />
                      Checking...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detailed Results */}
      {verificationResults.length > 0 && (
        <Card className="backdrop-blur-sm bg-white/80 border-white/20">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Verification Results</h4>
          <div className="space-y-4">
            {verificationResults.map((result, index) => (
              <div key={result.email} className={`p-4 rounded-lg border-2 ${
                result.can_vote 
                  ? 'border-green-200 bg-green-50' 
                  : result.user_id 
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-semibold text-gray-900">{result.email}</h5>
                      {result.can_vote ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : result.user_id ? (
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                      ) : (
                        <UserX className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    
                    {result.user_id ? (
                      <div className="space-y-1 text-sm">
                        <p><strong>Name:</strong> {result.full_name}</p>
                        <p><strong>User ID:</strong> {result.user_id}</p>
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            result.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.verified ? 'Verified' : 'Not Verified'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            result.voting_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.voting_enabled ? 'Voting Enabled' : 'Voting Disabled'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            result.wallet_address ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {result.wallet_address ? 'Wallet Connected' : 'No Wallet'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600">User not found in database - needs to register first</p>
                    )}
                    
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Status:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {result.issues.map((issue, idx) => (
                          <li key={idx} className={
                            issue === 'Ready to vote' ? 'text-green-600 font-medium' : 
                            issue.includes('not found') ? 'text-red-600' : 'text-amber-600'
                          }>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {result.user_id && !result.can_vote && (
                    <Button
                      size="sm"
                      onClick={() => enableVotingForUser(result.email)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Enable Voting
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>For users not found:</strong> They need to register at /register first</p>
          <p><strong>For users without wallets:</strong> They need to connect their MetaMask wallet</p>
          <p><strong>For users ready to vote:</strong> They can access any election and see voting buttons</p>
          <p><strong>To test:</strong> Have these users log in and navigate to an active election</p>
        </div>
      </Card>
    </div>
  );
};

export default UserVerification;