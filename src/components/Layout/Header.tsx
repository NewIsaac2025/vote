import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Vote, LogOut, User, Shield, Menu, X, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { truncateAddress } from '../../lib/utils';
import Button from '../UI/Button';

const Header: React.FC = () => {
  const { user, student, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Elections', href: '/elections' },
    { name: 'Results', href: '/results' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    if (signingOut) return; // Prevent multiple clicks
    
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSigningOut(false);
    }
  };

  // Check if user needs wallet verification
  const needsWalletVerification = user && student && !student.wallet_address;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Vote className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                UniVote
              </span>
              <div className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-gray-500 font-medium">2025</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Wallet Verification Alert */}
                {needsWalletVerification && (
                  <Link
                    to="/wallet-verification"
                    className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl animate-pulse"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Verify Wallet</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
                
                {student && (
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-900">{student.full_name.split(' ')[0]}</span>
                    {student.wallet_address && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium">
                        {truncateAddress(student.wallet_address)}
                      </span>
                    )}
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className={`flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 ${
                    signingOut ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {signingOut ? 'Signing out...' : 'Sign Out'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/register"
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-white/20">
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {user ? (
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {/* Mobile Wallet Verification Alert */}
                {needsWalletVerification && (
                  <Link
                    to="/wallet-verification"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl animate-pulse"
                  >
                    <AlertTriangle className="h-5 w-5" />
                    <span>Verify Wallet to Vote</span>
                  </Link>
                )}

                {student && (
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    <User className="h-5 w-5" />
                    <div className="flex-1">
                      <span>{student.full_name}</span>
                      {student.wallet_address && (
                        <div className="text-xs text-green-600 font-medium">
                          {truncateAddress(student.wallet_address)}
                        </div>
                      )}
                    </div>
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl"
                  >
                    <Shield className="h-5 w-5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  disabled={signingOut}
                  className={`flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl w-full text-left ${
                    signingOut ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <LogOut className="h-5 w-5" />
                  <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-xl font-medium"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium text-center"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;