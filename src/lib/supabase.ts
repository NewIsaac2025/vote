import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Optimize Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for SPA
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
  }
});

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