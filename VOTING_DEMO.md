# UniVote Voting System - How It Works

## Complete Voting Process Demonstration

### 1. User Authentication & Verification
- Users must be registered and logged in
- Email verification is required
- MetaMask wallet connection is needed for blockchain security

### 2. Election Access
- Navigate to `/elections` to see available elections
- Click on an active election to view details
- Only verified students can vote in active elections

### 3. Candidate Selection Process
The voting interface shows:
- List of all candidates with their profiles
- Department, course, and year information
- Campaign manifestos and media links
- Real-time vote counts (if results are visible)

### 4. Voting Mechanism
When a user clicks on a candidate card:
1. The card becomes selected (highlighted with blue border)
2. "Click to select" changes to "✓ Selected for voting"
3. A "Cast Vote Securely" button appears at the bottom

### 5. Vote Submission Process
When user clicks "Cast Vote Securely":
1. **Wallet Verification**: Checks if MetaMask wallet is connected
2. **Duplicate Check**: Verifies user hasn't already voted in this election
3. **Blockchain Hash**: Generates cryptographic vote hash for security
4. **Database Recording**: Stores vote in Supabase with:
   - Student ID
   - Candidate ID
   - Election ID
   - Wallet address
   - Vote hash
   - Timestamp

### 6. Vote Confirmation
After successful voting:
- Success message displayed
- Email confirmation sent to voter
- Vote status updated to "Vote Recorded"
- Real-time results refresh automatically

## Key Security Features

### Database Schema
```sql
-- Votes table structure
CREATE TABLE votes (
  id uuid PRIMARY KEY,
  student_id uuid REFERENCES students(id),
  candidate_id uuid REFERENCES candidates(id), 
  election_id uuid REFERENCES elections(id),
  wallet_address text NOT NULL,
  vote_hash text,
  voted_at timestamptz DEFAULT now(),
  UNIQUE(student_id, election_id) -- Prevents duplicate voting
);
```

### Blockchain Integration
- Each vote generates a unique cryptographic hash
- Wallet address verification ensures voter identity
- Immutable record creation for transparency

### Real-time Updates
- Live vote tracking during active elections
- Automatic result updates as votes are cast
- WebSocket connections for real-time data

## Testing the Voting System

### Prerequisites
1. Register a new student account
2. Verify email address
3. Connect MetaMask wallet
4. Ensure there's an active election

### Step-by-Step Test
1. **Login**: Use student credentials
2. **Navigate**: Go to Elections page
3. **Select Election**: Click on an active election
4. **Choose Candidate**: Click on a candidate card
5. **Confirm Selection**: Verify candidate is highlighted
6. **Cast Vote**: Click "Cast Vote Securely" button
7. **Verify**: Check for success message and email confirmation

### Expected Results
- Vote recorded in database
- Email confirmation sent
- Real-time results updated
- User marked as "has voted" for that election
- Subsequent voting attempts blocked

## Error Handling
- Duplicate vote prevention
- Wallet connection validation
- Election timing verification
- Network error recovery
- User feedback for all states

## Database Functions Used

### Vote Status Check
```sql
check_student_vote_status(student_uuid, election_uuid)
-- Returns: has_voted boolean
```

### Results Retrieval
```sql
get_election_results(election_uuid)
-- Returns: candidate details with vote counts and percentages
```

## Security Measures
1. **Row Level Security (RLS)**: Database-level access control
2. **Unique Constraints**: Prevents duplicate voting
3. **Blockchain Hashing**: Cryptographic vote verification
4. **Wallet Integration**: Identity verification through MetaMask
5. **Real-time Validation**: Immediate feedback on vote status

The voting system is fully functional and provides a secure, transparent, and user-friendly voting experience with blockchain-level security and real-time result tracking.