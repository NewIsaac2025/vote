import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Clock, Zap, BarChart3, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Card from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';

interface LiveStats {
  totalVotes: number;
  leadingCandidate: string;
  leadingVotes: number;
  leadingPercentage: number;
  voterTurnout: number;
}

interface LiveVoteTrackerProps {
  electionId: string;
  isActive: boolean;
}

const LiveVoteTracker: React.FC<LiveVoteTrackerProps> = ({ electionId, isActive }) => {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchStats();
    
    if (isActive) {
      // Set up real-time subscription for live updates
      const subscription = supabase
        .channel(`election-${electionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'votes',
            filter: `election_id=eq.${electionId}`
          },
          () => {
            fetchStats();
          }
        )
        .subscribe();

      // Also poll every 30 seconds as backup
      const interval = setInterval(fetchStats, 30000);

      return () => {
        subscription.unsubscribe();
        clearInterval(interval);
      };
    }
  }, [electionId, isActive]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_election_stats', { election_uuid: electionId });

      if (error) throw error;

      if (data && data.length > 0) {
        const statsData = data[0];
        setStats({
          totalVotes: statsData.total_votes || 0,
          leadingCandidate: statsData.leading_candidate_name || 'No votes yet',
          leadingVotes: statsData.leading_candidate_votes || 0,
          leadingPercentage: statsData.leading_candidate_percentage || 0,
          voterTurnout: statsData.voter_turnout_percentage || 0
        });
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching live stats:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!stats) {
    return null;
  }

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
          <p className="text-xs text-gray-500">Last updated</p>
          <p className="text-sm font-medium text-gray-700">
            {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Votes */}
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.totalVotes.toLocaleString()}</p>
          <p className="text-sm text-blue-700">Total Votes</p>
        </div>

        {/* Leading Candidate */}
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-lg font-bold text-green-900 line-clamp-1" title={stats.leadingCandidate}>
            {stats.leadingCandidate.split(' ')[0]}
          </p>
          <p className="text-sm text-green-700">Leading</p>
        </div>

        {/* Leading Percentage */}
        <div className="text-center p-4 bg-purple-50 rounded-xl">
          <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.leadingPercentage.toFixed(1)}%</p>
          <p className="text-sm text-purple-700">Lead Share</p>
        </div>

        {/* Voter Turnout */}
        <div className="text-center p-4 bg-orange-50 rounded-xl">
          <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Zap className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900">{stats.voterTurnout.toFixed(1)}%</p>
          <p className="text-sm text-orange-700">Turnout</p>
        </div>
      </div>

      {/* Progress Indicators */}
      {stats.totalVotes > 0 && (
        <div className="mt-6 space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Leading candidate share</span>
              <span className="font-medium">{stats.leadingPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(stats.leadingPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Voter turnout</span>
              <span className="font-medium">{stats.voterTurnout.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(stats.voterTurnout, 100)}%` }}
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

export default LiveVoteTracker;