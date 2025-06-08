import React from 'react';
import { X, Vote, Shield, AlertTriangle, CheckCircle, User, Calendar, Lock } from 'lucide-react';
import Button from './Button';

interface VoteConfirmationModalProps {
  isOpen: boolean;
  candidateName: string;
  candidateDepartment: string;
  candidateCourse: string;
  electionTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const VoteConfirmationModal: React.FC<VoteConfirmationModalProps> = ({
  isOpen,
  candidateName,
  candidateDepartment,
  candidateCourse,
  electionTitle,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-0 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Vote className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Confirm Vote</h2>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Election */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Election</p>
                <p className="font-semibold text-gray-900">{electionTitle}</p>
              </div>
            </div>

            {/* Candidate */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-900 text-lg">{candidateName}</p>
                  <p className="text-blue-700">{candidateDepartment}</p>
                  <p className="text-blue-600 text-sm">{candidateCourse}</p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">Cannot be changed</p>
                  <p className="text-amber-800 text-sm">Vote is final and permanent</p>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-900">Blockchain Protected</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 text-sm">Encrypted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 text-sm">Anonymous</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 text-sm">Tamper-proof</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              loading={isLoading}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              size="lg"
            >
              {isLoading ? 'Recording...' : 'Confirm Vote'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteConfirmationModal;