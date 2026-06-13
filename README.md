# Karada (🎴) — Lightning Escrow Protocol for Commerce, School Fees, and Savings

**Karada** is a protocol layer for trustless escrow on Bitcoin Lightning. It uses BOLT11 HODL invoices and HTLC time-locks so funds can be committed without releasing the secret preimage until agreed proof is verified.

The current implementation uses a **Python FastAPI backend** and a **Next.js frontend**. The protocol is product-agnostic and supports:

- **Commerce** — courier tracking or delivery signature proof.
- **School fees** — admission letter, school invoice, or registrar confirmation proof.
- **Savings** — savings goal, lock confirmation, or custodian attestation proof.

## Why Karada

Traditional escrow requires a trusted intermediary to hold funds. Karada keeps funds cryptographically locked in the Lightning Network:

1. Karada generates a hidden 32-byte preimage.
2. It derives the SHA256 payment hash.
3. It creates a BOLT11 HODL invoice for that payment hash.
4. The buyer pays the invoice; the HTLC locks funds in flight.
5. The provider submits proof: courier tracking, school document, or savings lock confirmation.
6. The oracle verifies proof and opens an inspection window.
7. Acceptance releases the preimage and settles the invoice; dispute keeps the preimage hidden.

## Local demo

### 1. Start the Python backend

```bash
cd backend
../backend/jarso/bin/pip install -r requirements.txt
export LND_MOCK=true
../backend/jarso/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend exposes `http://localhost:8000` and defaults to SQLite at `karada.db`.

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

The frontend proxies `/api/v1/*` to the Python backend on port `8000`.

## Demo flow

1. Open **Create** and select **Commerce**, **School Fees**, or **Savings**.
2. Enter title, amount in sats, description, counterparty, and proof reference.
3. Click **Generate HODL Invoice**.
4. Open **Checkout**, scan/copy the BOLT11 invoice, then click **Simulate Payment**.
5. Open **Merchant**, submit courier tracking or document/savings proof.
6. Open **Oracle**, click **Simulate Verified Proof**.
7. Return to **Checkout** and click **Accept & Release**.

## Core API

- `GET /api/v1/products`
- `POST /api/v1/escrow`
- `GET /api/v1/escrow`
- `GET /api/v1/escrow/{payment_hash}`
- `POST /api/v1/escrow/{payment_hash}/pay`
- `POST /api/v1/escrow/ship`
- `POST /api/v1/escrow/{payment_hash}/fulfill`
- `POST /api/v1/oracle/simulate-delivery`
- `POST /api/v1/escrow/{payment_hash}/accept`
- `POST /api/v1/escrow/{payment_hash}/dispute`
- `POST /api/v1/escrow/{payment_hash}/settle-dispute`
- `POST /api/v1/escrow/{payment_hash}/cancel`
- `POST /api/v1/workers/auto-release`

## LND mode

For local development or hackathon demos, set:

```bash
export LND_MOCK=true
```

Karada will return deterministic mock `lnbc...` invoices and no-op settle/cancel calls. For real Lightning, configure LND REST credentials:

```bash
export LND_DIR="/path/to/lnd/node"
export LND_REST_HOST="https://localhost:8082"
export LND_MACAROON="admin.macaroon"
export LND_VERIFY_TLS="false"
```

## Project structure

```text
backend/app/api.py          # REST routes
backend/app/services.py     # escrow state machine
backend/app/lnd_client.py   # LND REST + mock invoice client
backend/app/models.py       # SQLAlchemy models
backend/app/repository.py   # database access
backend/app/workers.py      # polling workers
frontend/app/page.tsx       # product studio, checkout, merchant, oracle UI
architecture.md             # protocol architecture
```

## License

MIT
