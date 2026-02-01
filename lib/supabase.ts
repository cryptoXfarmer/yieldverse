import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  username: string
  email: string
  total_energy_earned: number
  total_fuel_earned: number
  total_yes_earned: number
  total_cashout_usd: number
  last_daily_claim: string | null
  created_at: string
  updated_at: string
}

export type Wallet = {
  id: string
  user_id: string
  energy: number
  fuel: number
  yes_tokens: number
  litecoin_address: string | null
}
