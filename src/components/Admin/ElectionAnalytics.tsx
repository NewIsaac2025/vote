import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Download, Calendar, Award, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate, exportToCSV } from '../../lib/utils';
import Card from '../UI/Card';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';

interface ElectionAnalytics {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  total_votes: number;
  total_candidates: number;
  leading_candidate: string;
  leading_votes: number;
  leading_percentage: number;
  voter_turnout: number;
}

interface VoteTimeline {
  hour: string;
  vote_count: number;
  cumulative_votes: number;
}

const ElectionAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<ElectionAnalytics[]>([]);
  const [selectedElection, setSelectedElection] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<VoteTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchVoteTimeline(selectedElection);
    }
  }, [selectedElection]);

  const fetchAnalytics = async () => {
    try {
      // Fetch all elections
      const { data: elections, error: electionsError } = await supabase
        .from('elections')
        .select('*')
        .order('start_date', { ascending: false });

      if (electionsError) throw electionsError;

      // Fetch analytics for each election
      const analyticsPromises = elections?.map(async (election) => {
        const { data: stats, error: statsError } = await supabase
          .rpc('get_election_stats', { election_uuid: election.id });

        if (statsError) {
          console.error('Error fetching stats for election:', election.id, statsError);
          return {
            id: election.id,
            title: election.title,
            start_date: election.start_date,
            end_date: election.end_date,
            total_votes: 0,
            total_candidates: 0,
            leading_candidate: 'No data',
            leading_votes: 0,
            leading_percentage: 0,
            voter_turnout: 0
          };
        }

        const statsData = stats?.[0] || {};
        return {
          id: election.id,
          title: election.title,
          start_date: election.start_date,
          end_date: election.end_date,
          total_votes: statsData.total_votes || 0,
          total_candidates: statsData.total_candidates || 0,
          leading_candidate: statsData.leading_candidate_name || 'No votes yet',
          leading_votes: statsData.leading_candidate_votes || 0,
          leading_percentage: statsData.leading_candidate_percentage || 0,
          voter_turnout: statsData.voter_turnout_percentage || 0
        };
      }) || [];

      const analyticsData = await Promise.all(analyticsPromises);
      setAnalytics(analyticsData);

      // Select the first election by default
      if (analyticsData.length > 0) {
        setSelectedElection(analyticsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoteTimeline = async (electionId: string) => {
    try {
      // Fetch vote timeline data
      const { data: votes, error } = await supabase
        .from('votes')
        .select('voted_at')
        .eq('election_id', electionId)
        .order('voted_at');

      if (error) throw error;

      // Group votes by hour
      const hourlyVotes: Record<string, number> = {};
      votes?.forEach(vote => {
        const hour = new Date(vote.voted_at).toISOString().slice(0, 13) + ':00:00';
        hourlyVotes[hour] = (hourlyVotes[hour] || 0) + 1;
      });

      // Convert to timeline format
      const timelineData: VoteTimeline[] = [];
      let cumulativeVotes = 0;

      Object.entries(hourlyVotes)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([hour, count]) => {
          cumulativeVotes += count;
          timelineData.push({
            hour: new Date(hour).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric'
            }),
            vote_count: count,
            cumulative_votes: cumulativeVotes
          });
        });

      setTimeline(timelineData);
    } catch (error) {
      console.error('Error fetching vote timeline:', error);
    }
  };

  const handleExportAnalytics = () => {
    const exportData = analytics.map(election => ({
      election_title: election.title,
      start_date: formatDate(election.start_date),
      end_date: formatDate(election.end_date),
      total_votes: election.total_votes,
      total_candidates: election.total_candidates,
      leading_candidate: election.leading_candidate,
      leading_votes: election.leading_votes,
      leading_percentage: election.leading_percentage + '%',
      voter_turnout: election.voter_turnout + '%'
    }));

    exportToCSV(exportData, 'election_analytics.csv');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  const selectedElectionData = analytics.find(e => e.id === selectedElection);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Election Analytics</h2>
        <Button onClick={handleExportAnalytics} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.length}</p>
          <p className="text-sm text-gray-600">Total Elections</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.reduce((sum, e) => sum + e.total_votes, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Total Votes Cast</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.length > 0 
              ? (analytics.reduce((sum, e) => sum + e.voter_turnout, 0) / analytics.length).toFixed(1)
              : 0}%
          </p>
          <p className="text-sm text-gray-600">Avg. Turnout</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Award className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.reduce((sum, e) => sum + e.total_candidates, 0)}
          </p>
          <p className="text-sm text-gray-600">Total Candidates</p>
        </Card>
      </div>

      {/* Election Selector */}
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Election Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {analytics.map((election) => (
            <button
              key={election.id}
              onClick={() => setSelectedElection(election.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedElection === election.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <h4 className="font-medium text-gray-900 mb-1">{election.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{formatDate(election.start_date)}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{election.total_votes} votes</span>
                <span className="text-blue-600 font-medium">{election.voter_turnout.toFixed(1)}%</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Selected Election Details */}
      {selectedElectionData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Election Stats */}
          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedElectionData.title} - Statistics
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Duration</span>
                </div>
                <span className="font-medium text-gray-900">
                  {Math.ceil((new Date(selectedElectionData.end_date).getTime() - 
                             new Date(selectedElectionData.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Total Votes</span>
                </div>
                <span className="font-medium text-gray-900">
                  {selectedElectionData.total_votes.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Candidates</span>
                </div>
                <span className="font-medium text-gray-900">
                  {selectedElectionData.total_candidates}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Voter Turnout</span>
                </div>
                <span className="font-medium text-gray-900">
                  {selectedElectionData.voter_turnout.toFixed(1)}%
                </span>
              </div>

              {selectedElectionData.leading_candidate !== 'No votes yet' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Leading Candidate</h4>
                  <p className="text-green-800 font-semibold">{selectedElectionData.leading_candidate}</p>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-green-700">
                      {selectedElectionData.leading_votes} votes
                    </span>
                    <span className="text-green-700 font-medium">
                      {selectedElectionData.leading_percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Vote Timeline */}
          <Card className="backdrop-blur-sm bg-white/80 border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vote Timeline</h3>
            
            {timeline.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
                  <span>Time</span>
                  <span>Votes/Hour</span>
                  <span>Cumulative</span>
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {timeline.map((point, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 text-sm py-2 border-b border-gray-100">
                      <span className="text-gray-600">{point.hour}</span>
                      <span className="font-medium text-blue-600">{point.vote_count}</span>
                      <span className="font-medium text-gray-900">{point.cumulative_votes}</span>
                    </div>
                  ))}
                </div>
                
                {/* Simple visualization */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Voting Pattern</h4>
                  <div className="flex items-end space-x-1 h-20">
                    {timeline.slice(-12).map((point, index) => {
                      const maxVotes = Math.max(...timeline.map(p => p.vote_count));
                      const height = maxVotes > 0 ? (point.vote_count / maxVotes) * 100 : 0;
                      
                      return (
                        <div
                          key={index}
                          className="flex-1 bg-blue-500 rounded-t"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${point.hour}: ${point.vote_count} votes`}
                        ></div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Last 12 hours of voting activity
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No voting activity data available</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default ElectionAnalytics;