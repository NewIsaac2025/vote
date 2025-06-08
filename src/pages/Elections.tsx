import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Vote, Calendar, Users, Clock, Search, Filter, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getElectionStatus, formatDate } from '../lib/utils';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import LoadingSpinner from '../components/UI/LoadingSpinner';

interface Election {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface ElectionResult {
  candidate_id: string;
  candidate_name: string;
  department: string;
  course: string;
  vote_count: number;
}

const Elections: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [results, setResults] = useState<Record<string, ElectionResult[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const { data: electionsData, error } = await supabase
        .from('elections')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      setElections(electionsData || []);

      // Fetch results for each election in parallel
      if (electionsData && electionsData.length > 0) {
        const resultsPromises = electionsData.map(async (election) => {
          try {
            const { data: resultsData, error: resultsError } = await supabase
              .rpc('get_election_results', { election_uuid: election.id });

            if (!resultsError && resultsData) {
              return { electionId: election.id, results: resultsData };
            }
            return { electionId: election.id, results: [] };
          } catch (error) {
            console.error(`Error fetching results for election ${election.id}:`, error);
            return { electionId: election.id, results: [] };
          }
        });

        const allResults = await Promise.all(resultsPromises);
        const resultsMap: Record<string, ElectionResult[]> = {};
        
        allResults.forEach(({ electionId, results }) => {
          resultsMap[electionId] = results;
        });

        setResults(resultsMap);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredElections = elections.filter(election => {
    const matchesSearch = election.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         election.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    
    const status = getElectionStatus(election.start_date, election.end_date);
    return status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'upcoming': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'ended': return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Clock;
      case 'upcoming': return Calendar;
      case 'ended': return Vote;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative">
              <LoadingSpinner size="lg" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading elections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
              <Vote className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
            Elections
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Participate in democratic decision-making. Your voice matters.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
          <div className="flex-1">
            <Input
              icon={Search}
              placeholder="Search elections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="transition-all duration-200 focus:scale-[1.01]"
            />
          </div>
          <div className="flex space-x-2">
            {['all', 'active', 'upcoming', 'ended'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status as any)}
                className="capitalize transition-all duration-200 hover:scale-105"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Elections Grid */}
        {filteredElections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredElections.map((election) => {
              const status = getElectionStatus(election.start_date, election.end_date);
              const StatusIcon = getStatusIcon(status);
              const electionResults = results[election.id] || [];
              const totalVotes = electionResults.reduce((sum, result) => sum + result.vote_count, 0);
              const leadingCandidate = electionResults[0];

              return (
                <Card 
                  key={election.id} 
                  className="group hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm bg-white/90 border-white/20 overflow-hidden"
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    {status === 'active' && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium">Live</span>
                      </div>
                    )}
                  </div>

                  {/* Election Info */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {election.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {election.description}
                  </p>

                  {/* Stats */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Start
                      </span>
                      <span className="text-gray-900 font-medium">
                        {new Date(election.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        End
                      </span>
                      <span className="text-gray-900 font-medium">
                        {new Date(election.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Votes
                      </span>
                      <span className="text-gray-900 font-bold">
                        {totalVotes.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Leading Candidate */}
                  {leadingCandidate && totalVotes > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Leading</span>
                      </div>
                      <p className="font-bold text-blue-900 line-clamp-1">{leadingCandidate.candidate_name}</p>
                      <p className="text-sm text-blue-700">
                        {leadingCandidate.department} • {leadingCandidate.vote_count} votes
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button 
                      asChild 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    >
                      <Link to={`/elections/${election.id}`}>
                        {status === 'active' ? 'Vote Now' : 'View Details'}
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      className="transition-all duration-200 hover:scale-105"
                    >
                      <Link to={`/results/${election.id}`}>
                        Results
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-16 backdrop-blur-sm bg-white/90 border-white/20">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full blur-lg opacity-30"></div>
              <div className="relative bg-gradient-to-r from-gray-400 to-gray-500 p-4 rounded-2xl">
                {searchTerm || statusFilter !== 'all' ? (
                  <AlertCircle className="h-8 w-8 text-white" />
                ) : (
                  <Vote className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No elections found' : 'No elections available'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Check back soon for upcoming elections'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                variant="outline"
              >
                Clear filters
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default Elections;