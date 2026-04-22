export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'cashout' | 'half_won' | 'half_lost';
export type BetType = 'single' | 'accumulator' | 'surebet';

export interface SurebetLeg {
  bookmaker: string;
  odds: number;
  stake: number;
  status: 'pending' | 'won' | 'lost';
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  default_currency: string;
  starting_bankroll: number;
  preferred_language: string;
  theme: string;
  trial_ends_at: string | null;
  subscription_status: 'trial' | 'free' | 'pro';
  subscription_plan: 'monthly' | 'quarterly' | 'yearly' | 'lifetime' | null;
  subscription_until: string | null;
  is_admin: boolean;
  created_at: string;
  show_profit_to_friends: boolean;
  show_bets_to_friends: boolean;
  payouts_enabled?: boolean;
  bankroll_onboarded_at?: string | null;
  coins?: number;
  coins_synced?: number;
  character_skin?: string;
  character_hair?: string;
  character_hair_color?: string;
  character_outfit?: string;
  character_accessory?: string;
}

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

export interface LicenseCode {
  code: string;
  plan: SubscriptionPlan;
  valid_for_days: number | null;
  note: string | null;
  created_at: string;
  created_by: string | null;
  redeemed_by: string | null;
  redeemed_at: string | null;
}

export interface PendingPayment {
  id: number;
  user_id: string;
  variable_symbol: number;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: 'pending' | 'matched' | 'expired' | 'cancelled';
  matched_at: string | null;
  expires_at: string;
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

export interface ReferralCode {
  id: string;
  code: string;
  owner_id: string;
  is_active: boolean;
  discount_pct: number;
  reward_pct: number;
  created_at: string;
}

export interface ReferralUse {
  id: string;
  code: string;
  owner_id: string;
  used_by: string;
  plan: string;
  original_amount: number;
  discount_amount: number;
  reward_amount: number;
  payment_id: number | null;
  paid_out: boolean;
  created_at: string;
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
  /** null = privacy hidden (user opted out of showing profit to friends) */
  total_profit: number | null;
  /** null = privacy hidden */
  roi: number | null;
  achievements_count: number;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  role: 'owner' | 'member';
  member_count: number;
}

export interface GroupMember {
  user_id: string;
  username: string | null;
  display_name: string | null;
  role: 'owner' | 'member';
  joined_at: string;
  character_skin?: string | null;
  character_hair?: string | null;
  character_hair_color?: string | null;
  character_outfit?: string | null;
  character_accessory?: string | null;
}
