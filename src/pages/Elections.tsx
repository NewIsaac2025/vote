import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Vote, Calendar, Users, Clock, Search, Filter, Sparkles, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
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

// Cache for election results to avoid repeated API calls
const resultsCache = new Map<string, { data: ElectionResult[]; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

const Elections: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [results, setResults] = useState<Record<string, ElectionResult[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');
  const [error, setError] = useState<string | null>(null);

  // Memoized filtered elections for better performance
  const filteredElections = useMemo(() => {
    return elections.filter(election => {
      const matchesSearch = election.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           election.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      
      const status = getElectionStatus(election.start_date, election.end_date);
      return status === statusFilter;
    });
  }, [elections, searchTerm, statusFilter]);

  const fetchElections = useCallback(async () => {
    try {
      setError(null);
      
      const { data: electionsData, error } = await supabase
        .from('elections')
        .select('id, title, description, start_date, end_date, is_active')
        .order('start_date', { ascending: false });

      if (error) throw error;

      setElections(electionsData || []);
      
      // Fetch results for visible elections only (first 6 for initial load)
      const visibleElections = (electionsData || []).slice(0, 6);
      await fetchResultsForElections(visibleElections);
      
    } catch (error) {
      console.error('Error fetching elections:', error);
      setError('Failed to load elections. Please try again.');
    }
  }, []);

  const fetchResultsForElections = useCallback(async (electionsToFetch: Election[]) => {
    if (electionsToFetch.length === 0) return;
    
    setLoadingResults(true);
    
    try {
      // Process elections in batches for better performance
      const batchSize = 3;
      const batches = [];
      
      for (let i = 0; i < electionsToFetch.length; i += batchSize) {
        batches.push(electionsToFetch.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const resultsPromises = batch.map(async (election) => {
          // Check cache first
          const cached = resultsCache.get(election.id);
          if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return { electionId: election.id, results: cached.data };
          }

          try {
            const { data: resultsData, error: resultsError } = await supabase
              .rpc('get_election_results', { election_uuid: election.id });

            if (resultsError) {
              console.warn(`Failed to fetch results for election ${election.id}:`, resultsError);
              return { electionId: election.id, results: [] };
            }

            const results = resultsData || [];
            
            // Cache the results
            resultsCache.set(election.id, {
              data: results,
              timestamp: Date.now()
            });

            return { electionId: election.id, results };
          } catch (error) {
            console.warn(`Error fetching results for election ${election.id}:`, error);
            return { electionId: election.id, results: [] };
          }
        });

        const batchResults = await Promise.all(resultsPromises);
        
        // Update results state with batch
        setResults(prev => {
          const newResults = { ...prev };
          batchResults.forEach(({ electionId, results }) => {
            newResults[electionId] = results;
          });
          return newResults;
        });
      }
    } catch (error) {
      console.error('Error fetching election results:', error);
    } finally {
      setLoadingResults(false);
    }
  }, []);

  const retryLoad = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchElections().finally(() => setLoading(false));
  }, [fetchElections]);

  useEffect(() => {
    fetchElections().finally(() => setLoading(false));
  }, [fetchElections]);

  // Lazy load results for elections that come into view
  useEffect(() => {
    if (filteredElections.length > 6) {
      const remainingElections = filteredElections.slice(6);
      const electionsWithoutResults = remainingElections.filter(
        election => !results[election.id] && !resultsCache.has(election.id)
      );
      
      if (electionsWithoutResults.length > 0) {
        // Debounce the loading to avoid too many requests
        const timeoutId = setTimeout(() => {
          fetchResultsForElections(electionsWithoutResults);
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [filteredElections, results, fetchResultsForElections]);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center py-12 bg-red-50 border-red-200 max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-900 mb-2">Failed to Load Elections</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <Button onClick={retryLoad} className="bg-red-600 hover:bg-red-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </Card>
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

        {/* Loading indicator for results */}
        {loadingResults && (
          <div className="mb-4 flex items-center justify-center">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-gray-600 text-sm">Loading results...</span>
          </div>
        )}

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