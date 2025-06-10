import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface Election {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  total_votes: number;
  total_candidates: number;
  leading_candidate: string;
  leading_votes: number;
}

// Global cache for elections with TTL
const electionsCache = new Map<string, {
  data: Election[];
  timestamp: number;
}>();

const CACHE_TTL = 30000; // 30 seconds

export function useOptimizedElections() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchElections = useCallback(async () => {
    try {
      // Check cache first
      const cached = electionsCache.get('active_elections');
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setElections(cached.data);
        setLoading(false);
        return;
      }

      setError(null);
      
      // Query election_stats materialized view and join with elections table for additional data
      const { data: statsData, error: statsError } = await supabase
        .from('election_stats')
        .select('*');

      if (statsError) throw statsError;

      // Get additional election details
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('id, title, description, start_date, end_date, is_active')
        .eq('is_active', true);

      if (electionsError) throw electionsError;

      // Combine the data
      const combinedData = (electionsData || []).map(election => {
        const stats = (statsData || []).find(stat => stat.election_id === election.id);
        
        return {
          id: election.id,
          title: election.title,
          description: election.description || '',
          start_date: election.start_date,
          end_date: election.end_date,
          is_active: election.is_active,
          total_votes: Number(stats?.total_votes) || 0,
          total_candidates: Number(stats?.candidate_count) || 0,
          leading_candidate: 'No votes yet', // This would need additional query to determine
          leading_votes: 0 // This would need additional query to determine
        };
      });

      // Cache the results
      electionsCache.set('active_elections', {
        data: combinedData,
        timestamp: Date.now()
      });

      setElections(combinedData);
    } catch (err) {
      console.error('Error fetching elections:', err);
      setError('Failed to load elections');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time subscription for election updates
  useEffect(() => {
    const subscription = supabase
      .channel('elections_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'elections'
        },
        () => {
          // Invalidate cache and refetch
          electionsCache.delete('active_elections');
          fetchElections();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes'
        },
        () => {
          // Invalidate cache when new votes are cast
          electionsCache.delete('active_elections');
          fetchElections();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchElections]);

  // Initial fetch
  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  // Periodic refresh for active elections
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if cache is stale
      const cached = electionsCache.get('active_elections');
      if (!cached || Date.now() - cached.timestamp >= CACHE_TTL) {
        fetchElections();
      }
    }, CACHE_TTL);

    return () => clearInterval(interval);
  }, [fetchElections]);

  const statistics = useMemo(() => ({
    totalElections: elections.length,
    activeElections: elections.filter(e => e.is_active).length,
    totalVotes: elections.reduce((sum, e) => sum + e.total_votes, 0),
    totalCandidates: elections.reduce((sum, e) => sum + e.total_candidates, 0)
  }), [elections]);

  return {
    elections,
    loading,
    error,
    statistics,
    refetch: fetchElections
  };
}