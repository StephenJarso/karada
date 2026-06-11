Here is your updated, comprehensive architecture.md file tailored specifically for your Python REST backend and Next.js frontend. It integrates your existing LNDClient class structure, maps out the database requirements, and handles the "block of wood" fraud loop seamlessly.
🎴 Architecture & Design Protocol — Project Karada

Karada is a trustless, non-custodial cross-border e-commerce escrow application optimized for mobile deployment. It leverages the Bitcoin Lightning Network (HODL Invoices) and real-world logistics telemetry to securely lock funds in transit. This protocol ensures that an international buyer (e.g., in the USA) and a micro-merchant (e.g., in Nairobi) can exchange high-value physical goods without a centralized third party holding custody of the underlying assets.
1. System Topology & Global Data Flow

The architecture consists of a unified Next.js progressive web application (running on client mobile devices), a Python REST backend engine (using FastAPI or Flask), and an LND (Lightning Network Daemon) node accessed via REST using macaroon authentication.
```
+-----------------------------------------------------------------------+
|                      UNIFIED CLIENT PHONE APPLICATION                 |
|                                                                       |
|   [ MERCHANT VIEWS ]                          [ CUSTOMER VIEWS ]      |
|   - Form: Create Escrow Contract              - Display: Bolt11 QR    |
|   - Dispatch: Log Tracking ID                 - Action: Accept/Dispute|
+-----------------------------------------------------------------------+
                |                                       ^
                | HTTP REST POSTs                       | WebSockets / polling
                v                                       | (Real-time Status)
+-----------------------------------------------------------------------+
|                         PYTHON REST BACKEND                           |
|                                                                       |
|   +-------------------+  +--------------------+  +----------------+   |
|   |  FastAPI / Flask  |  |   Invoice Poller   |  |  Oracle Worker |   |
|   |   (REST Routing)  |  | (Status Threads)   |  | (DHL / Courier)|   |
|   +---------+---------+  +---------+----------+  +--------+-------+   |
|             |                      |                      |           |
|             +----------------------+----------------------+           |
|                                    v                                  |
|                     PostgreSQL Database (State Storage)               |
+-----------------------------------------------------------------------+
                                     |
                                     | HTTP REST (Macaroon Auth, Verify=False)
                                     v
+-----------------------------------------------------------------------+
|                       LOCAL LND NODE (via Polar)                      |
|   - Preimage Ledger Vault (Stored in Python backend DB)               |
|   - HODL Invoice Endpoints (`/v1/invoices/hodl`)                      |
+-----------------------------------------------------------------------+
                                     |
                                     v Lightning Network Channels
+-----------------------------------------------------------------------+
|                  THE LIGHTNING NETWORK RAILWAY (HTLC)                 |
|   🔒 ESCROW SITE: Funds frozen inside network routing scripts.        |
+-----------------------------------------------------------------------+
```
2. Core Protocol Lifecycle (State Machine)

To guarantee absolute protocol safety—including mitigating the risk of a malicious merchant shipping a fraud payload (e.g., shipping a block of wood instead of the contracted artifact)—the transaction transitions through 5 distinct states:
```
[1. PENDING] ------(Customer Pays Invoice)------> [2. HELD / ESCROWED]
                                                            |
                                                   (Merchant Dispatches)
                                                            v
[4. DISPUTED] <---(Customer Opens Dispute)--- [3. DELIVERED / INSPECTING]
      |                                                     |
 (Arbitration)                                     (24h Auto-Settle / Accept)
      v                                                     v
[CANCELLED / REFUND]                                [5. SETTLED / PAID]
```
    PENDING: Merchant defines parameters (Price, Item Name). Python backend generates a secret random 32-byte string (the preimage), calculates its SHA256 payment_hash, records it to PostgreSQL, and calls LND's HODL invoice creator. A Bolt11 string is returned to the UI.

    HELD / ESCROWED: The customer copies the invoice to their phone lightning wallet and executes the payment. The funds pass through the network and freeze at the final routing node hop. The Python invoice poller detects this status change and flips the state in the DB to HELD.

    DELIVERED / INSPECTING (The Fraud Guard): The merchant inputs the DHL tracking number, moving the status to SHIPPED. The Python backend background worker continuously scans the courier API. The moment the package lands at the destination address, the status moves to DELIVERED / INSPECTING. The preimage is not yet released. This opens a strict 24-hour countdown window.

    DISPUTED: If the customer opens the package and discovers a block of wood, they trigger the dispute hook. The timer stops. Funds stay locked in the network. The Karada platform steps in to review photo/video telemetry.

    SETTLED: If the customer verifies the item and clicks "Accept" (or if the 24-hour timer expires without a dispute), the Python backend sends the preimage to LND's settle endpoint. The frozen funds snap instantly into the merchant's spendable wallet.

3. Python Backend Architectural Design

Your Python backend must be extended to support HODL invoices, state persistence, and background logistics polling loop tasks.
Database Schema (PostgreSQL Essential Model)
SQL

CREATE TYPE escrow_state AS ENUM ('PENDING', 'HELD', 'SHIPPED', 'DELIVERED_INSPECTING', 'DISPUTED', 'SETTLED', 'CANCELLED');

CREATE TABLE escrows (
    id SERIAL PRIMARY KEY,
    payment_hash VARCHAR(64) UNIQUE NOT NULL,      -- Hex encoded representation of r_hash
    preimage VARCHAR(64) UNIQUE NOT NULL,          -- Hex encoded 32-byte secret code
    bolt11_invoice TEXT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    amount_sats BIGINT NOT NULL,
    tracking_id VARCHAR(100) NULL,
    status escrow_state DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL
);

Extending LNDClient for HODL Operations

