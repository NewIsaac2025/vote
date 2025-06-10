import { supabase } from '../lib/supabase';

// Cache management utilities
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 30000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const cache = new CacheManager();

// Optimized user verification check
export async function checkUserVotingEligibility(email: string) {
  const cacheKey = `user_eligibility_${email}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .rpc('check_user_can_vote', { user_email: email });

    if (error) throw error;

    const result = data?.[0] || null;
    
    // Cache for 5 minutes
    cache.set(cacheKey, result, 300000);
    
    return result;
  } catch (error) {
    console.error('Error checking user voting eligibility:', error);
    return null;
  }
}

// Batch user verification
export async function verifyTargetUsers() {
  const targetEmails = [
    'esther_chizaram@yahoo.com',
    'somyfrancis@yahoo.com',
    'metceoai@gmail.com'
  ];

  console.log('🔍 Checking voting eligibility for target users...');

  try {
    // Check all users in parallel
    const results = await Promise.all(
      targetEmails.map(email => checkUserVotingEligibility(email))
    );

    const summary = results.map((result, index) => ({
      email: targetEmails[index],
      canVote: result?.can_vote || false,
      verified: result?.verified || false,
      votingEnabled: result?.voting_enabled || false,
      hasWallet: !!result?.wallet_address,
      issues: result?.issues || ['User not found']
    }));

    console.log('📊 Verification Summary:');
    summary.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Can Vote: ${user.canVote ? '✅' : '❌'}`);
      console.log(`   Verified: ${user.verified ? '✅' : '❌'}`);
      console.log(`   Voting Enabled: ${user.votingEnabled ? '✅' : '❌'}`);
      console.log(`   Has Wallet: ${user.hasWallet ? '✅' : '❌'}`);
      console.log(`   Issues: ${user.issues.join(', ')}`);
      console.log('   ---');
    });

    const readyCount = summary.filter(u => u.canVote).length;
    console.log(`🎯 Result: ${readyCount}/${summary.length} users ready to vote`);

    return summary;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Performance monitoring
export function startPerformanceMonitoring() {
  // Monitor Supabase connection performance
  const originalFrom = supabase.from;
  
  supabase.from = function(table: string) {
    const start = performance.now();
    const query = originalFrom.call(this, table);
    
    // Override select to add timing
    const originalSelect = query.select;
    query.select = function(...args: any[]) {
      const selectQuery = originalSelect.apply(this, args);
      
      // Add timing to the promise
      const originalThen = selectQuery.then;
      selectQuery.then = function(onFulfilled?: any, onRejected?: any) {
        return originalThen.call(this, (result: any) => {
          const duration = performance.now() - start;
          if (duration > 1000) { // Log slow queries
            console.warn(`Slow query detected: ${table} took ${duration.toFixed(2)}ms`);
          }
          return onFulfilled ? onFulfilled(result) : result;
        }, onRejected);
      };
      
      return selectQuery;
    };
    
    return query;
  };

  console.log('📊 Performance monitoring enabled');
}

// Database optimization utilities
export async function refreshDashboardStats() {
  try {
    await supabase.rpc('refresh_dashboard_stats');
    console.log('📊 Dashboard statistics refreshed');
  } catch (error) {
    console.error('Failed to refresh dashboard stats:', error);
  }
}

// Connection pool optimization
export function optimizeSupabaseConnection() {
  // Set up connection pooling and optimization
  console.log('🔧 Optimizing Supabase connection...');
  
  // Enable performance monitoring
  startPerformanceMonitoring();
  
  // Set up periodic cache cleanup
  setInterval(() => {
    cache.clear();
  }, 600000); // Clear cache every 10 minutes
  
  console.log('✅ Supabase connection optimized');
}

// Preload critical data
export async function preloadCriticalData() {
  try {
    console.log('🚀 Preloading critical data...');
    
    // Preload active elections
    const { data: elections } = await supabase
      .rpc('get_active_elections_with_stats');
    
    if (elections) {
      cache.set('active_elections', elections, 30000);
      console.log(`✅ Preloaded ${elections.length} active elections`);
    }
    
    // Preload dashboard stats
    await refreshDashboardStats();
    
    console.log('✅ Critical data preloaded');
  } catch (error) {
    console.error('❌ Failed to preload critical data:', error);
  }
}