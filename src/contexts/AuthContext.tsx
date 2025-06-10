import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  student_id: string;
  wallet_address: string | null;
  verified: boolean;
  voting_enabled?: boolean; // Added voting_enabled field
  created_at: string;
  updated_at: string;
  last_login?: string; // Added last_login field
}

interface AuthContextType {
  user: User | null;
  student: Student | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateStudent: (updates: Partial<Student>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // Set a timeout for the session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            // Load user data in background, don't block UI
            loadUserData(session.user.id).finally(() => {
              if (mounted) setLoading(false);
            });
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event);
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Load user data in background for auth changes
        loadUserData(session.user.id);
      } else {
        setStudent(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Quick admin check first (most users are not admin)
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      setIsAdmin(!!adminData);

      // Then load student data with all fields including voting_enabled
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (studentData) {
        // Update last_login timestamp
        await supabase
          .from('students')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId);

        setStudent({
          ...studentData,
          voting_enabled: studentData.voting_enabled !== false // Default to true if null
        });
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        setLoading(false);
        return { data: null, error };
      }

      // Don't wait for user data loading, let it happen in background
      if (data.user) {
        loadUserData(data.user.id).finally(() => setLoading(false));
      }
      
      return { data, error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      setLoading(false);
      return { data: null, error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation
        }
      });
      
      return { data, error };
    } catch (err) {
      console.error('Sign up error:', err);
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      // Clear local state immediately for better UX
      setUser(null);
      setStudent(null);
      setIsAdmin(false);
      
      // Only call Supabase signOut if there's an active user session
      if (user) {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          // Check if the error is related to missing or invalid session
          const errorMessage = error.message?.toLowerCase() || '';
          const isSessionError = errorMessage.includes('session_not_found') || 
                                errorMessage.includes('auth session missing') ||
                                errorMessage.includes('session from session_id claim in jwt does not exist');
          
          if (isSessionError) {
            // This is expected when the session has already expired or been invalidated
            console.warn('Session already expired or invalid during sign out:', error.message);
          } else {
            // Log other types of errors normally
            console.error('Error signing out:', error);
          }
        }
      }
      
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const updateStudent = async (updates: Partial<Student>) => {
    if (!student) return;
    
    try {
      const { error } = await supabase
        .from('students')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (!error) {
        setStudent({ ...student, ...updates });
      } else {
        console.error('Error updating student:', error);
        throw error;
      }
    } catch (error) {
      console.error('Update student failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    student,
    isAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    updateStudent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};