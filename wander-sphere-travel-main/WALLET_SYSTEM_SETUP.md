# Nomad Wallet System - Complete Setup Guide

## ✅ All Files Recreated and Updated

### Frontend Files Created:
1. ✅ `src/services/walletService.ts` - Wallet service with all CRUD operations
2. ✅ `src/pages/WalletPage.tsx` - Main wallet dashboard
3. ✅ `src/components/wallet/AddMoneyModal.tsx` - Razorpay payment modal
4. ✅ `src/components/wallet/BookingWalletWidget.tsx` - Compact wallet widget

### Frontend Files Updated:
5. ✅ `src/config/api.ts` - Added wallet endpoints
6. ✅ `src/pages/Profile.tsx` - Added Wallet tab
7. ✅ `src/pages/BookingSpace.tsx` - Added wallet widget at top

### Backend Files Created:
8. ✅ `backend/routes/wallet.js` - Wallet API routes

### Backend Files Updated:
9. ✅ `backend/server.js` - Added wallet routes

### Supabase Migration Created:
10. ✅ `supabase/migrations/create_wallet_system.sql` - Complete database setup

---

## 🚀 Next Steps (CRITICAL)

### Step 1: Run Supabase Migration

**IMPORTANT:** You MUST run the SQL migration in your Supabase dashboard:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Open the file: `supabase/migrations/create_wallet_system.sql`
5. Copy the entire SQL content
6. Paste it into the SQL Editor
7. Click **Run** or press `Ctrl+Enter`

This will create:
- `wallets` table
- `wallet_transactions` table
- RLS (Row Level Security) policies
- `process_wallet_transaction()` function
- `get_wallet_summary()` helper function
- Indexes for performance
- Triggers for auto-updating timestamps

### Step 2: Configure Razorpay

1. **Get Razorpay Keys:**
   - Sign up at https://razorpay.com
   - Get your `Key ID` and `Key Secret` from the dashboard

2. **Add Environment Variables:**

   **Frontend (`.env` or Vercel):**
   ```env
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

   **Backend (`.env` or Render):**
   ```env
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

3. **Install Razorpay SDK (Backend):**
   ```bash
   cd backend
   npm install razorpay
   ```

4. **Update Backend Route:**
   - Open `backend/routes/wallet.js`
   - Uncomment the Razorpay integration code (lines 40-55)
   - Remove or comment out the mock order response (lines 58-68)

---

## 📋 What the System Does

### Wallet Features:
- ✅ **Balance Management** - Track user wallet balance in INR
- ✅ **Add Money** - Via Razorpay payment gateway
- ✅ **Withdraw Money** - Request withdrawal (manual processing)
- ✅ **Transaction History** - View all wallet transactions
- ✅ **Transaction Types:**
  - `deposit` - Money added via Razorpay
  - `booking_payment` - Payment for bookings (future)
  - `refund` - Refunds from cancelled bookings
  - `withdrawal` - Money withdrawn
  - `cashback` - Cashback rewards (future)

### UI Locations:
- ✅ **Profile Page** - Full wallet dashboard in "Wallet" tab
- ✅ **Booking Page** - Compact wallet widget at top
- ✅ **Home Page** - No wallet UI (remains social-only)

---

## 🧪 Testing Checklist

After running the migration and configuring Razorpay:

- [ ] **Test Wallet Creation:**
  - Log in → Profile → Wallet tab
  - Wallet should be created automatically

- [ ] **Test Add Money:**
  - Click "Add Money" → Enter ₹500
  - Complete Razorpay payment
  - Verify balance updates

- [ ] **Test Transaction History:**
  - View transaction list
  - Verify deposit appears with correct details

- [ ] **Test Withdrawal:**
  - Click "Withdraw" → Enter amount
  - Verify withdrawal request is created
  - Check transaction shows as "pending"

- [ ] **Test Booking Widget:**
  - Go to Booking page
  - Verify wallet widget shows balance
  - Test "Add" button

---

## 🔒 Security Features

The Supabase migration includes:
- ✅ **Row Level Security (RLS)** - Users can only see their own wallet
- ✅ **Secure Transaction Function** - Atomic operations with locking
- ✅ **Balance Validation** - Prevents negative balances
- ✅ **Transaction Validation** - Validates transaction types

---

## 📝 Manual Withdrawal Processing

Since this is an MVP without RazorpayX Payout API:

1. **Check Withdrawal Requests:**
   ```sql
   SELECT * FROM wallet_transactions 
   WHERE type = 'withdrawal' AND status = 'pending'
   ORDER BY created_at DESC;
   ```

2. **Process Payout:**
   - Transfer money via UPI/Bank transfer
   - Update transaction status:
   ```sql
   UPDATE wallet_transactions 
   SET status = 'completed' 
   WHERE id = 'transaction_id';
   ```

---

## 🎉 Ready to Deploy!

Once you:
1. ✅ Run the Supabase migration
2. ✅ Configure Razorpay keys
3. ✅ Install Razorpay SDK
4. ✅ Update backend route

The wallet system will be **fully functional**! 🚀

---

## 📁 File Structure

```
wander-sphere-travel-main/
├── src/
│   ├── services/
│   │   └── walletService.ts          ✅ Created
│   ├── pages/
│   │   ├── WalletPage.tsx            ✅ Created
│   │   ├── Profile.tsx                ✅ Updated
│   │   └── BookingSpace.tsx          ✅ Updated
│   ├── components/
│   │   └── wallet/
│   │       ├── AddMoneyModal.tsx     ✅ Created
│   │       └── BookingWalletWidget.tsx ✅ Created
│   └── config/
│       └── api.ts                    ✅ Updated
├── backend/
│   ├── routes/
│   │   └── wallet.js                 ✅ Created
│   └── server.js                     ✅ Updated
└── supabase/
    └── migrations/
        └── create_wallet_system.sql  ✅ Created
```

---

## ⚠️ Important Notes

1. **Supabase Migration is REQUIRED** - The app won't work without running the SQL
2. **Razorpay Keys are REQUIRED** - For production payments
3. **Withdrawals are Manual** - No automatic payout API (by design for MVP)
4. **Home Page is Untouched** - No wallet UI on social feed (as required)

---

## 🆘 Troubleshooting

**Error: "Failed to fetch wallet"**
- Check if Supabase migration was run
- Verify RLS policies are active

**Error: "Failed to create payment order"**
- Check Razorpay keys in environment variables
- Verify backend route is uncommented

**Error: "Insufficient Wallet Balance"**
- Check wallet balance before withdrawal
- Verify transaction function is working

---

**All files are ready! Just run the Supabase migration and configure Razorpay!** 🎉

