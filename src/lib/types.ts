export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'cashout' | 'half_won' | 'half_lost';
export type BetType = 'single' | 'accumulator';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  default_currency: string;
  starting_bankroll: number;
  preferred_language: string;
  theme: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  placed_at: string;
  description: string;
  bet_type: BetType;
  pick: string | null;
  stake: number;
  odds: number;
  currency: string;
  status: BetStatus;
  payout: number | null;
  bookmaker: string | null;
  category_id: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BetInput {
  placed_at: string;
  description: string;
  bet_type: BetType;
  pick?: string | null;
  stake: number;
  odds: number;
  currency: string;
  status: BetStatus;
  payout?: number | null;
  bookmaker?: string | null;
  category_id?: string | null;
  tags?: string[];
  notes?: string | null;
}

export type FriendshipStatus = 'pending' | 'accepted';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface FriendWithProfile {
  friendship_id: string;
  friend_id: string;
  username: string | null;
  display_name: string | null;
  status: FriendshipStatus;
  direction: 'incoming' | 'outgoing' | 'accepted';
}

export interface LeaderboardRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  total_bets: number;
  won_bets: number;
  settled_bets: number;
  total_staked: number;
  total_profit: number;
  roi: number;
}
