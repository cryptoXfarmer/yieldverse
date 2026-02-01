import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FAUCETPAY_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'FaucetPay API key not configured' }, { status: 500 })
    }

    // FaucetPay API - Get balance
    const formData = new FormData()
    formData.append('api_key', apiKey)
    formData.append('currency', 'LTC')

    const response = await fetch('https://faucetpay.io/api/v1/balance', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (data.status === 200) {
      return NextResponse.json({
        success: true,
        balance: data.balance,
        balance_bitcoin: data.balance_bitcoin,
        currency: data.currency
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: data.message || 'Failed to fetch balance' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('FaucetPay API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
