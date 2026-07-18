# Karada Pitch Deck

## The problem: trust without custody

Karada solves trust gaps where two parties need assurance before value moves:

- A buyer wants proof that goods, school fees, or savings commitments will be fulfilled.
- A merchant, school, or savings organizer wants proof that funds are committed before delivering value.
- Both sides want finality without chargebacks, bank delays, or a centralized escrow operator holding custody.

## The Karada protocol

Karada uses Lightning HODL invoices and HTLC time-locks:

1. Karada generates a hidden 32-byte preimage.
2. The preimage hash becomes the invoice payment hash.
3. The buyer pays a BOLT11 HODL invoice.
4. Funds are locked in the Lightning Network but not released.
5. The counterparty submits proof.
6. An oracle verifies proof and opens an inspection window.
7. Acceptance reveals the preimage and settles; dispute keeps the preimage hidden.

## Product families

Karada is not limited to commerce. The same escrow primitive applies to:

| Product | Proof Karada verifies | Settlement condition |
|---|---|---|
| Commerce | Courier tracking, delivery signature, or carrier event | Goods delivered and accepted |
| School fees | Admission letter, invoice, registrar confirmation | School obligation verified |
| Savings | Savings goal, lock confirmation, custodian attestation | Savings condition verified |

## Why HTLC/HODL invoices

| Traditional escrow | Karada |
|---|---|
| Custodian holds funds | Funds are locked in Lightning routing |
| 3–7 day settlement | Instant settlement after preimage release |
| High fees and minimums | Sats-scale payments |
| Chargeback risk | Lightning settlement is final |
| One product workflow | Reusable protocol for commerce, school fees, and savings |

## Demo experience

The Next.js app has four views:

1. **Create** — choose commerce, school fees, or savings and generate a HODL invoice.
2. **Checkout** — scan/copy the BOLT11 invoice and simulate payment.
3. **Merchant** — submit courier tracking or document/savings proof.
4. **Oracle** — verify proof and open the inspection window.

Run:

```bash
cd backend
export LND_MOCK=true
../backend/jarso/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload

cd ../frontend
npm run dev
```

Open `http://localhost:3000`.

## Technical stack

- **Backend:** Python FastAPI, SQLAlchemy, LND REST HODL invoice client.
- **Frontend:** Next.js, TypeScript, Tailwind CSS, QR invoice display.
- **Storage:** SQLite by default; PostgreSQL-ready through `DATABASE_URL`.
- **Lightning:** BOLT11 HODL invoices, HTLC locks, preimage settlement.

## Call to action

Karada turns trust into a verifiable protocol: lock funds with Lightning, verify real-world proof, then release or dispute without a centralized custodian.
