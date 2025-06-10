import React from 'react';
import { TrendingUp, Users, Clock, Zap, BarChart3, Activity } from 'lucide-react';
import { useElectionResults } from '../../hooks/useElectionResults';
import Card from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';

interface OptimizedLiveVoteTrackerProps {
  electionId: string;
  isActive: boolean;
}

const OptimizedLiveVoteTracker: React.FC<OptimizedLiveVoteTrackerProps> = ({ 
  electionId, 
  isActive 
}) => {
  const { results, loading, error } = useElectionResults(electionId, isActive);

  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600">Loading live stats...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <div className="text-center py-8 text-red-600">
          <p>Failed to load live statistics</p>
        </div>
      </Card>
    );
  }

  const totalVotes = results.reduce((sum, result) => sum + result.vote_count, 0);
  const leadingCandidate = results[0];

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Live Vote Tracker</h3>
            {isActive && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live updates</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Auto-refreshing</p>
          <p className="text-sm font-medium text-gray-700">
            Every {isActive ? '30' : '300'} seconds
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Votes */}
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalVotes.toLocaleString()}</p>
          <p className="text-sm text-blue-700">Total Votes</p>
        </div>

        {/* Leading Candidate */}
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-lg font-bold text-green-900 line-clamp-1" title={leadingCandidate?.candidate_name}>
            {leadingCandidate?.candidate_name?.split(' ')[0] || 'No votes'}
          </p>
          <p className="text-sm text-green-700">Leading</p>
        </div>

        {/* Leading Percentage */}
        <div className="text-center p-4 bg-purple-50 rounded-xl">
          <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {leadingCandidate?.vote_percentage?.toFixed(1) || 0}%
          </p>
          <p className="text-sm text-purple-700">Lead Share</p>
        </div>

        {/* Performance Indicator */}
        <div className="text-center p-4 bg-orange-50 rounded-xl">
          <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Zap className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900">
            {results.length}
          </p>
          <p className="text-sm text-orange-700">Candidates</p>
        </div>
      </div>

      {/* Progress Indicators */}
      {totalVotes > 0 && leadingCandidate && (
        <div className="mt-6 space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Leading candidate share</span>
              <span className="font-medium">{leadingCandidate.vote_percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(leadingCandidate.vote_percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {isActive && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-800">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Voting is currently active</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Results update automatically as votes are cast
          </p>
        </div>
      )}
    </Card>
  );
};

export default OptimizedLiveVoteTracker;