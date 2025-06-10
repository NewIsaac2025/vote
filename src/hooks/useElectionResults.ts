import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface ElectionResult {
  candidate_id: string;
  candidate_name: string;
  department: string;
  course: string;
  year_of_study: number;
  image_url: string;
  vote_count: number;
  vote_percentage: number;
}

// Cache for election results with TTL
const resultsCache = new Map<string, {
  data: ElectionResult[];
  timestamp: number;
  ttl: number;
}>();

const CACHE_TTL = 30000; // 30 seconds for active elections
const CACHE_TTL_ENDED = 300000; // 5 minutes for ended elections

export function useElectionResults(electionId: string, isActive: boolean = true) {
  const [results, setResults] = useState<ElectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    if (!electionId) return;

    try {
      // Check cache first
      const cached = resultsCache.get(electionId);
      const ttl = isActive ? CACHE_TTL : CACHE_TTL_ENDED;
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        setResults(cached.data);
        setLoading(false);
        return;
      }

      setError(null);
      
      const { data, error: fetchError } = await supabase
        .rpc('get_election_results', { election_uuid: electionId });

      if (fetchError) throw fetchError;

      const resultsData = data || [];
      
      // Cache the results
      resultsCache.set(electionId, {
        data: resultsData,
        timestamp: Date.now(),
        ttl
      });

      setResults(resultsData);
    } catch (err) {
      console.error('Error fetching election results:', err);
      setError('Failed to load election results');
    } finally {
      setLoading(false);
    }
  }, [electionId, isActive]);

  // Set up real-time subscription for active elections
  useEffect(() => {
    if (!isActive || !electionId) return;

    const subscription = supabase
      .channel(`election-results-${electionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `election_id=eq.${electionId}`
        },
        () => {
          // Invalidate cache and refetch
          resultsCache.delete(electionId);
          fetchResults();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [electionId, isActive, fetchResults]);

  // Initial fetch
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Periodic refresh for active elections
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(fetchResults, CACHE_TTL);
    return () => clearInterval(interval);
  }, [isActive, fetchResults]);

  return {
    results,
    loading,
    error,
    refetch: fetchResults
  };
}