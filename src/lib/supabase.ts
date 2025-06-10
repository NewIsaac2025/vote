import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key exists:', !!supabaseAnonKey);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL in .env file.');
}

// Check if URL looks like a placeholder
if (supabaseUrl.includes('your-project-ref') || supabaseUrl === 'https://your-project-ref.supabase.co') {
  throw new Error('Please replace the placeholder Supabase URL with your actual project URL from https://supabase.com/dashboard');
}

// Check if anon key looks like a placeholder
if (supabaseAnonKey.includes('your-anon-key') || supabaseAnonKey === 'your-anon-key-here') {
  throw new Error('Please replace the placeholder Supabase anon key with your actual anon key from https://supabase.com/dashboard');
}

// Create Supabase client with persistent connection configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'univote-web'
    }
  },
  db: {
    schema: 'public'
  }
});

// Test connection function with persistent retry mechanism
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    if (import.meta.env.DEV) {
      console.log('Testing Supabase connection...');
    }
    
    // Simple health check - try to get a count from elections table
    const { data, error } = await supabase
      .from('elections')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      // Handle the specific error from the query
      if (error?.code === 'PGRST116') {
        // This error means the query returned no results, but connection is working
        if (import.meta.env.DEV) {
          console.log('Supabase connection test successful (no data found, but connection works)');
        }
        return true;
      }
      
      console.error('Supabase connection test failed:', error);
      
      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') || 
          error.message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet connection and Supabase URL.');
      }
      
      // Check if it's an authentication error
      if (error.message.includes('Invalid API key') || 
          error.message.includes('unauthorized') ||
          error.message.includes('JWT')) {
        throw new Error('Invalid Supabase credentials. Please check your VITE_SUPABASE_ANON_KEY.');
      }
      
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    if (import.meta.env.DEV) {
      console.log('Supabase connection test successful');
    }
    return true;

  } catch (error) {
    console.error('Supabase connection test error:', error);
    
    // Handle network errors specifically
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to reach Supabase server. Please check your VITE_SUPABASE_URL and internet connection.');
    }
    
    // Re-throw custom errors
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Unknown connection error occurred.');
  }
};

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          student_id: string;
          wallet_address: string | null;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone: string;
          student_id: string;
          wallet_address?: string | null;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          student_id?: string;
          wallet_address?: string | null;
          verified?: boolean;
          updated_at?: string;
        };
      };
      elections: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          department: string;
          course: string;
          year_of_study: number | null;
          manifesto: string | null;
          image_url: string | null;
          video_url: string | null;
          election_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          department: string;
          course: string;
          year_of_study?: number | null;
          manifesto?: string | null;
          image_url?: string | null;
          video_url?: string | null;
          election_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          department?: string;
          course?: string;
          year_of_study?: number | null;
          manifesto?: string | null;
          image_url?: string | null;
          video_url?: string | null;
          election_id?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          student_id: string;
          candidate_id: string;
          election_id: string;
          wallet_address: string;
          vote_hash: string | null;
          voted_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          candidate_id: string;
          election_id: string;
          wallet_address: string;
          vote_hash?: string | null;
          voted_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          candidate_id?: string;
          election_id?: string;
          wallet_address?: string;
          vote_hash?: string | null;
          voted_at?: string;
        };
      };
    };
  };
};