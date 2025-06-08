import React from 'react';
import { X, Vote, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import Button from './Button';
import Card from './Card';

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl border-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Vote className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Confirm Your Vote</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Election Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Election</h3>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{electionTitle}</p>
        </div>

        {/* Candidate Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Selected Candidate</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {candidateName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-bold text-blue-900">{candidateName}</p>
                <p className="text-blue-700 text-sm">{candidateDepartment}</p>
                <p className="text-blue-600 text-sm">{candidateCourse}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 mb-1">Important Notice</h4>
              <p className="text-amber-800 text-sm">
                This action cannot be undone. Your vote will be recorded securely on the blockchain 
                and you will not be able to change it later.
              </p>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">Your Vote is Protected</h4>
          </div>
          <ul className="text-green-800 text-sm space-y-1">
            <li className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
              Encrypted and secured on blockchain
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
              Anonymous and private
            </li>
            <li className="flex items-center">
              <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
              Tamper-proof and transparent
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
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
            {isLoading ? 'Recording Vote...' : 'Confirm Vote'}
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            By confirming, you agree that this is your final vote choice
          </p>
        </div>
      </Card>
    </div>
  );
};

export default VoteConfirmationModal;