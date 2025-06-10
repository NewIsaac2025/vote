import { supabase } from '../lib/supabase';

export async function checkUnverifiedUsers() {
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

    return {
      total: allStudents?.length || 0,
      unverified: unverifiedUsers,
      withoutWallets: usersWithoutWallets,
      all: allStudents
    };
  } catch (error) {
    console.error('Error checking database:', error);
    return null;
  }
}