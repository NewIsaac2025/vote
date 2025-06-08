import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Edit3, Trash2, Plus, 
  User, Mail, GraduationCap, Calendar, Image as ImageIcon,
  Award, Target, TrendingUp, Eye, Save, X
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch elections
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('id, title, start_date, end_date')
        .order('start_date', { ascending: false });

      if (electionsError) throw electionsError;
      setElections(electionsData || []);

      // Fetch candidates with election info
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select(`
          *,
          elections!inner(title)
        `)
        .order('created_at', { ascending: false });

      if (candidatesError) throw candidatesError;

      // Transform data and fetch vote counts
      const candidatesWithElections = await Promise.all(
        (candidatesData || []).map(async (candidate) => {
          // Fetch vote count for each candidate
          const { data: voteData, error: voteError } = await supabase
            .from('votes')
            .select('id')
            .eq('candidate_id', candidate.id);

          return {
            ...candidate,
            election_title: candidate.elections.title,
            vote_count: voteError ? 0 : (voteData?.length || 0)
          };
        })
      );

      setCandidates(candidatesWithElections);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setEditingCandidate({ ...candidate });
    setShowEditModal(true);
  };

  const handleSaveCandidate = async () => {
    if (!editingCandidate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('candidates')
        .update({
          full_name: editingCandidate.full_name,
          email: editingCandidate.email,
          department: editingCandidate.department,
          course: editingCandidate.course,
          year_of_study: editingCandidate.year_of_study,
          manifesto: editingCandidate.manifesto,
          image_url: editingCandidate.image_url,
          video_url: editingCandidate.video_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCandidate.id);

      if (error) throw error;

      await fetchData();
      setShowEditModal(false);
      setEditingCandidate(null);
    } catch (error) {
      console.error('Error updating candidate:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting candidate:', error);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.election_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesElection = selectedElection === 'all' || candidate.election_id === selectedElection;

    return matchesSearch && matchesElection;
  });

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
          <p className="text-2xl font-bold text-gray-900">{filteredCandidates.length}</p>
          <p className="text-sm text-gray-600">Candidates</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {filteredCandidates.filter(c => c.image_url).length}
          </p>
          <p className="text-sm text-gray-600">With Photos</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {filteredCandidates.reduce((sum, c) => sum + (c.vote_count || 0), 0)}
          </p>
          <p className="text-sm text-gray-600">Total Votes</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Award className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{elections.length}</p>
          <p className="text-sm text-gray-600">Elections</p>
        </Card>
      </div>

      {/* Candidates List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className="backdrop-blur-sm bg-white/80 border-white/20">
            <div className="flex items-start space-x-4">
              {/* Candidate Photo */}
              <div className="flex-shrink-0">
                {candidate.image_url ? (
                  <img
                    src={candidate.image_url}
                    alt={candidate.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
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
                    className="flex-1"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCandidate(candidate.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
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
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              {/* Photo Upload */}
              <ImageUpload
                label="Candidate Photo"
                value={editingCandidate.image_url}
                onChange={(url) => setEditingCandidate(prev => prev ? { ...prev, image_url: url } : null)}
              />

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
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
                  label="Department"
                  icon={GraduationCap}
                  value={editingCandidate.department}
                  onChange={(e) => setEditingCandidate(prev => prev ? { ...prev, department: e.target.value } : null)}
                  required
                />

                <Input
                  label="Course/Program"
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
                  className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-20"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCandidate}
                loading={saving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateManagement;