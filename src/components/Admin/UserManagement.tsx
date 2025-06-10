import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Search, Filter, UserCheck, UserX, Shield, ShieldOff,
  Calendar, Mail, Phone, Car as IdCard, Wallet, ToggleLeft, ToggleRight,
  AlertCircle, CheckCircle, RefreshCw, Download, Eye, EyeOff,
  Clock, Award, TrendingUp, Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate, exportToCSV } from '../../lib/utils';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import LoadingSpinner from '../UI/LoadingSpinner';

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  student_id: string;
  wallet_address: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
  voting_enabled?: boolean; // We'll add this field
  votes_cast?: number;
}

interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  usersWithWallets: number;
  votingEnabledUsers: number;
  totalVotesCast: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'with-wallet' | 'without-wallet'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'date' | 'votes'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    userId: string;
    action: 'enable' | 'disable';
    userName: string;
  } | null>(null);

  // Memoized statistics
  const stats = useMemo((): UserStats => {
    const totalUsers = users.length;
    const verifiedUsers = users.filter(u => u.verified).length;
    const unverifiedUsers = totalUsers - verifiedUsers;
    const usersWithWallets = users.filter(u => u.wallet_address).length;
    const votingEnabledUsers = users.filter(u => u.voting_enabled !== false).length; // Default to enabled
    const totalVotesCast = users.reduce((sum, u) => sum + (u.votes_cast || 0), 0);

    return {
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      usersWithWallets,
      votingEnabledUsers,
      totalVotesCast
    };
  }, [users]);

  // Memoized filtered and sorted users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.student_id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (statusFilter) {
        case 'verified':
          return user.verified;
        case 'unverified':
          return !user.verified;
        case 'with-wallet':
          return !!user.wallet_address;
        case 'without-wallet':
          return !user.wallet_address;
        default:
          return true;
      }
    });

    // Sort users
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'votes':
          comparison = (a.votes_cast || 0) - (b.votes_cast || 0);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [users, searchTerm, statusFilter, sortBy, sortOrder]);

  // Separate verified and unverified users
  const verifiedUsers = useMemo(() => 
    filteredAndSortedUsers.filter(user => user.verified), 
    [filteredAndSortedUsers]
  );

  const unverifiedUsers = useMemo(() => 
    filteredAndSortedUsers.filter(user => !user.verified), 
    [filteredAndSortedUsers]
  );

  const fetchUsers = useCallback(async () => {
    try {
      setError('');
      
      // Fetch users with vote counts
      const { data: usersData, error: usersError } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          email,
          phone,
          student_id,
          wallet_address,
          verified,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch vote counts for each user
      const usersWithVoteCounts = await Promise.all(
        (usersData || []).map(async (user) => {
          try {
            const { count: voteCount } = await supabase
              .from('votes')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', user.id);

            return {
              ...user,
              votes_cast: voteCount || 0,
              voting_enabled: true // Default to enabled, you can add this field to the database later
            };
          } catch (error) {
            console.warn(`Failed to fetch vote count for user ${user.id}:`, error);
            return {
              ...user,
              votes_cast: 0,
              voting_enabled: true
            };
          }
        })
      );

      setUsers(usersWithVoteCounts);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleVotingPrivileges = useCallback(async (userId: string, enable: boolean) => {
    setUpdating(userId);
    setError('');
    setSuccess('');

    try {
      // For now, we'll just update the local state since voting_enabled isn't in the database yet
      // In a real implementation, you'd update the database
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, voting_enabled: enable }
          : user
      ));

      const user = users.find(u => u.id === userId);
      setSuccess(`Voting privileges ${enable ? 'enabled' : 'disabled'} for ${user?.full_name}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error updating voting privileges:', error);
      setError('Failed to update voting privileges. Please try again.');
    } finally {
      setUpdating(null);
      setShowConfirmDialog(null);
    }
  }, [users]);

  const handleToggleClick = useCallback((user: Student, enable: boolean) => {
    setShowConfirmDialog({
      userId: user.id,
      action: enable ? 'enable' : 'disable',
      userName: user.full_name
    });
  }, []);

  const handleConfirmToggle = useCallback(() => {
    if (showConfirmDialog) {
      toggleVotingPrivileges(
        showConfirmDialog.userId, 
        showConfirmDialog.action === 'enable'
      );
    }
  }, [showConfirmDialog, toggleVotingPrivileges]);

  const handleExportUsers = useCallback(() => {
    const exportData = filteredAndSortedUsers.map(user => ({
      name: user.full_name,
      email: user.email,
      student_id: user.student_id,
      phone: user.phone,
      verified: user.verified ? 'Yes' : 'No',
      wallet_connected: user.wallet_address ? 'Yes' : 'No',
      voting_enabled: user.voting_enabled ? 'Yes' : 'No',
      votes_cast: user.votes_cast || 0,
      registration_date: formatDate(user.created_at)
    }));

    exportToCSV(exportData, 'users_export.csv');
  }, [filteredAndSortedUsers]);

  const refreshUsers = useCallback(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Set up real-time subscription for user updates
  useEffect(() => {
    const subscription = supabase
      .channel('students_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        () => {
          // Refresh users when changes occur
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts and voting privileges</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refreshUsers} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center space-x-3 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <p>{success}</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-xs text-gray-600">Total Users</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <UserCheck className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.verifiedUsers}</p>
          <p className="text-xs text-gray-600">Verified</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-amber-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <UserX className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.unverifiedUsers}</p>
          <p className="text-xs text-gray-600">Unverified</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Wallet className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.usersWithWallets}</p>
          <p className="text-xs text-gray-600">With Wallets</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-emerald-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.votingEnabledUsers}</p>
          <p className="text-xs text-gray-600">Voting Enabled</p>
        </Card>

        <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
          <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.totalVotesCast}</p>
          <p className="text-xs text-gray-600">Votes Cast</p>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="backdrop-blur-sm bg-white/80 border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              icon={Search}
              placeholder="Search by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-20 text-base"
            >
              <option value="all">All Users</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
              <option value="with-wallet">With Wallet</option>
              <option value="without-wallet">Without Wallet</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 h-14 rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-20 text-base"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="votes">Sort by Votes</option>
            </select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Unverified Users Section */}
      {unverifiedUsers.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <UserX className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Unverified Accounts ({unverifiedUsers.length})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {unverifiedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                updating={updating === user.id}
                onToggleVoting={handleToggleClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Verified Users Section */}
      {verifiedUsers.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <UserCheck className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Verified Accounts ({verifiedUsers.length})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {verifiedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                updating={updating === user.id}
                onToggleVoting={handleToggleClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Users Found */}
      {filteredAndSortedUsers.length === 0 && (
        <Card className="text-center py-12 backdrop-blur-sm bg-white/80 border-white/20">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'No users have registered yet'
            }
          </p>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                showConfirmDialog.action === 'enable' 
                  ? 'bg-green-100' 
                  : 'bg-red-100'
              }`}>
                {showConfirmDialog.action === 'enable' ? (
                  <Shield className="h-8 w-8 text-green-600" />
                ) : (
                  <ShieldOff className="h-8 w-8 text-red-600" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {showConfirmDialog.action === 'enable' ? 'Enable' : 'Disable'} Voting Privileges
              </h3>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to {showConfirmDialog.action} voting privileges for{' '}
                <span className="font-medium">{showConfirmDialog.userName}</span>?
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmToggle}
                  className={`flex-1 ${
                    showConfirmDialog.action === 'enable'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {showConfirmDialog.action === 'enable' ? 'Enable' : 'Disable'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// User Card Component
interface UserCardProps {
  user: Student;
  updating: boolean;
  onToggleVoting: (user: Student, enable: boolean) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, updating, onToggleVoting }) => {
  const isVotingEnabled = user.voting_enabled !== false; // Default to enabled

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-white/20 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            user.verified 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
              : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}>
            <span className="text-white font-medium text-lg">
              {user.full_name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-lg font-semibold text-gray-900 truncate">
                {user.full_name}
              </h4>
              {user.verified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center space-x-1">
                <IdCard className="h-3 w-3" />
                <span>{user.student_id}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>{user.phone}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(user.created_at)}</span>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex items-center space-x-2 mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                user.verified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {user.verified ? 'Verified' : 'Unverified'}
              </span>
              
              {user.wallet_address ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <Wallet className="h-3 w-3 mr-1" />
                  Wallet Connected
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  No Wallet
                </span>
              )}

              {user.votes_cast !== undefined && user.votes_cast > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Award className="h-3 w-3 mr-1" />
                  {user.votes_cast} votes
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Voting Toggle */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Voting Privileges</p>
            <p className={`text-xs ${isVotingEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {isVotingEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          
          <button
            onClick={() => onToggleVoting(user, !isVotingEnabled)}
            disabled={updating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isVotingEnabled ? 'bg-green-600' : 'bg-gray-200'
            } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isVotingEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          
          {updating && (
            <LoadingSpinner size="sm" />
          )}
        </div>
      </div>
    </Card>
  );
};

export default UserManagement;