import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  TrendingUp, Users, Award, BarChart3, PieChart, 
  Download, Share2, Calendar, Clock, Vote,
  Trophy, Medal, Target, RefreshCw, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate, exportToCSV, getElectionStatus } from '../lib/utils';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
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
  vote_percentage: number;
}

interface Candidate {
  id: string;
  full_name: string;
  department: string;
  course: string;
  year_of_study: number;
  image_url: string;
}

// Cache for results to improve performance
const resultsCache = new Map<string, { 
  results: ElectionResult[]; 
  candidates: Candidate[]; 
  timestamp: number 
}>();
const CACHE_DURATION = 30000; // 30 seconds

const Results: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ElectionResult[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized calculations for better performance
  const totalVotes = useMemo(() => 
    results.reduce((sum, result) => sum + result.vote_count, 0), 
    [results]
  );
  
  const winner = useMemo(() => results[0], [results]);

  // Check if election has ended
  const electionStatus = useMemo(() => 
    selectedElection ? getElectionStatus(selectedElection.start_date, selectedElection.end_date) : 'upcoming',
    [selectedElection]
  );

  // Only show winner if election has ended and there are votes
  const shouldShowWinner = useMemo(() => 
    electionStatus === 'ended' && winner && totalVotes > 0,
    [electionStatus, winner, totalVotes]
  );

  const fetchElections = useCallback(async () => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('elections')
        .select('id, title, description, start_date, end_date, is_active')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setElections(data || []);
      
      return data || [];
    } catch (error) {
      console.error('Error fetching elections:', error);
      setError('Failed to load elections. Please try again.');
      return [];
    }
  }, []);

  const fetchElectionResults = useCallback(async (electionId: string) => {
    // Check cache first
    const cached = resultsCache.get(electionId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setResults(cached.results);
      setCandidates(cached.candidates);
      return;
    }

    setLoadingResults(true);
    
    try {
      // Fetch results and candidates in parallel for better performance
      const [resultsResponse, candidatesResponse] = await Promise.all([
        supabase.rpc('get_election_results', { election_uuid: electionId }),
        supabase
          .from('candidates')
          .select('id, full_name, department, course, year_of_study, image_url')
          .eq('election_id', electionId)
      ]);

      if (resultsResponse.error) throw resultsResponse.error;
      if (candidatesResponse.error) throw candidatesResponse.error;

      const resultsData = resultsResponse.data || [];
      const candidatesData = candidatesResponse.data || [];

      // Cache the results
      resultsCache.set(electionId, {
        results: resultsData,
        candidates: candidatesData,
        timestamp: Date.now()
      });

      setResults(resultsData);
      setCandidates(candidatesData);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to load election results. Please try again.');
    } finally {
      setLoadingResults(false);
    }
  }, []);

  const handleElectionSelect = useCallback((election: Election) => {
    setSelectedElection(election);
    fetchElectionResults(election.id);
  }, [fetchElectionResults]);

  const retryLoad = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const electionsData = await fetchElections();
      
      if (id) {
        const election = electionsData.find(e => e.id === id);
        if (election) {
          setSelectedElection(election);
          await fetchElectionResults(id);
        }
      } else if (electionsData.length > 0) {
        const mostRecent = electionsData[0];
        setSelectedElection(mostRecent);
        await fetchElectionResults(mostRecent.id);
      }
    } catch (error) {
      console.error('Error during retry:', error);
    } finally {
      setLoading(false);
    }
  }, [id, fetchElections, fetchElectionResults]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const electionsData = await fetchElections();
        
        if (id) {
          const election = electionsData.find(e => e.id === id);
          if (election) {
            setSelectedElection(election);
            await fetchElectionResults(id);
          }
        } else if (electionsData.length > 0) {
          const mostRecent = electionsData[0];
          setSelectedElection(mostRecent);
          await fetchElectionResults(mostRecent.id);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [id, fetchElections, fetchElectionResults]);

  const handleExportResults = useCallback(() => {
    if (!selectedElection || !results.length) return;

    const exportData = results.map((result, index) => ({
      rank: index + 1,
      candidate_name: result.candidate_name,
      department: result.department,
      course: result.course,
      vote_count: result.vote_count,
      percentage: result.vote_percentage.toFixed(2) + '%'
    }));

    exportToCSV(exportData, `${selectedElection.title}_results.csv`);
  }, [selectedElection, results]);

  const handleShare = useCallback(async () => {
    if (!selectedElection) return;

    const shareData = {
      title: `${selectedElection.title} - Election Results`,
      text: `Check out the results for ${selectedElection.title}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  }, [selectedElection]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative">
              <LoadingSpinner size="lg" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center py-12 bg-red-50 border-red-200 max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-900 mb-2">Failed to Load Results</h3>
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
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-2xl">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-yellow-900 to-orange-900 bg-clip-text text-transparent mb-4">
            Election Results
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transparent, real-time results powered by blockchain technology
          </p>
        </div>

        {/* Election Selector */}
        {elections.length > 1 && (
          <Card className="mb-8 backdrop-blur-sm bg-white/80 border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Election</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {elections.map((election) => (
                <button
                  key={election.id}
                  onClick={() => handleElectionSelect(election)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                    selectedElection?.id === election.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h4 className="font-medium text-gray-900 mb-1">{election.title}</h4>
                  <p className="text-sm text-gray-600">{formatDate(election.start_date)}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getElectionStatus(election.start_date, election.end_date) === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : getElectionStatus(election.start_date, election.end_date) === 'upcoming'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getElectionStatus(election.start_date, election.end_date)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {selectedElection && (
          <>
            {/* Election Info */}
            <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white backdrop-blur-sm border-white/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">{selectedElection.title}</h2>
                  <p className="text-blue-100 mb-4">{selectedElection.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Started: {formatDate(selectedElection.start_date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {electionStatus === 'ended' ? 'Ended' : 'Ends'}: {formatDate(selectedElection.end_date)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{totalVotes.toLocaleString()} total votes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        electionStatus === 'active' 
                          ? 'bg-green-500 text-white'
                          : electionStatus === 'upcoming'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {electionStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleExportResults}
                    className="border-white text-white hover:bg-white hover:text-blue-600"
                    disabled={!results.length}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>

            {/* Loading indicator for results */}
            {loadingResults && (
              <div className="mb-8 flex items-center justify-center">
                <LoadingSpinner size="md" />
                <span className="ml-3 text-gray-600">Loading results...</span>
              </div>
            )}

            {/* Winner Announcement - Only show if election has ended */}
            {shouldShowWinner && !loadingResults && (
              <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 backdrop-blur-sm">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-yellow-400 to-orange-400 p-3 rounded-full">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">🎉 Winner Announced!</h3>
                  <p className="text-xl font-semibold text-yellow-800 mb-1">{winner.candidate_name}</p>
                  <p className="text-yellow-700">{winner.department} • {winner.course}</p>
                  <div className="mt-4 flex items-center justify-center space-x-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-800">{winner.vote_count}</p>
                      <p className="text-sm text-yellow-600">Votes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-800">
                        {winner.vote_percentage.toFixed(1)}%
                      </p>
                      <p className="text-sm text-yellow-600">of Total</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Election Status Notice for Active/Upcoming Elections */}
            {electionStatus !== 'ended' && totalVotes > 0 && !loadingResults && (
              <Card className="mb-8 bg-blue-50 border-blue-200 backdrop-blur-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-blue-800 mb-2">
                    <Clock className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">
                      {electionStatus === 'active' ? 'Voting in Progress' : 'Voting Not Started'}
                    </h3>
                  </div>
                  <p className="text-blue-700">
                    {electionStatus === 'active' 
                      ? 'Results are being updated in real-time. The winner will be announced when voting ends.'
                      : 'Voting has not started yet. Results will be available once voting begins.'
                    }
                  </p>
                  {electionStatus === 'active' && (
                    <p className="text-sm text-blue-600 mt-2">
                      Voting ends: {formatDate(selectedElection.end_date)}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Results */}
            {!loadingResults && (
              <>
                {results.length > 0 ? (
                  <div className="space-y-6">
                    {results.map((result, index) => {
                      const candidate = candidates.find(c => c.id === result.candidate_id);
                      const isWinner = index === 0 && shouldShowWinner;

                      return (
                        <Card 
                          key={result.candidate_id}
                          className={`transition-all duration-300 backdrop-blur-sm bg-white/80 border-white/20 ${
                            isWinner ? 'ring-2 ring-yellow-400 shadow-xl' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            {/* Rank - Only show final ranks if election has ended */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                              electionStatus === 'ended' && index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                              electionStatus === 'ended' && index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                              electionStatus === 'ended' && index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {electionStatus === 'ended' && index === 0 ? <Trophy className="h-6 w-6" /> :
                               electionStatus === 'ended' && index === 1 ? <Medal className="h-6 w-6" /> :
                               electionStatus === 'ended' && index === 2 ? <Target className="h-6 w-6" /> :
                               index + 1}
                            </div>

                            {/* Candidate Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                {candidate?.image_url ? (
                                  <img
                                    src={candidate.image_url}
                                    alt={result.candidate_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                      {result.candidate_name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{result.candidate_name}</h3>
                                  <p className="text-sm text-gray-600">{result.department} • {result.course}</p>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-600">Vote Share</span>
                                  <span className="text-sm font-medium text-gray-900">{result.vote_percentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div 
                                    className={`h-3 rounded-full transition-all duration-1000 ${
                                      isWinner 
                                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                    }`}
                                    style={{ width: `${Math.min(result.vote_percentage, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* Vote Count */}
                            <div className="text-right">
                              <div className="flex items-center space-x-1 text-gray-600 mb-1">
                                <Vote className="h-4 w-4" />
                                <span className="text-sm">Votes</span>
                              </div>
                              <p className="text-2xl font-bold text-gray-900">{result.vote_count.toLocaleString()}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="text-center py-16 backdrop-blur-sm bg-white/80 border-white/20">
                    <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Results Yet</h3>
                    <p className="text-gray-600">Results will appear here once voting begins</p>
                  </Card>
                )}
              </>
            )}

            {/* Statistics */}
            {totalVotes > 0 && !loadingResults && (
              <Card className="mt-8 backdrop-blur-sm bg-white/80 border-white/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Election Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalVotes.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Votes</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
                    <p className="text-sm text-gray-600">Candidates</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {winner ? winner.vote_percentage.toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {electionStatus === 'ended' ? 'Winning Margin' : 'Leading Margin'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <PieChart className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">100%</p>
                    <p className="text-sm text-gray-600">Transparency</p>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Results;