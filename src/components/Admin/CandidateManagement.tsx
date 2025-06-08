import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Search, Filter, Edit3, Trash2, Plus, 
  User, Mail, GraduationCap, Calendar, Image as ImageIcon,
  Award, Target, TrendingUp, Eye, Save, X, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import LoadingSpinner from '../UI/LoadingSpinner';
import ImageUpload from '../UI/ImageUpload';

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
  election_id: string;
  election_title: string;
  created_at: string;
  vote_count?: number;
}

interface Election {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

const CandidateManagement: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElection, setSelectedElection] = useState<string>('all');
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      
      // Fetch elections and candidates in parallel for better performance
      const [electionsResponse, candidatesResponse] = await Promise.all([
        supabase
          .from('elections')
          .select('id, title, start_date, end_date')
          .order('start_date', { ascending: false }),
        
        supabase
          .from('candidates')
          .select(`
            id,
            full_name,
            email,
            department,
            course,
            year_of_study,
            manifesto,
            image_url,
            video_url,
            election_id,
            created_at,
            elections!inner(title)
          `)
          .order('created_at', { ascending: false })
      ]);

      if (electionsResponse.error) throw electionsResponse.error;
      if (candidatesResponse.error) throw candidatesResponse.error;

      setElections(electionsResponse.data || []);

      // Process candidates data more efficiently
      const candidatesWithElections = (candidatesResponse.data || []).map(candidate => ({
        ...candidate,
        election_title: candidate.elections.title,
        vote_count: 0 // We'll fetch vote counts separately for better performance
      }));

      setCandidates(candidatesWithElections);

      // Fetch vote counts in background (non-blocking)
      fetchVoteCounts(candidatesWithElections);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVoteCounts = useCallback(async (candidatesList: Candidate[]) => {
    try {
      // Fetch all vote counts in a single query for better performance
      const { data: voteCounts, error } = await supabase
        .from('votes')
        .select('candidate_id')
        .in('candidate_id', candidatesList.map(c => c.id));

      if (error) {
        console.warn('Failed to fetch vote counts:', error);
        return;
      }

      // Count votes per candidate
      const voteCountMap = (voteCounts || []).reduce((acc, vote) => {
        acc[vote.candidate_id] = (acc[vote.candidate_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Update candidates with vote counts
      setCandidates(prev => prev.map(candidate => ({
        ...candidate,
        vote_count: voteCountMap[candidate.id] || 0
      })));

    } catch (error) {
      console.warn('Error fetching vote counts:', error);
    }
  }, []);

  const handleEditCandidate = useCallback((candidate: Candidate) => {
    setEditingCandidate({ ...candidate });
    setShowEditModal(true);
    setError('');
    setSuccess('');
  }, []);

  const handleSaveCandidate = useCallback(async () => {
    if (!editingCandidate) return;

    // Validate required fields
    if (!editingCandidate.full_name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!editingCandidate.department.trim()) {
      setError('Department is required');
      return;
    }
    if (!editingCandidate.course.trim()) {
      setError('Course is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Optimistic update - update UI immediately
      setCandidates(prev => prev.map(candidate => 
        candidate.id === editingCandidate.id 
          ? { ...candidate, ...editingCandidate }
          : candidate
      ));

      // Update database
      const { error } = await supabase
        .from('candidates')
        .update({
          full_name: editingCandidate.full_name.trim(),
          email: editingCandidate.email.trim(),
          department: editingCandidate.department.trim(),
          course: editingCandidate.course.trim(),
          year_of_study: editingCandidate.year_of_study,
          manifesto: editingCandidate.manifesto.trim(),
          image_url: editingCandidate.image_url.trim(),
          video_url: editingCandidate.video_url.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCandidate.id);

      if (error) {
        // Revert optimistic update on error
        await fetchData();
        throw error;
      }

      setSuccess('Candidate updated successfully!');
      
      // Close modal after short delay to show success message
      setTimeout(() => {
        setShowEditModal(false);
        setEditingCandidate(null);
        setSuccess('');
      }, 1000);

    } catch (error) {
      console.error('Error updating candidate:', error);
      setError('Failed to update candidate. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [editingCandidate, fetchData]);

  const handleDeleteCandidate = useCallback(async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    if (!confirm(`Are you sure you want to delete ${candidate.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Optimistic update
      setCandidates(prev => prev.filter(c => c.id !== candidateId));

      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (error) {
        // Revert on error
        await fetchData();
        throw error;
      }

    } catch (error) {
      console.error('Error deleting candidate:', error);
      setError('Failed to delete candidate. Please try again.');
    }
  }, [candidates, fetchData]);

  const handleModalClose = useCallback(() => {
    setShowEditModal(false);
    setEditingCandidate(null);
    setError('');
    setSuccess('');
  }, []);

  // Memoized filtered candidates for better performance
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const matchesSearch = 
        candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.election_title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesElection = selectedElection === 'all' || candidate.election_id === selectedElection;

      return matchesSearch && matchesElection;
    });
  }, [candidates, searchTerm, selectedElection]);

  // Memoized statistics
  const statistics = useMemo(() => ({
    totalCandidates: filteredCandidates.length,
    withPhotos: filteredCandidates.filter(c => c.image_url).length,
    totalVotes: filteredCandidates.reduce((sum, c) => sum + (c.vote_count || 0), 0),
    totalElections: elections.length
  }), [filteredCandidates, elections.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading candidates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidate Management</h2>
          <p className="text-gray-600">Manage all candidates across elections</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
            <p className="text-sm text-gray-600">Total Candidates</p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {success && (
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center space-x-3 text-green-600">
            <AlertCircle className="h-5 w-5" />
            <p>{success}</p>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              icon={Search}
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:w-64">
            <select
              value={selectedElection}
              onChange={(e) => setSelectedElection(e.target.value)}
              className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-20 text-base"
            >
              <option value="all">All Elections</option>
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{statistics.totalCandidates}</p>
          <p className="text-sm text-gray-600">Candidates</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{statistics.withPhotos}</p>
          <p className="text-sm text-gray-600">With Photos</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{statistics.totalVotes}</p>
          <p className="text-sm text-gray-600">Total Votes</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Award className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{statistics.totalElections}</p>
          <p className="text-sm text-gray-600">Elections</p>
        </Card>
      </div>

      {/* Candidates List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className="backdrop-blur-sm bg-white/80 border-white/20 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              {/* Candidate Photo */}
              <div className="flex-shrink-0">
                {candidate.image_url ? (
                  <img
                    src={candidate.image_url}
                    alt={candidate.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>

              {/* Candidate Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {candidate.full_name}
                    </h3>
                    <p className="text-blue-600 font-medium">{candidate.election_title}</p>
                  </div>
                  {candidate.vote_count !== undefined && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{candidate.vote_count}</p>
                      <p className="text-xs text-gray-500">votes</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{candidate.department}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>{candidate.course} • Year {candidate.year_of_study}</span>
                  </div>
                  {candidate.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{candidate.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Added {formatDate(candidate.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditCandidate(candidate)}
                    className="flex-1 hover:scale-105 transition-transform"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCandidate(candidate.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:scale-105 transition-transform"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <Card className="text-center py-12 backdrop-blur-sm bg-white/80 border-white/20">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No candidates found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedElection !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'No candidates have been added yet'
            }
          </p>
        </Card>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Edit Candidate</h2>
                <button
                  onClick={handleModalClose}
                  disabled={saving}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
              {/* Error/Success in Modal */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3 text-green-600">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">{success}</p>
                  </div>
                </div>
              )}

              {/* Photo Upload */}
              <ImageUpload
                label="Candidate Photo"
                value={editingCandidate.image_url}
                onChange={(url) => setEditingCandidate(prev => prev ? { ...prev, image_url: url } : null)}
              />

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  icon={User}
                  value={editingCandidate.full_name}
                  onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  icon={Mail}
                  value={editingCandidate.email}
                  onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, email: e.target.value } : null)}
                />

                <Input
                  label="Department *"
                  icon={GraduationCap}
                  value={editingCandidate.department}
                  onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, department: e.target.value } : null)}
                  required
                />

                <Input
                  label="Course/Program *"
                  value={editingCandidate.course}
                  onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, course: e.target.value } : null)}
                  required
                />

                <Input
                  label="Year of Study"
                  type="number"
                  min="1"
                  max="6"
                  value={editingCandidate.year_of_study.toString()}
                  onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, year_of_study: parseInt(e.target.value) || 1 } : null)}
                />

                <Input
                  label="Campaign Video URL"
                  value={editingCandidate.video_url}
                  onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, video_url: e.target.value } : null)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              {/* Manifesto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Manifesto
                </label>
                <textarea
                  value={editingCandidate.manifesto}
                  onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, manifesto: e.target.value } : null)}
                  placeholder="Enter the candidate's campaign promises, goals, and vision..."
                  rows={4}
                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleModalClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCandidate}
                loading={saving}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateManagement;