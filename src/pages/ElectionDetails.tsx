import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Vote, Calendar, Clock, Users, ArrowLeft, CheckCircle, 
  AlertCircle, Wallet, Shield, TrendingUp, User, Award,
  ExternalLink, Play, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getElectionStatus, formatDate } from '../lib/utils';
import { connectWallet, generateVoteHash } from '../lib/blockchain';
import { sendEmail, generateVoteConfirmationEmail } from '../lib/email';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import CandidateCard from '../components/Elections/CandidateCard';
import LiveVoteTracker from '../components/Elections/LiveVoteTracker';
import VoteConfirmationModal from '../components/UI/VoteConfirmationModal';

interface Election {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  department: string;
  course: string;
  year_of_study: number;
  manifesto: string;
  image_url: string;
  video_url: string;
}

interface ElectionResult {
  candidate_id: string;
  candidate_name: string;
  department: string;
  course: string;
  year_of_study: number;
  image_url: string;
  vote_count: number;
  vote_percentage: number;
}

const ElectionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, student } = useAuth();
  
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<ElectionResult[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [candidateToVote, setCandidateToVote] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchElectionData();
      if (user && student) {
        checkVotingStatus();
      }
    }
  }, [id, user, student]);

  const fetchElectionData = async () => {
    try {
      // Fetch election details
      const { data: electionData, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', id)
        .single();

      if (electionError) throw electionError;
      setElection(electionData);

      // Fetch candidates
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('election_id', id)
        .order('full_name');

      if (candidatesError) throw candidatesError;
      setCandidates(candidatesData || []);

      // Fetch results using the new function
      const { data: resultsData, error: resultsError } = await supabase
        .rpc('get_election_results', { election_uuid: id });

      if (!resultsError && resultsData) {
        setResults(resultsData);
      }
    } catch (error) {
      console.error('Error fetching election data:', error);
      setError('Failed to load election details');
    } finally {
      setLoading(false);
    }
  };

  const checkVotingStatus = async () => {
    if (!user || !student || !id) return;

    try {
      const { data, error } = await supabase
        .rpc('check_student_vote_status', { 
          student_uuid: student.id, 
          election_uuid: id 
        });

      if (!error && data && data.length > 0) {
        setHasVoted(data[0].has_voted);
      }
    } catch (error) {
      console.error('Error checking voting status:', error);
    }
  };

  const handleCandidateVote = async (candidateId: string) => {
    // Prevent multiple simultaneous voting attempts
    if (!student || !election || hasVoted || voting) {
      return;
    }

    const status = getElectionStatus(election.start_date, election.end_date);
    if (status !== 'active') {
      setError('Voting is not currently active for this election');
      return;
    }

    if (!student.verified) {
      setError('Please verify your account to vote');
      return;
    }

    // Show confirmation modal instead of browser confirm
    setCandidateToVote(candidateId);
    setShowVoteModal(true);
  };

  const handleVoteConfirm = async () => {
    if (!candidateToVote || !student || !election) {
      return;
    }

    setVoting(true);
    setError('');
    setSuccess('');
    setShowVoteModal(false);

    try {
      // Check if user has already voted
      const { data: existingVote, error: checkError } = await supabase
        .from('votes')
        .select('id')
        .eq('student_id', student.id)
        .eq('election_id', election.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing vote:', checkError);
        throw new Error('Failed to verify voting eligibility');
      }

      if (existingVote) {
        setError('You have already voted in this election');
        setHasVoted(true);
        return;
      }

      // Connect wallet if not already connected
      let walletAddress = student.wallet_address;
      
      if (!walletAddress) {
        const wallet = await connectWallet();
        if (!wallet) {
          setError('Please connect your MetaMask wallet to vote');
          return;
        }
        walletAddress = wallet.address;
        
        // Update student record with wallet address
        const { error: updateError } = await supabase
          .from('students')
          .update({ wallet_address: walletAddress })
          .eq('id', student.id);

        if (updateError) {
          console.error('Error updating wallet address:', updateError);
        }
      }

      // Generate vote hash for blockchain security
      const voteHash = generateVoteHash(
        student.id,
        candidateToVote,
        election.id,
        walletAddress
      );

      // Submit vote to database
      const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .insert({
          student_id: student.id,
          candidate_id: candidateToVote,
          election_id: election.id,
          wallet_address: walletAddress,
          vote_hash: voteHash
        })
        .select()
        .single();

      if (voteError) {
        console.error('Vote submission error:', voteError);
        
        // Handle specific error cases
        if (voteError.code === '23505') { // Unique constraint violation
          setError('You have already voted in this election');
          setHasVoted(true);
        } else {
          setError('Failed to record your vote. Please try again.');
        }
        return;
      }

      // Get candidate name for confirmation
      const selectedCandidateData = candidates.find(c => c.id === candidateToVote);
      const candidateNameForEmail = selectedCandidateData?.full_name || 'Unknown Candidate';

      // Send confirmation email
      try {
        await sendEmail({
          to: student.email,
          subject: `Vote Confirmation - ${election.title}`,
          html: generateVoteConfirmationEmail(student.full_name, candidateNameForEmail, election.title)
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the vote if email fails
      }

      // Update local state
      setHasVoted(true);
      setSuccess(`🎉 Vote successfully cast for ${candidateNameForEmail}! Thank you for participating in the democratic process.`);
      
      // Refresh results
      await fetchElectionData();
      
    } catch (error: any) {
      console.error('Voting error:', error);
      setError(error.message || 'Failed to cast vote. Please try again.');
    } finally {
      setVoting(false);
      setCandidateToVote(null);
    }
  };

  const handleVoteCancel = () => {
    setShowVoteModal(false);
    setCandidateToVote(null);
  };

  const handleCandidateSelect = (candidateId: string) => {
    if (!hasVoted && !voting) {
      setSelectedCandidate(candidateId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Loading election details...</p>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Election not found</h3>
          <p className="text-gray-600 mb-6">The election you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/elections')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Elections
          </Button>
        </Card>
      </div>
    );
  }

  const status = getElectionStatus(election.start_date, election.end_date);
  const totalVotes = results.reduce((sum, result) => sum + result.vote_count, 0);
  const canVote = status === 'active' && user && student?.verified && !hasVoted && !voting;
  const isActiveElection = status === 'active';

  // Get candidate details for the modal
  const candidateForModal = candidateToVote ? candidates.find(c => c.id === candidateToVote) : null;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/elections')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Elections
          </Button>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                status === 'active' ? 'bg-green-500' : 
                status === 'upcoming' ? 'bg-blue-500' : 'bg-gray-500'
              }`}>
                <Clock className="h-3 w-3 mr-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              {status === 'active' && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live Voting</span>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{election.title}</h1>
            <p className="text-blue-100 text-lg mb-6">{election.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-blue-200" />
                <div>
                  <p className="text-blue-200 text-sm">Starts</p>
                  <p className="font-medium">{formatDate(election.start_date)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-200" />
                <div>
                  <p className="text-blue-200 text-sm">Ends</p>
                  <p className="font-medium">{formatDate(election.end_date)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-200" />
                <div>
                  <p className="text-blue-200 text-sm">Total Votes</p>
                  <p className="font-medium">{totalVotes.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Vote Tracker */}
        {(status === 'active' || totalVotes > 0) && (
          <div className="mb-8">
            <LiveVoteTracker electionId={election.id} isActive={status === 'active'} />
          </div>
        )}

        {/* Success Message */}
        {success && (
          <Card className="mb-8 bg-green-50 border-green-200">
            <div className="flex items-center space-x-3 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">{success}</p>
            </div>
          </Card>
        )}

        {/* Voting Status */}
        {user && (
          <Card className="mb-8 backdrop-blur-sm bg-white/80 border-white/20">
            {hasVoted ? (
              <div className="flex items-center space-x-3 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <div>
                  <p className="font-medium">Vote Recorded ✅</p>
                  <p className="text-sm text-gray-600">Thank you for participating in this election</p>
                </div>
              </div>
            ) : canVote ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Vote className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Ready to Vote</p>
                    <p className="text-sm text-gray-600">Click "Cast Your Vote" on any candidate below to vote instantly</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-green-600">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Blockchain Secured</span>
                </div>
              </div>
            ) : voting ? (
              <div className="flex items-center space-x-3 text-blue-600">
                <LoadingSpinner size="sm" />
                <div>
                  <p className="font-medium">Processing Vote...</p>
                  <p className="text-sm text-gray-600">Please wait while we record your vote securely on the blockchain</p>
                </div>
              </div>
            ) : !user ? (
              <div className="flex items-center space-x-3 text-amber-600">
                <AlertCircle className="h-6 w-6" />
                <div>
                  <p className="font-medium">Sign in Required</p>
                  <p className="text-sm text-gray-600">Please sign in to participate in voting</p>
                </div>
              </div>
            ) : status !== 'active' ? (
              <div className="flex items-center space-x-3 text-gray-600">
                <Clock className="h-6 w-6" />
                <div>
                  <p className="font-medium">Voting {status === 'upcoming' ? 'Not Started' : 'Ended'}</p>
                  <p className="text-sm text-gray-600">
                    {status === 'upcoming' ? 'Voting will begin soon' : 'This election has concluded'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-amber-600">
                <AlertCircle className="h-6 w-6" />
                <div>
                  <p className="font-medium">Verification Required</p>
                  <p className="text-sm text-gray-600">Please verify your account to vote</p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-8 bg-red-50 border-red-200">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </Card>
        )}

        {/* Voting Instructions for Active Elections */}
        {isActiveElection && canVote && !hasVoted && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-3 text-blue-800">
              <Vote className="h-5 w-5" />
              <div>
                <p className="font-medium">How to Vote</p>
                <p className="text-sm">Click the "Cast Your Vote" button on your preferred candidate. You'll see a confirmation modal before your vote is recorded on the blockchain.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Candidates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {candidates.map((candidate, index) => {
            const candidateResult = results.find(r => r.candidate_id === candidate.id);
            const isSelected = selectedCandidate === candidate.id;
            const rank = results.findIndex(r => r.candidate_id === candidate.id) + 1;

            return (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                result={candidateResult ? {
                  vote_count: candidateResult.vote_count,
                  vote_percentage: candidateResult.vote_percentage
                } : undefined}
                isSelected={isSelected}
                canVote={canVote}
                showResults={status !== 'upcoming'}
                rank={candidateResult ? rank : undefined}
                isActiveElection={isActiveElection}
                onSelect={handleCandidateSelect}
                onVote={handleCandidateVote}
                isVoting={voting}
              />
            );
          })}
        </div>

        {/* Vote Confirmation Modal */}
        {candidateForModal && (
          <VoteConfirmationModal
            isOpen={showVoteModal}
            candidateName={candidateForModal.full_name}
            candidateDepartment={candidateForModal.department}
            candidateCourse={candidateForModal.course}
            electionTitle={election.title}
            onConfirm={handleVoteConfirm}
            onCancel={handleVoteCancel}
            isLoading={voting}
          />
        )}
      </div>
    </div>
  );
};

export default ElectionDetails;