Your boilerplate script must be augmented with the following cryptographic primitives to talk to LND's REST endpoints for handling held invoices:
Python

import hashlib
import os

class LNDClientExtended(LNDClient):
    
    def add_hold_invoice(self, amount, memo=""):
        """
        Generates a 32-byte preimage, hashes it, and requests a HODL invoice from LND.
        """
        preimage = os.urandom(32)
        payment_hash = hashlib.sha256(preimage).digest()
        
        # LND REST requires base64 string encoding for byte fields in JSON requests
        hash_b64 = base64.b64encode(payment_hash).decode('utf-8')
        
        data = {
            "value": str(amount),
            "memo": memo,
            "hash": hash_b64
        }
        
        # POST directly to LND's HODL invoice endpoint
        resp = self._request("POST", "/v2/invoices/hodl", data)
        
        return {
            "preimage_hex": preimage.hex(),
            "payment_hash_hex": payment_hash.hex(),
            "payment_request": resp.get("payment_request")
        }

    def settle_hold_invoice(self, preimage_hex):
        """Releases funds to the merchant using the secret preimage key."""
        preimage_bytes = bytes.fromhex(preimage_hex)
        preimage_b64 = base64.b64encode(preimage_bytes).decode('utf-8')
        
        data = {"preimage": preimage_b64}
        return self._request("POST", "/v2/invoices/hodl/settle", data)

    def cancel_hold_invoice(self, payment_hash_hex):
        """Refunds the customer by breaking the HTLC lock."""
        hash_bytes = bytes.fromhex(payment_hash_hex)
        hash_b64 = base64.b64encode(hash_bytes).decode('utf-8')
        
        data = {"payment_hash": hash_b64}
        return self._request("POST", "/v2/invoices/hodl/cancel", data)

Module Component Decomposition

    app/api.py (FastAPI / Flask Routing Matrix):

        POST /api/v1/escrow/create: Calls add_hold_invoice(), writes the preimage_hex, payment_hash_hex, and state (PENDING) to PostgreSQL.

        POST /api/v1/escrow/ship: Updates the database row matching the hash with the merchant's tracking_id and shifts state to SHIPPED.

        GET /api/v1/escrow/status/<hash>: Fetches current status for the frontend UI loop.

        POST /api/v1/escrow/action: Accepts JSON parameters {hash: "hex", action: "ACCEPT" | "DISPUTE"}.

    app/workers.py (Background Logistics Watcher Thread):

        A separate execution thread running a continuous loop. Every 10 seconds, it queries rows marked SHIPPED or HELD.

        It queries lookup_invoice() to check if the lightning payment hit the node (status becomes ACCEPTED in LND terms), immediately altering PostgreSQL to HELD.

        It pulls active shipping states from a simulated courier service. If tracking shifts to delivered, it mutates the state to DELIVERED_INSPECTING.

4. Frontend Screen Wireframing & User Experience Flow

The frontend is built inside a single Next.js web application optimized for mobile screen dimensions. Role access controls are split into a clear user experience architecture using localized state toggles.
Global Nav Shell (/layout.jsx)

The topmost element houses a persistent presentation control matrix:

    The Role Slider Component: A clean toggle button component allowing the judge to slide seamlessly between Merchant View, Customer Checkout, and Oracle Control (God Mode).

    The Diagnostic Banner: Displays real-time connectivity status to the local Python server and Bob's node configuration state.

View 1: Merchant Workspace (/merchant)

Designed specifically for the physical asset supplier.

    Form Layout Panel: Contains inputs for Item Title and Value (Sats). Submitting this dynamically loads a loading spinner overlay while the REST call generates the payment hash sequence.

    Logistics Ledger Cards: A vertical list showing existing active sales. Cards in the PENDING state display a waiting text. Cards mutating to HELD display a bright green checkmark alongside an active text field where the merchant inputs the shipping confirmation code to drop the cargo off.

View 2: Customer Checkout & Tracking Tunnel (/checkout/[hash])

The consumer terminal UI. Reads the transaction tracking hash parameter directly from the route parameters.

    The QR Capture Component: Active while state equals PENDING. Renders a highly responsive, clean visual QR block generated dynamically from the underlying bolt11 text layout. Includes a quick action clipboard copy button.

    The Active State Tracking Screen: When state shifts to HELD or SHIPPED, the QR code is dynamically unmounted. It is replaced by a linear step-by-step progress tracking block:
    [Deposit Received] -> [In Transit via Nairobi Hub] -> [Awaiting Inspection]

    The Action Intervention Drawer: Unlocks exclusively when status matches DELIVERED_INSPECTING. Renders two dominant interactive buttons side-by-side:

        🟢 Accept Package (Green): Confirms item payload integrity. Instantly triggers the Python /api/v1/escrow/action route to settle the invoice.

        🔴 Open Dispute (Red): Halts the 24-hour countdown immediately. Shifts UI state to a locked dispute evaluation status, locking the network escrow safely.

View 3: Oracle Simulation Control Panel (/oracle)

A dedicated dashboard interface built explicitly for hackathon evaluation environments.

    The Telemetry Interceptor: Displays a raw JSON view of all orders globally floating inside the backend network script architecture.

    The Webhook Simulator Engine: Provides a manual overriding trigger button next to active shipments that sends an imitation payload to the Python backend. This instantly tricks the Oracle routine into interpreting a physical courier arrival, allowing the developer to demonstrate the dynamic multi-screen UI transformations without leaving the presentation area.

Implementation Assignments for the Sprint

    Backend Dev: Use the extended LNDClientExtended code above, connect it to your Python framework of choice, and ensure byte-to-string manipulation matches LND's expected base64 format for REST.

    Frontend Dev: Build the single Next.js web application routing framework using basic polling requests against the Python API endpoints to shift screen state smoothly.