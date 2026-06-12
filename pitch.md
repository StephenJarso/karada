Karada Pitch Deck: Hackathon Speaker Guide & Pitch Script

Slide 1: Title Slide

Visual: "KARADA PROTOCOL: Redefining Global Trust..."

🎤 The Script:

"Good afternoon, judges. Today, global commerce is more connected than ever, yet it remains fundamentally broken by a single, age-old human barrier: Trust.

We are the team behind Karada Protocol, and today we are going to show you how we are using the native smart contract architecture of the Bitcoin Lightning Network to redefine global trust through Balanced Cryptographic Escrow."

Transition: "To understand why we built this, let me take you to the ground level of global trade..."

Pro-Tip: Start with high energy and a confident, deliberate pace. Do not rush the opening.


🎤 The Script:

"Imagine an artisan in Nairobi. She spends days handcrafting beautiful, high-value goods to sell to a buyer in New York. A transaction that should be celebrated instead carries immense anxiety.

If the buyer pays upfront, the buyer takes all the risk of receiving an empty box. If the merchant ships first, she risks her scarce capital on expensive international shipping fees, only to have the buyer cancel the payment or charge back the credit card mid-transit. This systemic trust deficit costs merchants across developing markets billions of dollars in lost opportunities every single year."
<!-- 
Transition: "But why don't current escrow systems or credit cards solve this? Let's look at the numbers." -->



Slide 3: Traditional Escrow vs. Karada


🎤 The Script:

"When we compare traditional escrow to what we've built, the legacy system completely falls apart. Traditional escrow takes 3 to 7 business days to settle, charges predatory fees of up to 6% plus wire costs, and carries severe chargeback risks.

Most importantly, traditional platforms enforce high minimum transaction sizes—usually over $100. That completely excludes micro-transactions. Karada settles instantly over the Lightning Network for a fraction of a percent in fees, has zero chargeback risk, and can handle micro-payments down to a single satoshi."

Transition: "Now, as Web3 and Bitcoin developers, the first question we usually get is: why not just build a standard multisig wallet contract?"



Slide 4: Why Not Multisig? (HTLC Advantage)

Visual: Two-column list contrasting Multisig limitations with the HTLC advantage.

Objective: Win over the technical judges by showing you understand the friction of multi-signature schemes and why Hash Time-Locked Contracts (HTLCs) are superior.

🎤 The Script:

"On-chain multisig wallets sound great in theory, but they are incredibly high-friction in practice. They require both parties to coordinate keys, use compatible, integrated wallets, wait for slow on-chain confirmations, and pay high fees. It is simply too complex for non-technical users.

On-chain multisig wallets create high-friction, complex user experiences due to required key coordination, specific wallet compatibility, slow on-chain confirmations, and elevated gas fees. While these attributes are necessary for high-security, they present a steep learning curve for non-technical users. To mitigate these issues, many are turning to Multi-Party Computation (MPC) wallets, which offer similar security with lower fees and increased speed.

Karada completely bypasses this by leveraging native HTLCs. Because we use standard BOLT-11 Lightning invoices, it works out-of-the-box with any Lightning wallet on earth. There is no custom wallet integration, key management is handled cryptographically under the hood, and settlements are instant and atomic."

Transition: "And by choosing Lightning over traditional fiat, we unlock a completely parallel financial rail."

Slide 5: Why Lightning Over Traditional Currency?

Visual: Bulleted comparison of the fiat problem and the Lightning solution.

Objective: Explain the macroeconomic advantages of a unified, borderless settlement network.

🎤 The Script:

"Traditional cross-border fiat transactions are heavily penalized by correspondent banking fees, capital controls, and currency conversion losses from KES to USD and back again.

By running natively on Bitcoin's Lightning Network, we enable direct, peer-to-peer settlement. Both parties trade in sats—completely eliminating currency conversion friction. The network is open 24/7, payments are instantly irreversible once settled, and we turn money into programmable code."

Transition: "Let's take a look under the hood to see exactly how our backend implements this magic..."

Slide 6: HODL Invoices (The Core Tech)

Visual: Python/FastAPI code snippets showcasing LND Hold Invoices.

Objective: Prove your technical execution. Show the judges real, working code that powers the escrow engine.

🎤 The Script:

"At the technical core of Karada is the HODL Invoice. Standard Lightning invoices settle instantly. HODL invoices, however, allow us to intercept and hold payments in 'HELD' status within the routing channels of the network.

As you can see in our backend code here, we generate an LND Hold Invoice with a specific payment hash commitment and a time-lock. When the buyer pays, the money is locked on-chain in transit, but the merchant cannot claim it yet. Our system only releases the secret 32-byte preimage to settle the transaction when delivery is programmatically verified."

Transition: "The beauty of this architecture is that it requires absolutely zero onboarding friction for the end user..."

Pro-Tip: Point to the code block. Even if non-technical judges don't read code, showing clean Python API endpoints adds massive credibility to your team.

Slide 7: BOLT-11 Magic (The User Flow)

Visual: The QR code scan flow and standard invoice details.

Objective: Demonstrate that the user experience is incredibly simple despite the complex cryptography underneath.

🎤 The Script:

"To the end-user, the cryptography is completely invisible. There is no app to install, no wallet to link, and no invasive KYC.

The buyer simply scans a standard BOLT-11 QR code with their favorite wallet—Phoenix, Zeus, or Wallet of Satoshi. The wallet recognizes the invoice, locks the funds, and our platform automatically updates the merchant's dashboard to 'HELD'. The merchant ships with complete peace of mind, knowing the funds are secured by Bitcoin consensus."

Transition: "This brings us to the core thesis of our project: what we call 'The Dual Trust Shield'."

Slide 8: The Dual Trust Shield (The Climax Slide)

