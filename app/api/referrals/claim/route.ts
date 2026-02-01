import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const { user_id, resource } = await req.json()

    if (!user_id || !resource) {
      return NextResponse.json({ success: false, error: 'Missing user_id or resource' }, { status: 400 })
    }

    if (!['energy', 'rare', 'fuel', 'all'].includes(resource)) {
      return NextResponse.json({ success: false, error: 'Invalid resource type' }, { status: 400 })
    }

    // Use service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get pending referral earnings
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('ref_pending_energy, ref_pending_rare, ref_pending_fuel')
      .eq('id', user_id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const pendingEnergy = userData.ref_pending_energy || 0
    const pendingRare = userData.ref_pending_rare || 0
    const pendingFuel = userData.ref_pending_fuel || 0

    // Nothing to claim
    if (resource === 'all' && pendingEnergy === 0 && pendingRare === 0 && pendingFuel === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to claim' }, { status: 400 })
    }
    if (resource === 'energy' && pendingEnergy === 0) {
      return NextResponse.json({ success: false, error: 'No energy to claim' }, { status: 400 })
    }
    if (resource === 'rare' && pendingRare === 0) {
      return NextResponse.json({ success: false, error: 'No rare to claim' }, { status: 400 })
    }
    if (resource === 'fuel' && pendingFuel === 0) {
      return NextResponse.json({ success: false, error: 'No fuel to claim' }, { status: 400 })
    }

    // Get current wallet
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('energy, rare_resources, fuel')
      .eq('user_id', user_id)
      .single()

    if (walletError || !walletData) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
    }

    // Build updates based on what to claim
    const walletUpdate: any = {}
    const userPendingReset: any = {}
    const userEarningsUpdate: any = {}
    let claimedEnergy = 0, claimedRare = 0, claimedFuel = 0

    if (resource === 'energy' || resource === 'all') {
      if (pendingEnergy > 0) {
        walletUpdate.energy = (walletData.energy || 0) + pendingEnergy
        userPendingReset.ref_pending_energy = 0
        claimedEnergy = pendingEnergy
      }
    }
    if (resource === 'rare' || resource === 'all') {
      if (pendingRare > 0) {
        walletUpdate.rare_resources = (walletData.rare_resources || 0) + pendingRare
        userPendingReset.ref_pending_rare = 0
        claimedRare = pendingRare
      }
    }
    if (resource === 'fuel' || resource === 'all') {
      if (pendingFuel > 0) {
        walletUpdate.fuel = (walletData.fuel || 0) + pendingFuel
        userPendingReset.ref_pending_fuel = 0
        claimedFuel = pendingFuel
      }
    }

    // Apply wallet update
    if (Object.keys(walletUpdate).length > 0) {
      await supabase.from('wallets').update(walletUpdate).eq('user_id', user_id)
    }

    // Reset pending + update lifetime totals
    if (Object.keys(userPendingReset).length > 0) {
      // Get current lifetime totals
      const { data: currentUser } = await supabase
        .from('users')
        .select('ref_earnings_energy, ref_earnings_rare, ref_earnings_fuel, ref_total_claimed_energy, ref_total_claimed_rare, ref_total_claimed_fuel')
        .eq('id', user_id)
        .single()

      const updates: any = { ...userPendingReset }
      if (claimedEnergy > 0) updates.ref_total_claimed_energy = (currentUser?.ref_total_claimed_energy || 0) + claimedEnergy
      if (claimedRare > 0) updates.ref_total_claimed_rare = (currentUser?.ref_total_claimed_rare || 0) + claimedRare
      if (claimedFuel > 0) updates.ref_total_claimed_fuel = (currentUser?.ref_total_claimed_fuel || 0) + claimedFuel

      await supabase.from('users').update(updates).eq('id', user_id)
    }

    // Log the claim
    try {
      await supabase.from('referral_claims').insert({
        user_id,
        energy_claimed: claimedEnergy,
        rare_claimed: claimedRare,
        fuel_claimed: claimedFuel
      })
    } catch (e) { /* table might not exist yet */ }

    return NextResponse.json({
      success: true,
      claimed: {
        energy: claimedEnergy,
        rare: claimedRare,
        fuel: claimedFuel
      }
    })

  } catch (err: any) {
    console.error('Claim error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
