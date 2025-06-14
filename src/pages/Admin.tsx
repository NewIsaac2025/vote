import React, { useState, useEffect } from 'react';
import { 
  Plus, Users, Vote, BarChart3, Settings, 
  Calendar, Clock, Edit3, Trash2, Eye,
  UserCheck, AlertCircle, TrendingUp, Download,
  Activity, Award, Target, UserPlus, Shield, Database
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate, getElectionStatus, exportToCSV } from '../lib/utils';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import CreateElectionModal from '../components/Admin/CreateElectionModal';
import ElectionAnalytics from '../components/Admin/ElectionAnalytics';
import CandidateManagement from '../components/Admin/CandidateManagement';
import UserManagement from '../components/Admin/UserManagement';

interface Election {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  verified: boolean;
  wallet_address: string;
  created_at: string;
}

interface DashboardStats {
  totalElections: number;
  activeElections: number;
  totalStudents: number;
  verifiedStudents: number;
  totalVotes: number;
  totalCandidates: number;
}

interface DatabaseCheckResult {
  total: number;
  unverified: Student[];
  withoutWallets: Student[];
  all: Student[];
}

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'elections' | 'candidates' | 'users' | 'analytics' | 'settings'>('dashboard');
  const [elections, setElections] = useState<Election[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalElections: 0,
    activeElections: 0,
    totalStudents: 0,
    verifiedStudents: 0,
    totalVotes: 0,
    totalCandidates: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedElectionForCandidates, setSelectedElectionForCandidates] = useState<string | null>(null);
  const [dbCheckResult, setDbCheckResult] = useState<DatabaseCheckResult | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch elections
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });

      if (electionsError) throw electionsError;
      setElections(electionsData || []);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Calculate stats
      const activeElections = electionsData?.filter(e => 
        getElectionStatus(e.start_date, e.end_date) === 'active'
      ).length || 0;

      const verifiedStudents = studentsData?.filter(s => s.verified).length || 0;

      // Get total votes count
      const { count: totalVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      // Get total candidates count
      const { count: totalCandidates } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalElections: electionsData?.length || 0,
        activeElections,
        totalStudents: studentsData?.length || 0,
        verifiedStudents,
        totalVotes: totalVotes || 0,
        totalCandidates: totalCandidates || 0
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDatabase = async () => {
    setCheckingDb(true);
    try {
      console.log('Checking database for all users...');
      
      // Get all students from the database
      const { data: allStudents, error } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          email,
          student_id,
          phone,
          wallet_address,
          verified,
          voting_enabled,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        return;
      }

      console.log(`Total students in database: ${allStudents?.length || 0}`);

      // Filter unverified users
      const unverifiedUsers = allStudents?.filter(user => !user.verified) || [];
      const usersWithoutWallets = allStudents?.filter(user => !user.wallet_address) || [];
      
      console.log(`Unverified accounts: ${unverifiedUsers.length}`);
      console.log(`Users without wallets: ${usersWithoutWallets.length}`);

      // Check specific emails
      const specificEmails = [
        'nipcofillingstation03@gmail.com',
        'metceoai@gmail.com', 
        'ceo@project100.space'
      ];

      console.log('\nChecking specific emails:');
      specificEmails.forEach(email => {
        const user = allStudents?.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
          console.log(`✓ ${email}: ${user.verified ? 'Verified' : 'UNVERIFIED'}, Wallet: ${user.wallet_address ? 'Connected' : 'NOT CONNECTED'}`);
        } else {
          console.log(`✗ ${email}: NOT FOUND`);
        }
      });

      const result = {
        total: allStudents?.length || 0,
        unverified: unverifiedUsers,
        withoutWallets: usersWithoutWallets,
        all: allStudents || []
      };

      setDbCheckResult(result);
      
      // Also log detailed info about unverified users
      if (unverifiedUsers.length > 0) {
        console.log('\n=== UNVERIFIED ACCOUNTS DETAILS ===');
        unverifiedUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.full_name}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Student ID: ${user.student_id}`);
          console.log(`   Wallet: ${user.wallet_address || 'Not connected'}`);
          console.log(`   Registered: ${new Date(user.created_at).toLocaleDateString()}`);
          console.log('   ---');
        });
      }

    } catch (error) {
      console.error('Error checking database:', error);
    } finally {
      setCheckingDb(false);
    }
  };

  const handleExportStudents = () => {
    const exportData = students.map(student => ({
      name: student.full_name,
      email: student.email,
      student_id: student.student_id,
      verified: student.verified ? 'Yes' : 'No',
      wallet_connected: student.wallet_address ? 'Yes' : 'No',
      registration_date: new Date(student.created_at).toLocaleDateString()
    }));

    exportToCSV(exportData, 'students_export.csv');
  };

  const handleDeleteElection = async (electionId: string) => {
    if (!confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('elections')
        .delete()
        .eq('id', electionId);

      if (error) throw error;
      
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting election:', error);
      alert('Failed to delete election');
    }
  };

  const handleAddCandidates = (electionId: string) => {
    setSelectedElectionForCandidates(electionId);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setSelectedElectionForCandidates(null);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'elections', label: 'Elections', icon: Vote },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'users', label: 'User Management', icon: Shield }, // Updated icon and label
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl">
              <Settings className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-4">
            Admin Panel
          </h1>
          <p className="text-xl text-gray-600">
            Manage elections, candidates, users, and system settings
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Vote className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalElections}</p>
                <p className="text-sm text-gray-600">Total Elections</p>
              </Card>

              <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeElections}</p>
                <p className="text-sm text-gray-600">Active Elections</p>
              </Card>

              <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </Card>

              <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
                <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.verifiedStudents}</p>
                <p className="text-sm text-gray-600">Verified Students</p>
              </Card>

              <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
                <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVotes}</p>
                <p className="text-sm text-gray-600">Total Votes</p>
              </Card>

              <Card className="text-center backdrop-blur-sm bg-white/80 border-white/20">
                <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCandidates}</p>
                <p className="text-sm text-gray-600">Total Candidates</p>
              </Card>
            </div>

            {/* Database Check Section */}
            <Card className="backdrop-blur-sm bg-white/80 border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Database Status Check</h3>
                <Button
                  onClick={checkDatabase}
                  loading={checkingDb}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {checkingDb ? 'Checking...' : 'Check Database'}
                </Button>
              </div>

              {dbCheckResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900">Total Users</h4>
                      <p className="text-2xl font-bold text-blue-600">{dbCheckResult.total}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <h4 className="font-medium text-amber-900">Unverified</h4>
                      <p className="text-2xl font-bold text-amber-600">{dbCheckResult.unverified.length}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-900">No Wallet</h4>
                      <p className="text-2xl font-bold text-red-600">{dbCheckResult.withoutWallets.length}</p>
                    </div>
                  </div>

                  {dbCheckResult.unverified.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-900 mb-3">
                        Unverified Accounts ({dbCheckResult.unverified.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {dbCheckResult.unverified.map((user, index) => (
                          <div key={user.id} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{user.full_name}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                                <p className="text-xs text-gray-500">ID: {user.student_id}</p>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Unverified
                                </span>
                                {!user.wallet_address && (
                                  <span className="block mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    No Wallet
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Button
                          onClick={() => setActiveTab('users')}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          Manage These Users
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="backdrop-blur-sm bg-white/80 border-white/20">
                <div className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Election</h3>
                  <p className="text-gray-600 mb-4">Set up a new election with candidates and voting periods</p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="w-full"
                  >
                    Create New Election
                  </Button>
                </div>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-white/20">
                <div className="text-center">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Candidates</h3>
                  <p className="text-gray-600 mb-4">View and edit candidate profiles across all elections</p>
                  <Button 
                    onClick={() => setActiveTab('candidates')}
                    variant="outline"
                    className="w-full"
                  >
                    View Candidates
                  </Button>
                </div>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-white/20">
                <div className="text-center">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
                  <p className="text-gray-600 mb-4">Manage user accounts and voting privileges</p>
                  <Button 
                    onClick={() => setActiveTab('users')}
                    variant="outline"
                    className="w-full"
                  >
                    Manage Users
                  </Button>
                </div>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 border-white/20">
                <div className="text-center">
                  <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">View Analytics</h3>
                  <p className="text-gray-600 mb-4">Analyze voting patterns and election performance</p>
                  <Button 
                    onClick={() => setActiveTab('analytics')}
                    variant="outline"
                    className="w-full"
                  >
                    View Analytics
                  </Button>
                </div>
              </Card>
            </div>

            {/* Recent Elections */}
            <Card className="backdrop-blur-sm bg-white/80 border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Elections</h2>
                <Button 
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Election
                </Button>
              </div>
              
              <div className="space-y-4">
                {elections.slice(0, 5).map((election) => {
                  const status = getElectionStatus(election.start_date, election.end_date);
                  return (
                    <div key={election.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-medium text-gray-900">{election.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === 'active' ? 'bg-green-100 text-green-800' :
                            status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(election.start_date)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/elections/${election.id}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/results/${election.id}`} target="_blank" rel="noopener noreferrer">
                            <BarChart3 className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddCandidates(election.id)}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Elections Tab */}
        {activeTab === 'elections' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Elections Management</h2>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Election
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {elections.map((election) => {
                const status = getElectionStatus(election.start_date, election.end_date);
                return (
                  <Card key={election.id} className="backdrop-blur-sm bg-white/80 border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{election.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            status === 'active' ? 'bg-green-100 text-green-800' :
                            status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{election.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Start: {formatDate(election.start_date)}</span>
                          <span>End: {formatDate(election.end_date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/elections/${election.id}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/results/${election.id}`} target="_blank" rel="noopener noreferrer">
                            <BarChart3 className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddCandidates(election.id)}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          title="Add Candidates"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteElection(election.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && <CandidateManagement />}

        {/* User Management Tab */}
        {activeTab === 'users' && <UserManagement />}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && <ElectionAnalytics />}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            
            <Card className="backdrop-blur-sm bg-white/80 border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email Verification Required</p>
                    <p className="text-sm text-gray-600">Require students to verify their email before voting</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Wallet Connection Required</p>
                    <p className="text-sm text-gray-600">Require MetaMask wallet connection for voting</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Real-time Results</p>
                    <p className="text-sm text-gray-600">Show live voting results during elections</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Allow Adding Candidates During Elections</p>
                    <p className="text-sm text-gray-600">Permit admins to add new candidates to active elections</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>
            </Card>

            <Card className="backdrop-blur-sm bg-white/80 border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Blockchain Security</p>
                    <p className="text-sm text-gray-600">All votes are secured on the blockchain</p>
                  </div>
                  <span className="text-green-600 text-sm font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Audit Logging</p>
                    <p className="text-sm text-gray-600">Log all administrative actions</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Winner Declaration</p>
                    <p className="text-sm text-gray-600">Only declare winners after election ends</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Create Election Modal */}
      <CreateElectionModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={fetchData}
        existingElectionId={selectedElectionForCandidates}
      />
    </div>
  );
};

export default Admin;