Visual: "🤝 The Trust Framework: A Two-Sided Shield" visual structure.

Objective: Deliver the emotional and logical climax of the pitch. Explain the perfectly balanced scales of trust.

🎤 The Script:

"Traditional escrow platforms always force one party to carry the risk. If you pay upfront, the buyer carries the risk. If you pay on delivery, the seller carries the risk.

Karada balances the scales of trust perfectly. For the merchant, security is absolute because the buyer's capital is permanently locked inside the network routing channels before any shipping labels are printed or goods packed.

For the customer, security is absolute because the payout key remains hidden inside our secure backend until the inspection countdown clears and they can physically verify the payload integrity. By replacing human promises with math and logistics telemetry, we've created a zero-risk environment for both sides of the market."

Transition: "To orchestrate this without holding custody of user keys, we designed a highly secure state machine."

Pro-Tip: Speak with absolute conviction here. This slide is your "killer feature." Lean into the narrative: "By replacing human promises with math... we create a zero-risk environment."

Slide 9: Technical Architecture (State Machine & Security)

Visual: State Machine diagram and Security Model rules.

Objective: Reinforce safety, non-custodality, and technical soundness to mitigate security concerns.

🎤 The Script:

"Here is our underlying state machine. A transaction progresses linearly from Pending to Held, then to Shipped, and finally to Settled. If a dispute or timeout occurs, the funds are automatically Refunded via the native Lightning time-lock.

Critically, Karada is entirely non-custodial. The preimage never leaves our secure backend server, we store zero private keys, and the time-lock is enforced by global Bitcoin consensus. We cannot steal user funds, and a server breach does not put user keys at risk."

Transition: "But how does our backend know when to release the payment? That's where our logistics oracle comes in."

Slide 10: Logistics Oracle Flow

Visual: Aerial view of shipping port / carrier courier integrations.

Objective: Explain the bridge between the physical world and the digital smart contract.

🎤 The Script:

"To bridge the gap between physical shipping and digital smart contracts, we integrate with major courier APIs like DHL and FedEx as our data oracles.

The moment the carrier scans the package as 'delivered,' Karada initiates a 24-hour buffer window. If the goods are correct, the buyer accepts, and settlement is instant. If they receive a fraudulent package, they click 'Dispute' on their dashboard. This freezes the countdown timer immediately, keeping the funds locked securely in escrow while we initiate manual or multi-oracle resolution."

Transition: "While we started with retail shipping, we quickly realized that this conditional escrow architecture is a horizontal technology."

Slide 11: Beyond Retail (Universal Trust Protocol)

Visual: Three-column layout mapping out future integrations.

Objective: Blow the judges' minds by showcasing a massive addressable market and scaling potential far beyond simple peer-to-peer e-commerce.

🎤 The Script:

"What we have built here is not just a checkout button for African artisans. Karada is a generalized, universal trust protocol. Because we operate entirely on conditional preimages, this can be integrated into any industry requiring trustless conditional payments:

B2B Supply Chains: Automating multi-million dollar wholesale trade when shipping containers trigger port IoT sensors.

The Gig Economy: Protecting global freelancers, automatically releasing milestone payments only when verified GitHub commits are pushed.

DAOs and Web3 Oracles: Streamlining milestone-based development funding and algorithmic escrow routing.

We are turning Lightning from a simple fast-payment rail into the transactional coordination layer of the global digital economy."

Transition: "To realize this massive vision, we have laid out a structured roadmap."

Slide 12: Future Roadmap & Call to Action (The Finish)

Visual: Horizontal timeline (Phase 1 to Phase 4) and CTA Box.

Objective: Show a realistic business trajectory and end with a memorable, high-energy call to action to run the demo.

🎤 The Script:

"Our roadmap takes us from our current Phase 1 Hackathon MVP into building a resilient Multi-Oracle Network in Phase 2, deploying seamless POS merchant SDKs in Phase 3, and ultimately launching federated Karada nodes to decentralize the entire protocol in Phase 4.

Today, Karada is fully functional. The backend code is running, the frontend is live, and we are ready to show you trustless commerce in action at our demo booth.

Help us replace broken financial promises with cryptographic guarantees. Thank you, and we are now open for your questions!"

Pro-Tip: End with a smile, stand tall, and make eye contact with the lead judges. The final slide should remain visible during the entire Q&A session.

💡 Judges Q&A Cheat Sheet (Be Prepared!)

Q1: "What if the centralized carrier oracle (e.g., DHL API) is hacked or reports false data?"

Answer: "Excellent question. For our MVP, we rely on authenticated webhooks from established carriers. However, in Phase 2, we are moving to a multi-oracle framework where we cross-reference multiple data points (e.g., GPS telemetry, carrier APIs, and local community verifiers). Furthermore, because the countdown buffer is 24 hours, the user always has a manual override window to freeze the funds by flagging a dispute before any release happens."

Q2: "How does Karada handle Lightning Network routing failures or fee spikes?"

Answer: "Because we use Hold Invoices, the path must be successfully probed and locked before the contract status shifts to 'HELD'. If a routing path cannot be found, the invoice payment fails immediately at the start of the transaction, meaning no goods are ever shipped under false pretenses. For fee spikes, because our routing node acts as a liquidity provider, we can dynamically manage and optimize channel fees to keep transaction costs consistently near ~0.1%."

Q3: "Who handles the dispute resolution if the buyer clicks 'Dispute'?"

Answer: "In our MVP, Karada acts as the default dispute mediator, checking photo evidence and carrier tracking details. As we scale to Phase 4, we will transition this to a federated, decentralized oracle network where community judges with high reputation scores can resolve disputes in exchange for a micro-fee, keeping the protocol entirely censorship-resistant and community-governed."