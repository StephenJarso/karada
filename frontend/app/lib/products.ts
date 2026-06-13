import type { ProductCopy, ProductDefinition } from './types'

export const PRODUCTS: ProductDefinition[] = [
  {
    type: 'COMMERCE',
    label: 'Commerce',
    proof: 'Courier tracking number or delivery signature',
    settlement_rule: 'Release after delivery proof and buyer inspection window.',
  },
  {
    type: 'SCHOOL_FEES',
    label: 'School Fees',
    proof: 'Admission letter, school invoice, or registrar confirmation',
    settlement_rule: 'Release after document verification and parent/student inspection window.',
  },
  {
    type: 'SAVINGS',
    label: 'Savings',
    proof: 'Savings goal, lock confirmation, or trusted custodian attestation',
    settlement_rule: 'Release after savings proof verification and dispute window.',
  },
]

export const PRODUCT_COPY: Record<ProductDefinition['type'], ProductCopy> = {
  COMMERCE: {
    label: 'Merchant deal',
    placeholder: 'Handmade leather bag for export',
    proofLabel: 'Courier tracking number',
    proofPlaceholder: 'DHL-NBO-101',
    proof: 'Courier tracking number or delivery signature',
    settlement_rule: 'Release after delivery proof and buyer inspection window.',
  },
  SCHOOL_FEES: {
    label: 'School fees payment',
    placeholder: 'Term 2 school fees for Amina - invoice SF-2026-042',
    proofLabel: 'School proof reference',
    proofPlaceholder: 'Admission letter, invoice number, or registrar reference',
    proof: 'Admission letter, school invoice, or registrar confirmation',
    settlement_rule: 'Release after document verification and parent/student inspection window.',
  },
  SAVINGS: {
    label: 'Savings lock',
    placeholder: 'Emergency fund lock for household savings circle',
    proofLabel: 'Savings proof reference',
    proofPlaceholder: 'Lock confirmation, goal ID, or custodian reference',
    proof: 'Savings goal, lock confirmation, or trusted custodian attestation',
    settlement_rule: 'Release after savings proof verification and dispute window.',
  },
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Awaiting Lightning commitment',
  HELD: 'Funds held by HODL invoice',
  IN_PROGRESS: 'Fulfillment proof submitted',
  DELIVERED_INSPECTING: 'Verified - inspection window open',
  DISPUTED: 'Disputed - preimage held',
  SETTLED: 'Settled - preimage released',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}
