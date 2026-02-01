# 🌍 YIELDVERSE HUB

**Le portail central pour tous tes jeux P2E!**

---

## 🎯 FEATURES:

- ✅ Universal Login (1 account = all games)
- ✅ YES Token Balance tracking
- ✅ Multi-game dashboard
- ✅ Conversion Center (Game currency → YES)
- ✅ Cashout to FaucetPay (YES → LTC)
- ✅ Transaction history
- ✅ Referral system

---

## 🎮 GAMES INTÉGRÉS:

### ⚡ Energy Empire
- **Currency:** Fuel
- **Rate:** 100 Fuel = 1 YES
- **URL:** energy-empire.space

### 🌟 StarForge PTC (Coming Soon)
- **Currency:** StarCoins  
- **Rate:** 500 StarCoins = 1 YES
- **Status:** In Development

---

## 🗄️ DATABASE SETUP:

### 1. Create Supabase Project
```
Project name: yieldverse-hub
Region: Closest to you
```

### 2. Run SQL Schema
```sql
-- See YIELDVERSE-SCHEMA.sql file
-- Copy and paste in Supabase SQL Editor
```

### 3. Configure Auth
```
- Enable Email/Password auth
- Disable email confirmation (for alpha)
```

---

## ⚙️ INSTALLATION:

### 1. Extract files
```bash
unzip yieldverse-hub.zip
cd yieldverse-hub
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run development server
```bash
npm run dev
```

Open http://localhost:3000

---

## 🚀 DEPLOYMENT:

### Vercel (Recommended):
1. Push to GitHub
2. Import on Vercel
3. Add environment variables
4. Deploy!

### Custom Domain:
1. Buy domain (yieldverse.space)
2. Configure DNS → Vercel
3. Done!

---

## 💰 CONVERSION RATES:

```javascript
const RATES = {
  'energy-empire': {
    currency: 'fuel',
    rate: 100, // 100 Fuel = 1 YES
  },
  'starforge-ptc': {
    currency: 'starcoins',
    rate: 500, // 500 StarCoins = 1 YES
  }
}

const CASHOUT = {
  min_yes: 10,
  yes_per_ltc: 1000, // 1000 YES = 0.01 LTC
  fee_percent: 5,
}
```

---

## 🔗 INTEGRATION GUIDE:

### Link Energy Empire:

1. **Share Auth**
   - Same Supabase project
   - Same email = same user

2. **Read Fuel Balance**
```javascript
const { data } = await supabase
  .from('wallets')
  .select('fuel')
  .eq('user_id', userId)
  .single()
```

3. **Convert Fuel → YES**
```javascript
// Deduct fuel from Energy Empire
await supabase
  .from('wallets')
  .update({ fuel: fuel - amount })
  
// Add YES to YieldVerse
await supabase
  .from('yieldverse_users')
  .update({ total_yes_balance: balance + yesAmount })
```

---

## 📊 REVENUE MODEL:

### Income:
- Energy Empire ads: $60-120/day
- StarForge PTC ads: $40-80/day
- **Total: $100-200/day**

### Expenses:
- Cashouts: ~$5-10/day
- FaucetPay fees: ~5%
- **Total: ~$10-15/day**

### Net Profit:
**$85-185/day = $2,500-5,500/month!** 💰

---

## 🧪 TESTING:

### Test Flow:
1. Register account
2. Check YES balance (should be 0)
3. Go to Energy Empire
4. Earn 100 Fuel
5. Return to YieldVerse
6. Convert 100 Fuel → 1 YES
7. Check balance (should be 1 YES)
8. Try cashout (need 10 YES minimum)

---

## 🐛 TROUBLESHOOTING:

### "Cannot connect to Supabase"
→ Check .env.local has correct credentials

### "Conversion failed"
→ Verify user has enough game currency

### "Cashout pending forever"
→ Check FaucetPay API connection

---

## 📝 TODO:

- [ ] Enable RLS policies
- [ ] Add email notifications
- [ ] Implement referral system
- [ ] Add achievement badges
- [ ] Create leaderboard
- [ ] Integrate StarForge PTC

---

## 🎊 LAUNCH CHECKLIST:

- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Energy Empire linked
- [ ] Conversion tested
- [ ] Cashout tested (with small amount)
- [ ] FaucetPay API working
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Alpha testers invited

---

**READY TO LAUNCH!** 🚀

Questions? Check the guides or contact support!
