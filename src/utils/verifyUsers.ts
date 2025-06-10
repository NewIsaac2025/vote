import { supabase } from '../lib/supabase';

export interface UserVerificationResult {
  email: string;
  user_id: string | null;
  full_name: string;
  verified: boolean;
  voting_enabled: boolean;
  wallet_address: string | null;
  can_vote: boolean;
  issues: string[];
  status: string;
}

export async function verifySpecificUsers(): Promise<UserVerificationResult[]> {
  const targetEmails = [
    'ceo@project100.space',
    'tradestacksfin@gmail.com',
    'esther_chizaram@yahoo.com',
    'somyfrancis@yahoo.com',
    'metceoai@gmail.com'
  ];

  try {
    console.log('🔍 Checking voting eligibility for specified users...');
    
    // First, check current status
    const { data: eligibilityData, error: eligibilityError } = await supabase
      .rpc('check_voting_eligibility', { user_emails: targetEmails });

    if (eligibilityError) {
      console.error('Error checking eligibility:', eligibilityError);
      throw eligibilityError;
    }

    console.log('📊 Current status:', eligibilityData);

    // Update users that need verification
    const usersNeedingUpdate = eligibilityData?.filter(user => 
      user.user_id && (!user.verified || !user.voting_enabled)
    ) || [];

    if (usersNeedingUpdate.length > 0) {
      console.log(`🔧 Updating ${usersNeedingUpdate.length} users...`);
      
      // Enable verification and voting for existing users
      const { data: updateData, error: updateError } = await supabase
        .rpc('verify_and_enable_users_by_email', { user_emails: targetEmails });

      if (updateError) {
        console.error('Error updating users:', updateError);
        throw updateError;
      }

      console.log('✅ Update results:', updateData);
    }

    // Check final status
    const { data: finalStatus, error: finalError } = await supabase
      .rpc('check_voting_eligibility', { user_emails: targetEmails });

    if (finalError) {
      console.error('Error checking final status:', finalError);
      throw finalError;
    }

    console.log('🎯 Final verification status:');
    finalStatus?.forEach(user => {
      console.log(`${user.email}: ${user.can_vote ? '✅ CAN VOTE' : '❌ CANNOT VOTE'} - ${user.issues.join(', ')}`);
    });

    return finalStatus || [];

  } catch (error) {
    console.error('Error in user verification process:', error);
    throw error;
  }
}

export async function checkUserVotingStatus(email: string): Promise<UserVerificationResult | null> {
  try {
    const { data, error } = await supabase
      .rpc('check_voting_eligibility', { user_emails: [email] });

    if (error) throw error;

    return data?.[0] || null;
  } catch (error) {
    console.error('Error checking user voting status:', error);
    return null;
  }
}

export async function enableVotingForUser(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('verify_and_enable_users_by_email', { user_emails: [email] });

    if (error) throw error;

    const result = data?.[0];
    return result?.status?.includes('Updated') || false;
  } catch (error) {
    console.error('Error enabling voting for user:', error);
    return false;
  }
}

// Function to verify all target users and log results
export async function verifyAndLogUsers(): Promise<void> {
  try {
    console.log('🚀 Starting user verification process...');
    
    const results = await verifySpecificUsers();
    
    console.log('\n📋 VERIFICATION SUMMARY:');
    console.log('=' .repeat(50));
    
    results.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.full_name}`);
      console.log(`   Verified: ${user.verified ? '✅' : '❌'}`);
      console.log(`   Voting Enabled: ${user.voting_enabled ? '✅' : '❌'}`);
      console.log(`   Wallet: ${user.wallet_address ? '✅ Connected' : '❌ Not Connected'}`);
      console.log(`   Can Vote: ${user.can_vote ? '✅ YES' : '❌ NO'}`);
      console.log(`   Issues: ${user.issues.join(', ')}`);
      console.log('   ' + '-'.repeat(40));
    });

    const canVoteCount = results.filter(u => u.can_vote).length;
    const totalCount = results.length;
    
    console.log(`\n🎯 RESULT: ${canVoteCount}/${totalCount} users can vote`);
    
    if (canVoteCount === totalCount) {
      console.log('✅ ALL USERS ARE READY TO VOTE!');
    } else {
      console.log('⚠️  Some users still need attention (likely wallet connection)');
    }

  } catch (error) {
    console.error('❌ Verification process failed:', error);
  }
}