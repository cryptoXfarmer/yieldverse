import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { cashout_id, email, amount_usd } = await request.json()

    if (!email || !amount_usd) {
      return NextResponse.json({ error: 'Missing email or amount' }, { status: 400 })
    }

    const apiKey = process.env.FAUCETPAY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'FaucetPay API key not configured' }, { status: 500 })
    }

    // Convertir USD en satoshis LTC
    // 1 LTC ≈ $100 (approximation, tu peux ajuster)
    // amount_usd * 100000000 / 100 = amount_usd * 1000000 satoshis
    const ltcPriceUsd = 100 // Prix approximatif du LTC
    const amountSatoshis = Math.floor((amount_usd / ltcPriceUsd) * 100000000)

    // Minimum FaucetPay = 1 satoshi, mais on met un minimum raisonnable
    if (amountSatoshis < 1000) {
      return NextResponse.json({ error: 'Amount too small' }, { status: 400 })
    }

    // Appeler l'API FaucetPay pour envoyer le paiement
    const formData = new FormData()
    formData.append('api_key', apiKey)
    formData.append('to', email)
    formData.append('amount', amountSatoshis.toString())
    formData.append('currency', 'LTC')

    const response = await fetch('https://faucetpay.io/api/v1/send', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (data.status === 200) {
      // Succès ! Mettre à jour le cashout comme completed
      if (cashout_id) {
        await supabase
          .from('cashouts')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', cashout_id)
      }

      return NextResponse.json({
        success: true,
        message: `Sent ${amountSatoshis} satoshis LTC to ${email}`,
        payout_id: data.payout_id,
        payout_user_hash: data.payout_user_hash
      })
    } else {
      // Erreur FaucetPay
      return NextResponse.json({ 
        success: false, 
        error: data.message || 'FaucetPay error',
        code: data.status
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Process cashout error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
