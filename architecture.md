# Karada Architecture — Python Protocol Engine

Karada is a protocol layer, not a single-product app. The first product surface is a mobile-friendly Next.js client, but the core protocol supports three product families:

- **Commerce** — courier tracking or delivery signature proof.
- **School fees** — admission letter, school invoice, or registrar confirmation proof.
- **Savings** — savings goal, lock confirmation, or custodian attestation proof.

All three flows use the same Lightning escrow primitive: a hidden 32-byte preimage, a SHA256 payment hash, and a BOLT11 HODL invoice. Funds are locked by the Lightning Network HTLC route and are released only when Karada reveals the preimage after agreed proof is verified.

## Canonical stack

The canonical implementation is now the Python backend with a Next.js frontend.

```text
karada/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── app/
│       ├── api.py          # FastAPI REST API
│       ├── lnd_client.py   # LND REST client with deterministic mock mode
│       ├── models.py       # SQLAlchemy models and SQLite/PostgreSQL setup
│       ├── repository.py   # database access layer
│       ├── services.py     # escrow state machine and protocol rules
│       └── workers.py      # invoice and oracle polling workers
├── frontend/
│   └── app/page.tsx        # product studio, checkout, merchant, oracle UI
└── designs/
```

## Protocol state machine

```text
PENDING
  └─ buyer pays BOLT11 HODL invoice
HELD
  └─ merchant/school/savings party submits proof
IN_PROGRESS
  └─ oracle verifies proof
DELIVERED_INSPECTING
  ├─ buyer accepts -> SETTLED
  ├─ buyer disputes -> DISPUTED -> SETTLED or REFUNDED
  └─ inspection window expires -> SETTLED
```

Refund/cancel paths are available for pending or active escrows. The server never exposes the preimage to users; only the LND client can settle or cancel the invoice.

## Backend API

Run from the repository root:

```bash
cd backend
../backend/jarso/bin/pip install -r requirements.txt
../backend/jarso/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

For local/demo mode, Karada uses mock LND automatically when no LND macaroon is detected:

```bash
export LND_MOCK=true
```

Core endpoints:

- `GET /api/v1/products` — product families and proof models.
- `POST /api/v1/escrow` — create a HODL invoice escrow.
- `GET /api/v1/escrow` — list escrows, optionally filtered by `product_type` or `status`.
- `GET /api/v1/escrow/{payment_hash}` — get escrow status.
- `POST /api/v1/escrow/{payment_hash}/pay` — simulate or record buyer payment.
- `POST /api/v1/escrow/ship` — commerce courier tracking submission.
- `POST /api/v1/escrow/{payment_hash}/fulfill` — school fees or savings proof submission.
- `POST /api/v1/oracle/simulate-delivery` — verify proof and open inspection.
- `POST /api/v1/escrow/{payment_hash}/accept` — release preimage and settle.
- `POST /api/v1/escrow/{payment_hash}/dispute` — keep preimage hidden.
- `POST /api/v1/escrow/{payment_hash}/settle-dispute` — resolve as settle or refund.
- `POST /api/v1/escrow/{payment_hash}/cancel` — cancel and refund path.
- `POST /api/v1/workers/auto-release` — run inspection expiry and invoice expiry jobs.

## LND integration

`backend/app/lnd_client.py` wraps LND REST HODL invoice endpoints:

- `POST /v2/invoices/hodl` creates the HODL invoice from a generated preimage.
- `GET /v1/invoice/{r_hash}` checks whether payment is accepted/held.
- `POST /v2/invoices/hodl/settle` releases the preimage.
- `POST /v2/invoices/hodl/cancel` cancels the invoice.

When no LND credentials are present, the client returns deterministic `lnbc...` mock invoices so the product can be demoed and tested without a Polar node.

## Persistence

The default local database is SQLite:

```bash
sqlite:///./karada.db
```

For production, set:

```bash
export DATABASE_URL="postgresql+psycopg2://user:password@host:5432/karada"
```

The SQLAlchemy models are database-agnostic and already include indexes for payment hashes, product types, statuses, tracking numbers, and proof references.

## Frontend

The Next.js app proxies `/api/v1/*` to the Python backend on port `8000`:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

The UI has four operational views:

1. **Create** — choose commerce, school fees, or savings and create a HODL invoice.
2. **Checkout** — scan or copy the BOLT11 invoice and simulate payment.
3. **Merchant** — submit courier tracking or document/savings proof.
4. **Oracle** — verify proof and open the buyer inspection window.

## Security model

- The preimage is generated server-side and stored only in the escrow record.
- The API never returns the preimage.
- Settlement requires either buyer acceptance, auto-release after inspection expiry, or dispute settlement.
- Disputes keep the preimage hidden until an explicit settlement decision.
- LND private keys never live in Karada; Karada only calls LND invoice operations with macaroon permissions.
