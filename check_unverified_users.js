// Script to check for unverified users in the database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUnverifiedUsers() {
  try {
    console.log('Checking database for unverified accounts...\n');
    
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
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      return;
    }

    console.log(`Total students in database: ${allStudents?.length || 0}\n`);

    // Filter unverified users
    const unverifiedUsers = allStudents?.filter(user => !user.verified) || [];
    
    console.log(`Unverified accounts found: ${unverifiedUsers.length}\n`);

    if (unverifiedUsers.length > 0) {
      console.log('=== UNVERIFIED ACCOUNTS ===\n');
      
      unverifiedUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Student ID: ${user.student_id}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Wallet: ${user.wallet_address || 'Not connected'}`);
        console.log(`   Voting Enabled: ${user.voting_enabled !== false ? 'Yes' : 'No'}`);
        console.log(`   Registered: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log('   ---');
      });

      // Check for specific emails mentioned
      const specificEmails = [
        'nipcofillingstation03@gmail.com',
        'metceoai@gmail.com',
        'ceo@project100.space'
      ];

      console.log('\n=== CHECKING SPECIFIC EMAILS ===\n');
      
      specificEmails.forEach(email => {
        const user = allStudents?.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
          console.log(`✓ Found: ${email}`);
          console.log(`  Name: ${user.full_name}`);
          console.log(`  Verified: ${user.verified ? 'Yes' : 'No'}`);
          console.log(`  Wallet: ${user.wallet_address || 'Not connected'}`);
          console.log(`  Voting Enabled: ${user.voting_enabled !== false ? 'Yes' : 'No'}`);
        } else {
          console.log(`✗ Not found: ${email}`);
        }
        console.log('');
      });
    } else {
      console.log('No unverified accounts found.');
    }

    // Check users without wallets
    const usersWithoutWallets = allStudents?.filter(user => !user.wallet_address) || [];
    console.log(`\nUsers without wallet addresses: ${usersWithoutWallets.length}`);
    
    if (usersWithoutWallets.length > 0) {
      console.log('\n=== USERS WITHOUT WALLETS ===\n');
      usersWithoutWallets.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name} (${user.email})`);
        console.log(`   Verified: ${user.verified ? 'Yes' : 'No'}`);
        console.log(`   Voting Enabled: ${user.voting_enabled !== false ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error checking unverified users:', error);
  }
}

// Run the check
checkUnverifiedUsers();