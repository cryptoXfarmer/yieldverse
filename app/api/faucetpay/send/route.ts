import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, amount_usd } = await request.json()

    if (!email || !amount_usd) {
      return NextResponse.json({ success: false, error: 'Missing email or amount' }, { status: 400 })
    }

    const apiKey = process.env.FAUCETPAY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'FaucetPay API not configured' }, { status: 500 })
    }

    // Convertir USD en satoshis LTC
    // Prix LTC approximatif (tu peux ajuster ou fetch le prix réel)
    const LTC_PRICE_USD = 120 // ~$120 par LTC
    const amountSatoshis = Math.floor((amount_usd / LTC_PRICE_USD) * 100000000)

    // Minimum FaucetPay
    if (amountSatoshis < 1) {
      return NextResponse.json({ success: false, error: 'Amount too small' }, { status: 400 })
    }

    // Appeler l'API FaucetPay
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

    console.log('FaucetPay response:', data)

    if (data.status === 200) {
      return NextResponse.json({
        success: true,
        message: `Sent ${amountSatoshis} satoshis to ${email}`,
        payout_id: data.payout_id,
        balance: data.balance
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: data.message || `FaucetPay error (${data.status})`,
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('FaucetPay send error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 })
  }
}
