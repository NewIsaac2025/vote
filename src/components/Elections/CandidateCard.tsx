import React, { useState } from 'react';
import { User, Mail, GraduationCap, FileText, Play, ExternalLink, Award, CheckCircle, TrendingUp, Vote } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';

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

interface CandidateResult {
  vote_count: number;
  vote_percentage: number;
}

interface CandidateCardProps {
  candidate: Candidate;
  result?: CandidateResult;
  isSelected?: boolean;
  canVote?: boolean;
  showResults?: boolean;
  rank?: number;
  isActiveElection?: boolean;
  onSelect?: (candidateId: string) => void;
  onVote?: (candidateId: string) => void;
  isVoting?: boolean;
  electionStatus?: 'upcoming' | 'active' | 'ended';
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  result,
  isSelected = false,
  canVote = false,
  showResults = false,
  rank,
  isActiveElection = false,
  onSelect,
  onVote,
  isVoting = false,
  electionStatus = 'upcoming'
}) => {
  const [showFullManifesto, setShowFullManifesto] = useState(false);

  const handleCardClick = () => {
    if (canVote && onSelect && !isVoting) {
      onSelect(candidate.id);
    }
  };

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onVote && !isVoting) {
      onVote(candidate.id);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-orange-400';
      case 2: return 'from-gray-300 to-gray-400';
      case 3: return 'from-orange-300 to-orange-400';
      default: return 'from-blue-500 to-purple-500';
    }
  };

  // Safely get vote percentage with fallback
  const votePercentage = result?.vote_percentage ?? 0;
  const voteCount = result?.vote_count ?? 0;

  // Only show winner if election has ended and there are votes
  const showWinner = electionStatus === 'ended' && rank === 1 && voteCount > 0;

  return (
    <Card 
      className={`transition-all duration-300 backdrop-blur-sm bg-white/90 border-white/20 ${
        isSelected 
          ? 'ring-2 ring-blue-500 shadow-xl scale-[1.02]' 
          : canVote 
            ? 'hover:shadow-xl hover:scale-[1.01] cursor-pointer' 
            : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Header with rank and selection indicator */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Profile Image */}
          <div className="relative">
            {candidate.image_url ? (
              <img
                src={candidate.image_url}
                alt={candidate.full_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-16 h-16 bg-gradient-to-r ${getRankColor(rank || 0)} rounded-full flex items-center justify-center ${candidate.image_url ? 'hidden' : ''}`}>
              <User className="h-8 w-8 text-white" />
            </div>
            
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          {/* Basic Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{candidate.full_name}</h3>
            <p className="text-blue-600 font-medium">{candidate.department}</p>
            <p className="text-gray-600 text-sm">{candidate.course} • Year {candidate.year_of_study}</p>
          </div>
        </div>

        {/* Rank and Results - Only show if election has ended */}
        <div className="text-right">
          {showResults && rank && electionStatus === 'ended' && (
            <div className="mb-2">
              <span className="text-2xl">{getRankIcon(rank)}</span>
            </div>
          )}
          {result && showResults && (
            <div>
              <div className="flex items-center space-x-1 text-gray-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{voteCount} votes</span>
              </div>
              <div className="text-lg font-bold text-blue-600">{votePercentage.toFixed(1)}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Vote Progress Bar - Only show if election has ended */}
      {showResults && result && voteCount > 0 && electionStatus === 'ended' && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`bg-gradient-to-r ${getRankColor(rank || 0)} h-2 rounded-full transition-all duration-1000`}
              style={{ width: `${Math.min(votePercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Contact Information */}
      {candidate.email && (
        <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          <span>{candidate.email}</span>
        </div>
      )}

      {/* Manifesto */}
      {candidate.manifesto && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            Campaign Manifesto
          </h4>
          <div className="text-gray-600 text-sm">
            {showFullManifesto ? (
              <div>
                <p className="whitespace-pre-wrap">{candidate.manifesto}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullManifesto(false);
                  }}
                  className="text-blue-600 hover:text-blue-700 mt-2 text-sm font-medium"
                >
                  Show less
                </button>
              </div>
            ) : (
              <div>
                <p className="line-clamp-3">{candidate.manifesto}</p>
                {candidate.manifesto.length > 150 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFullManifesto(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 mt-2 text-sm font-medium"
                  >
                    Read more
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Links */}
      <div className="flex space-x-2 mb-4">
        {candidate.video_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(candidate.video_url, '_blank');
            }}
          >
            <Play className="h-4 w-4 mr-1" />
            Campaign Video
          </Button>
        )}
        {candidate.email && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`mailto:${candidate.email}`, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Contact
          </Button>
        )}
      </div>

      {/* Cast Vote Button - Only show on active elections */}
      {isActiveElection && canVote && (
        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={handleVoteClick}
            disabled={isVoting}
            loading={isVoting}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200"
            size="lg"
          >
            <Vote className="h-5 w-5 mr-2" />
            {isVoting ? 'Casting Vote...' : 'Cast Your Vote'}
          </Button>
        </div>
      )}

      {/* Selection Indicator for non-active elections */}
      {!isActiveElection && canVote && (
        <div className="pt-4 border-t border-gray-200">
          <div className={`text-center text-sm font-medium transition-colors ${
            isSelected ? 'text-blue-600' : 'text-gray-400'
          }`}>
            {isSelected ? '✓ Selected for voting' : 'Click to select'}
          </div>
        </div>
      )}

      {/* Winner Badge - Only show when election has ended */}
      {showWinner && (
        <div className="absolute top-4 left-4">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
            <Award className="h-3 w-3" />
            <span>Winner</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CandidateCard;