# Karada Pitch Deck - Hackathon Presentation

## The Problem: Cross-Border Trust Deficit

When an artisan in Nairobi sells handcrafted goods to a buyer in New York, a massive trust gap exists that costs Africa billions in lost commerce annually.

### Traditional Solutions Fail

| Problem | Traditional Escrow | Karada |
|---------|-----------------|--------|
| **Trust** | Requires pre-payment or pre-shipment | Cryptographic proof of funds |
| **Fees** | 3-6% + wire fees | ~0.1% (Lightning fees) |
| **Speed** | 3-7 business days | Instant settlement |
| **Chargebacks** | Buyer can reverse payment | Irreversible once settled |
| **Minimums** | $100+ minimums | Any amount, even 1 satoshi |

---

## Why Not Multisig?

### Multisig Limitations
- **Requires wallet integration** - Both parties must use compatible wallets
- **On-chain only** - Slow and expensive Bitcoin transactions
- **Complex key management** - 2-of-2 or 2-of-3 schemes require key backup
- **No time-lock flexibility** - Cannot easily implement refund windows
- **High barrier to entry** - Non-technical users struggle with key coordination

### HTLC Advantage
- **BOLT-11 Lightning** - Works with any Lightning wallet
- **Native time-lock** - Built-in expiry for automatic refunds
- **No wallet integration** - Just scan a QR code
- **Atomic swaps** - All-or-nothing settlement
- **Instant** - Sub-second finality

---

## Why Lightning Over Traditional Currency?

### The Fiat Problem
1. **Correspondent banking fees** - Multiple intermediaries take cuts
2. **Currency conversion losses** - KES to USD to KES erodes margins
3. **Settlement delays** - T+2 clearing, weekends, holidays
4. **Reversible payments** - "Friendly fraud" costs merchants 2-5% of revenue
5. **Capital controls** - Kenya restricts large outflows

### Lightning Solution
- **Direct peer-to-peer** - No intermediaries
- **Same currency** - Both parties use sats, no conversion
- **24/7/365** - Bitcoin never sleeps
- **Irreversible** - Once settled, payment is final
- **Programmable money** - Smart contracts enforce rules

---

## How Karada Earns Revenue

### Revenue Model: Bitcoin Fee Capture

Karada operates as a **fee-taking node** in the Lightning Network:

1. **Routing Fees** - We collect tiny fees (1-100 ppm) for routing payments through our node
2. **No Platform Fees** - We don't charge merchants or buyers directly
3. **Liquidity Provider** - We provide inbound liquidity to merchants, earning yield
4. **Future: Premium Features** - Advanced analytics, multi-signature oracles, insurance

### Why This Works
- **Network effect** - More users = more routing volume
- **Bitcoin-native** - Revenue is in BTC, not fiat
- **Scalable** - Fees scale with network usage, not transaction count
- **Permissionless** - Anyone can run a Karada node

---

## Why No Wallet Connection?

### BOLT-11 Magic

**BOLT-11** is the Lightning Network payment invoice format. It contains everything needed:

- **Payment hash** - The cryptographic commitment
- **Amount** - Exact sats to pay
- **Expiry** - Time-lock for the HTLC
- **Destination** - Which node receives the payment

Buyers simply scan a QR code with their existing Lightning wallet. No app install, no account creation, no KYC.

### The Flow
1. Buyer scans `lnbc50000...` QR code
2. Wallet pays the HODL invoice
3. Funds are cryptographically locked
4. Merchant sees "HELD" status
5. On delivery, preimage is released
6. Merchant claims funds

---

## Future Ideas

### Phase 2: Multi-Oracle
- Multiple courier APIs for redundancy
- Community-verified delivery confirmations
- Reputation scoring for oracles

### Phase 3: Merchant Tools
- Point-of-sale integration
- Inventory management
- Shipping label generation

### Phase 4: Global Network
- Federated Karada nodes
- Cross-node escrow routing
- Decentralized oracle network

---

## Technical Architecture

### State Machine
```
PENDING → HELD → SHIPPED → SETTLED
                   ↓
                 REFUNDED (on expiry)
```

### Security Model
- **Preimage never leaves** the Karada server
- **Time-lock enforced** by Bitcoin consensus
- **No private keys** stored on server
- **Audit trail** via payment hashes

---

## Call to Action

**Karada is ready for the hackathon demo.** 

Run the backend, open the frontend, and watch trustless commerce in action.

