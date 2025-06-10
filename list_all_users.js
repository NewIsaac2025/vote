// Script to list all registered users in the database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllUsers() {
  try {
    console.log('Fetching all registered users from database...\n');
    
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
        created_at,
        updated_at,
        last_login
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      return;
    }

    console.log(`=== ALL REGISTERED USERS (${allStudents?.length || 0} total) ===\n`);

    if (!allStudents || allStudents.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    // List all users with detailed information
    allStudents.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Student ID: ${user.student_id}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Verified: ${user.verified ? '✅ YES' : '❌ NO'}`);
      console.log(`   Wallet: ${user.wallet_address ? `✅ ${user.wallet_address.substring(0, 10)}...` : '❌ Not connected'}`);
      console.log(`   Voting Enabled: ${user.voting_enabled !== false ? '✅ YES' : '❌ NO'}`);
      console.log(`   Registered: ${new Date(user.created_at).toLocaleDateString()} at ${new Date(user.created_at).toLocaleTimeString()}`);
      if (user.last_login) {
        console.log(`   Last Login: ${new Date(user.last_login).toLocaleDateString()} at ${new Date(user.last_login).toLocaleTimeString()}`);
      }
      console.log('   ' + '─'.repeat(50));
    });

    // Summary statistics
    const verifiedCount = allStudents.filter(u => u.verified).length;
    const unverifiedCount = allStudents.length - verifiedCount;
    const withWalletCount = allStudents.filter(u => u.wallet_address).length;
    const votingEnabledCount = allStudents.filter(u => u.voting_enabled !== false).length;

    console.log('\n=== SUMMARY STATISTICS ===');
    console.log(`Total Users: ${allStudents.length}`);
    console.log(`Verified Users: ${verifiedCount}`);
    console.log(`Unverified Users: ${unverifiedCount}`);
    console.log(`Users with Wallets: ${withWalletCount}`);
    console.log(`Voting Enabled Users: ${votingEnabledCount}`);

    // Categorize users
    console.log('\n=== USER CATEGORIES ===');
    
    const unverifiedUsers = allStudents.filter(u => !u.verified);
    if (unverifiedUsers.length > 0) {
      console.log(`\n📋 UNVERIFIED USERS (${unverifiedUsers.length}):`);
      unverifiedUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.full_name} (${user.email})`);
      });
    }

    const usersWithoutWallets = allStudents.filter(u => !u.wallet_address);
    if (usersWithoutWallets.length > 0) {
      console.log(`\n💳 USERS WITHOUT WALLETS (${usersWithoutWallets.length}):`);
      usersWithoutWallets.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.full_name} (${user.email})`);
      });
    }

    const votingDisabledUsers = allStudents.filter(u => u.voting_enabled === false);
    if (votingDisabledUsers.length > 0) {
      console.log(`\n🚫 VOTING DISABLED USERS (${votingDisabledUsers.length}):`);
      votingDisabledUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.full_name} (${user.email})`);
      });
    }

    const fullyVerifiedUsers = allStudents.filter(u => u.verified && u.wallet_address && u.voting_enabled !== false);
    console.log(`\n✅ FULLY VERIFIED & READY TO VOTE (${fullyVerifiedUsers.length}):`);
    fullyVerifiedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name} (${user.email})`);
    });

  } catch (error) {
    console.error('Error listing users:', error);
  }
}

// Run the check
listAllUsers();