export type ProductType = 'COMMERCE' | 'SCHOOL_FEES' | 'SAVINGS'
export type LogType = 'info' | 'warn' | 'success' | 'action'

export interface ProductDefinition {
  type: ProductType
  label: string
  proof: string
  settlement_rule: string
}

export interface ProductCopy {
  label: string
  placeholder: string
  proofLabel: string
  proofPlaceholder: string
  proof: string
  settlement_rule: string
}

export interface Escrow {
  id?: number
  payment_request: string
  payment_hash: string
  product_type: ProductType
  title: string
  description: string
  counterparty_name?: string
  terms?: string
  amount_sats: number
  tracking_number?: string
  carrier?: string
  proof_type?: string
  proof_reference?: string
  status: string
  created_at?: string
  held_at?: string
  delivered_at?: string
  settled_at?: string
  inspection_deadline?: string
  dispute_reason?: string
}

export interface LogEntry {
  time: string
  message: string
  type: LogType
}

export interface CreateEscrowPayload {
  amount_sats: number
  product_type: ProductType
  title: string
  description: string
  counterparty_name?: string
  terms?: string
  tracking_number?: string
  carrier?: string
  proof_type?: string
  proof_reference?: string
  inspection_hours: number
}
