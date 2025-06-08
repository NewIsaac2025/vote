import React, { useState } from 'react';
import { X, Plus, Trash2, User, Mail, GraduationCap, FileText, Image, Video, Calendar, Clock, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Input from '../UI/Input';
import Button from '../UI/Button';
import Card from '../UI/Card';
import ImageUpload from '../UI/ImageUpload';

interface Candidate {
  id?: string;
  full_name: string;
  email: string;
  department: string;
  course: string;
  year_of_study: number;
  manifesto: string;
  image_url: string;
  video_url: string;
}

interface CreateElectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingElectionId?: string; // For adding candidates to existing election
}

const CreateElectionModal: React.FC<CreateElectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  existingElectionId 
}) => {
  const [step, setStep] = useState(existingElectionId ? 2 : 1); // Skip to candidates if adding to existing election
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [electionData, setElectionData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: ''
  });
  
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      full_name: '',
      email: '',
      department: '',
      course: '',
      year_of_study: 1,
      manifesto: '',
      image_url: '',
      video_url: ''
    }
  ]);

  const addCandidate = () => {
    setCandidates([...candidates, {
      full_name: '',
      email: '',
      department: '',
      course: '',
      year_of_study: 1,
      manifesto: '',
      image_url: '',
      video_url: ''
    }]);
  };

  const removeCandidate = (index: number) => {
    if (candidates.length > 1) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const updateCandidate = (index: number, field: keyof Candidate, value: string | number) => {
    const updated = [...candidates];
    updated[index] = { ...updated[index], [field]: value };
    setCandidates(updated);
  };

  const validateElection = () => {
    if (!electionData.title.trim()) {
      setError('Election title is required');
      return false;
    }
    if (!electionData.start_date || !electionData.end_date) {
      setError('Start and end dates are required');
      return false;
    }
    if (new Date(electionData.start_date) >= new Date(electionData.end_date)) {
      setError('End date must be after start date');
      return false;
    }
    setError('');
    return true;
  };

  const validateCandidates = () => {
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (!candidate.full_name.trim()) {
        setError(`Candidate ${i + 1}: Name is required`);
        return false;
      }
      if (!candidate.department.trim()) {
        setError(`Candidate ${i + 1}: Department is required`);
        return false;
      }
      if (!candidate.course.trim()) {
        setError(`Candidate ${i + 1}: Course is required`);
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleCreateElection = async () => {
    if (!existingElectionId && !validateElection()) return;
    if (!validateCandidates()) return;

    setLoading(true);
    setError('');

    try {
      let electionId = existingElectionId;

      // Create election if not adding to existing one
      if (!existingElectionId) {
        const { data: electionResult, error: electionError } = await supabase
          .from('elections')
          .insert({
            title: electionData.title.trim(),
            description: electionData.description.trim(),
            start_date: electionData.start_date,
            end_date: electionData.end_date,
            is_active: true
          })
          .select()
          .single();

        if (electionError) throw electionError;
        electionId = electionResult.id;
      }

      // Create candidates
      const candidatesWithElectionId = candidates.map(candidate => ({
        full_name: candidate.full_name.trim(),
        email: candidate.email.trim(),
        department: candidate.department.trim(),
        course: candidate.course.trim(),
        year_of_study: candidate.year_of_study,
        manifesto: candidate.manifesto.trim(),
        image_url: candidate.image_url.trim(),
        video_url: candidate.video_url.trim(),
        election_id: electionId
      }));

      const { error: candidatesError } = await supabase
        .from('candidates')
        .insert(candidatesWithElectionId);

      if (candidatesError) throw candidatesError;

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating election:', error);
      setError(error.message || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(existingElectionId ? 2 : 1);
    setElectionData({
      title: '',
      description: '',
      start_date: '',
      end_date: ''
    });
    setCandidates([{
      full_name: '',
      email: '',
      department: '',
      course: '',
      year_of_study: 1,
      manifesto: '',
      image_url: '',
      video_url: ''
    }]);
    setError('');
  };

  // Set default dates
  React.useEffect(() => {
    if (isOpen && !electionData.start_date && !existingElectionId) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);

      setElectionData(prev => ({
        ...prev,
        start_date: tomorrow.toISOString().slice(0, 16),
        end_date: nextWeek.toISOString().slice(0, 16)
      }));
    }
  }, [isOpen, existingElectionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {existingElectionId ? 'Add Candidates' : 'Create New Election'}
              </h2>
              <p className="text-blue-100">
                {existingElectionId 
                  ? 'Add new candidates to the existing election'
                  : `Step ${step} of 2 - Build your election quickly and easily`
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Step 1: Election Details - Skip if adding to existing election */}
          {step === 1 && !existingElectionId && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Election Information</h3>
                <p className="text-gray-600">Set up the basic details for your election</p>
              </div>
              
              <Input
                label="Election Title"
                value={electionData.title}
                onChange={(e) => setElectionData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Student Council Elections 2025"
                required
                className="text-lg"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Election Description
                </label>
                <textarea
                  value={electionData.description}
                  onChange={(e) => setElectionData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the election purpose, positions available, and any important information for voters..."
                  rows={4}
                  className="block w-full h-32 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-20 text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Election Start Date & Time"
                  type="datetime-local"
                  icon={Calendar}
                  value={electionData.start_date}
                  onChange={(e) => setElectionData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />

                <Input
                  label="Election End Date & Time"
                  type="datetime-local"
                  icon={Clock}
                  value={electionData.end_date}
                  onChange={(e) => setElectionData(prev => ({ ...prev, end_date: e.target.value }))}
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-900 mb-2">📋 Quick Setup Tips</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Choose a clear, descriptive title that students will recognize</li>
                  <li>• Allow sufficient time for campaigning before the election starts</li>
                  <li>• Consider time zones and student schedules when setting dates</li>
                  <li>• Include voting instructions in the description</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (validateElection()) {
                      setStep(2);
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 px-8"
                  size="lg"
                >
                  Next: Add Candidates
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Candidates */}
          {(step === 2 || existingElectionId) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {existingElectionId ? 'Add New Candidates' : 'Election Candidates'}
                  </h3>
                  <p className="text-gray-600">
                    {existingElectionId 
                      ? 'Add new candidates to the existing election'
                      : 'Add candidates who will participate in this election'
                    }
                  </p>
                </div>
                <Button
                  onClick={addCandidate}
                  variant="outline"
                  size="sm"
                  className="hover:scale-105 transition-transform"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Candidate
                </Button>
              </div>

              <div className="space-y-6">
                {candidates.map((candidate, index) => (
                  <Card key={index} className="p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <span className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {index + 1}
                        </span>
                        Candidate {index + 1}
                      </h4>
                      {candidates.length > 1 && (
                        <Button
                          onClick={() => removeCandidate(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Candidate Photo Upload */}
                    <div className="mb-6">
                      <ImageUpload
                        label="Candidate Photo"
                        value={candidate.image_url}
                        onChange={(url) => updateCandidate(index, 'image_url', url)}
                        className="max-w-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        label="Full Name"
                        icon={User}
                        value={candidate.full_name}
                        onChange={(e) => updateCandidate(index, 'full_name', e.target.value)}
                        placeholder="John Doe"
                        required
                      />

                      <Input
                        label="Email Address"
                        type="email"
                        icon={Mail}
                        value={candidate.email}
                        onChange={(e) => updateCandidate(index, 'email', e.target.value)}
                        placeholder="john.doe@university.edu"
                      />

                      <Input
                        label="Department"
                        icon={GraduationCap}
                        value={candidate.department}
                        onChange={(e) => updateCandidate(index, 'department', e.target.value)}
                        placeholder="Computer Science"
                        required
                      />

                      <Input
                        label="Course/Program"
                        value={candidate.course}
                        onChange={(e) => updateCandidate(index, 'course', e.target.value)}
                        placeholder="Software Engineering"
                        required
                      />

                      <Input
                        label="Year of Study"
                        type="number"
                        min="1"
                        max="6"
                        value={candidate.year_of_study.toString()}
                        onChange={(e) => updateCandidate(index, 'year_of_study', parseInt(e.target.value) || 1)}
                      />

                      <Input
                        label="Campaign Video URL (Optional)"
                        icon={Video}
                        value={candidate.video_url}
                        onChange={(e) => updateCandidate(index, 'video_url', e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="h-4 w-4 inline mr-1" />
                        Campaign Manifesto
                      </label>
                      <textarea
                        value={candidate.manifesto}
                        onChange={(e) => updateCandidate(index, 'manifesto', e.target.value)}
                        placeholder="Enter the candidate's campaign promises, goals, and vision for the position..."
                        rows={4}
                        className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-20"
                      />
                    </div>
                  </Card>
                ))}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-medium text-green-900 mb-2">✅ Candidate Setup Tips</h4>
                <ul className="text-green-800 text-sm space-y-1">
                  <li>• Ensure all required fields are filled for each candidate</li>
                  <li>• Profile photos help voters connect with candidates</li>
                  <li>• Campaign videos help voters connect with candidates (optional)</li>
                  <li>• Manifestos should be clear and specific about goals</li>
                  {existingElectionId && <li>• New candidates can be added even during active elections</li>}
                </ul>
              </div>

              <div className="flex justify-between">
                {!existingElectionId && (
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    size="lg"
                  >
                    Back to Election Details
                  </Button>
                )}
                <Button
                  onClick={handleCreateElection}
                  loading={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 ml-auto"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading 
                    ? (existingElectionId ? 'Adding Candidates...' : 'Creating Election...') 
                    : (existingElectionId ? 'Add Candidates' : 'Create Election')
                  }
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateElectionModal;