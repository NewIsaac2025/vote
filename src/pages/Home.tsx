import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Vote, Shield, Zap, Users, ArrowRight, Trophy, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { getElectionStatus, formatDate } from '../lib/utils';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import HowItWorks from '../components/Home/HowItWorks';
import TechnologySection from '../components/Home/TechnologySection';
import RegistrationGuide from '../components/Home/RegistrationGuide';

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

// Cache for election results to improve performance
const electionsCache = new Map<string, { data: Election[]; timestamp: number }>();
const resultsCache = new Map<string, { data: ElectionResult[]; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute for home page

const Home: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [results, setResults] = useState<Record<string, ElectionResult[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing');

  const features = useMemo(() => [
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Every vote is secured with blockchain technology, ensuring transparency and preventing fraud.'
    },
    {
      icon: Users,
      title: 'One Student, One Vote',
      description: 'Advanced verification ensures each student can vote only once per election.'
    },
    {
      icon: Zap,
      title: 'Real-time Results',
      description: 'Watch election results update live as votes are cast throughout the voting period.'
    }
  ], []);

  const initializeConnection = useCallback(async () => {
    try {
      setConnectionStatus('testing');
      setError(null);
      setLoading(true);
      
      const isConnected = await testSupabaseConnection();
      
      if (isConnected) {
        setConnectionStatus('connected');
        await fetchElections();
      } else {
        setConnectionStatus('failed');
        setError('Unable to connect to the database. Please check your internet connection and try again.');
      }
    } catch (error) {
      console.error('Connection initialization error:', error);
      setConnectionStatus('failed');
      
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to initialize database connection. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchElections = useCallback(async () => {
    try {
      setError(null);
      
      // Check cache first
      const cached = electionsCache.get('active_elections');
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setElections(cached.data);
        await fetchResultsForElections(cached.data);
        return;
      }

      console.log('Fetching elections...');
      
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('id, title, description, start_date, end_date, is_active')
        .eq('is_active', true)
        .order('start_date', { ascending: false })
        .limit(3);

      if (electionsError) {
        console.error('Elections fetch error:', electionsError);
        throw new Error(`Failed to fetch elections: ${electionsError.message}`);
      }

      console.log('Elections fetched successfully:', electionsData);
      
      const elections = electionsData || [];
      setElections(elections);
      
      // Cache the elections
      electionsCache.set('active_elections', {
        data: elections,
        timestamp: Date.now()
      });

      // Fetch results for elections
      await fetchResultsForElections(elections);

    } catch (error) {
      console.error('Error fetching elections:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred while fetching elections.');
    }
  }, []);

  const fetchResultsForElections = useCallback(async (electionsToFetch: Election[]) => {
    if (electionsToFetch.length === 0) return;
    
    setLoadingResults(true);
    
    try {
      // Process elections in parallel but limit concurrency
      const resultsPromises = electionsToFetch.map(async (election) => {
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
        } catch (resultError) {
          console.warn(`Error fetching results for election ${election.id}:`, resultError);
          return { electionId: election.id, results: [] };
        }
      });

      const allResults = await Promise.all(resultsPromises);
      
      // Update results state
      const resultsMap: Record<string, ElectionResult[]> = {};
      allResults.forEach(({ electionId, results }) => {
        resultsMap[electionId] = results;
      });
      
      setResults(resultsMap);
    } catch (error) {
      console.error('Error fetching election results:', error);
    } finally {
      setLoadingResults(false);
    }
  }, []);

  const retryConnection = useCallback(() => {
    initializeConnection();
  }, [initializeConnection]);

  useEffect(() => {
    initializeConnection();
  }, [initializeConnection]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'active': return Clock;
      case 'upcoming': return CheckCircle;
      case 'ended': return Trophy;
      default: return Clock;
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center space-y-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                <Vote className="h-16 w-16 text-white mx-auto" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Secure. Transparent.
              <span className="block bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                One Student, One Vote.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Experience the future of democratic participation with our blockchain-powered voting system. 
              Your vote matters, and we ensure it's counted securely and transparently.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-xl">
                <Link to="/register">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-200">
                <Link to="/elections">
                  View Elections
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-blue-200 text-sm">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Blockchain Secured</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>University Verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Real-time Results</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose UniVote?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge technology to ensure fair, secure, and transparent elections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/90 border-white/20" hover>
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Guide Section */}
      <RegistrationGuide />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Live Elections Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Live Elections
            </h2>
            <p className="text-xl text-gray-600">
              Current and upcoming elections you can participate in
            </p>
          </div>

          {/* Connection Status */}
          {connectionStatus === 'testing' && (
            <div className="text-center mb-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Connecting to database...</p>
            </div>
          )}

          {connectionStatus === 'failed' && (
            <Card className="text-center py-8 mb-8 bg-red-50 border-red-200">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">Connection Failed</h3>
              <p className="text-red-700 mb-4 max-w-2xl mx-auto">{error}</p>
              <div className="space-y-2">
                <Button onClick={retryConnection} className="bg-red-600 hover:bg-red-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
                <p className="text-sm text-red-600">
                  If this persists, please check your Supabase configuration in the .env file
                </p>
              </div>
            </Card>
          )}

          {connectionStatus === 'connected' && (
            <>
              {loading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading elections...</p>
                </div>
              ) : error ? (
                <Card className="text-center py-8 bg-red-50 border-red-200">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Elections</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <Button onClick={retryConnection} className="bg-red-600 hover:bg-red-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </Card>
              ) : elections.length > 0 ? (
                <>
                  {/* Loading indicator for results */}
                  {loadingResults && (
                    <div className="mb-6 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-gray-600 text-sm">Loading results...</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {elections.map((election) => {
                      const status = getElectionStatus(election.start_date, election.end_date);
                      const StatusIcon = getStatusIcon(status);
                      const electionResults = results[election.id] || [];
                      const totalVotes = electionResults.reduce((sum, result) => sum + result.vote_count, 0);

                      return (
                        <Card key={election.id} className="hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/90 border-white/20" hover>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                            <Vote className="h-5 w-5 text-blue-600" />
                          </div>
                          
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{election.title}</h3>
                          <p className="text-gray-600 mb-4 line-clamp-2">{election.description}</p>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Start:</span>
                              <span className="text-gray-900">{formatDate(election.start_date)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">End:</span>
                              <span className="text-gray-900">{formatDate(election.end_date)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Total Votes:</span>
                              <span className="text-gray-900 font-medium">{totalVotes}</span>
                            </div>
                          </div>

                          {/* Only show leading candidate if election has ended */}
                          {electionResults.length > 0 && status === 'ended' && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Winner:</h4>
                              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-md border border-yellow-200">
                                <p className="font-medium text-yellow-900">{electionResults[0]?.candidate_name}</p>
                                <p className="text-sm text-yellow-700">{electionResults[0]?.department} • {electionResults[0]?.vote_count} votes</p>
                              </div>
                            </div>
                          )}

                          {/* Show current leader for active elections */}
                          {electionResults.length > 0 && status === 'active' && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Currently Leading:</h4>
                              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-md">
                                <p className="font-medium text-blue-900">{electionResults[0]?.candidate_name}</p>
                                <p className="text-sm text-blue-700">{electionResults[0]?.department} • {electionResults[0]?.vote_count} votes</p>
                              </div>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Button asChild size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                              <Link to={`/elections/${election.id}`}>
                                {status === 'active' ? 'Vote Now' : 'View Details'}
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/results/${election.id}`}>
                                Results
                              </Link>
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              ) : (
                <Card className="text-center py-12 backdrop-blur-sm bg-white/90 border-white/20">
                  <Vote className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Active Elections</h3>
                  <p className="text-gray-600">Check back soon for upcoming elections</p>
                </Card>
              )}

              {elections.length > 0 && (
                <div className="text-center mt-8">
                  <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Link to="/elections">
                      View All Elections
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Technology Section */}
      <TechnologySection />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Make Your Voice Heard?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students already participating in secure, transparent elections. Your vote matters, and we ensure it's counted.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200">
              <Link to="/register">
                Register Now
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-200">
              <Link to="/elections">
                Browse Elections
              </Link>
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-blue-200">Secure & Transparent</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">0</div>
              <div className="text-blue-200">Votes Lost or Altered</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-blue-200">System Availability</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;