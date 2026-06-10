package escrow

import (
	"errors"
	"sync"
)

// Status represents the escrow state
type Status string

const (
	StatusPending  Status = "PENDING"
	StatusHeld     Status = "HELD"
	StatusSettled  Status = "SETTLED"
	StatusRefunded Status = "REFUNDED"
	StatusShipped  Status = "SHIPPED"
)

// Escrow represents an escrow transaction
type Escrow struct {
	ID             string
	PaymentHash    string
	Preimage       string
	AmountSats     int64
	Status         Status
	TrackingNumber string
	Description    string
	Expiry         int64
	CreatedAt      int64
	UpdatedAt      int64
}

// Repository provides thread-safe in-memory storage for escrows
type Repository struct {
	mu      sync.RWMutex
	escrows map[string]*Escrow
}

// NewRepository creates a new in-memory escrow repository
func NewRepository() *Repository {
	return &Repository{
		escrows: make(map[string]*Escrow),
	}
}

// Create stores a new escrow
func (r *Repository) Create(escrow *Escrow) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.escrows[escrow.PaymentHash] = escrow
	return nil
}

// GetByPaymentHash retrieves an escrow by its payment hash
func (r *Repository) GetByPaymentHash(paymentHash string) (*Escrow, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	escrow, ok := r.escrows[paymentHash]
	return escrow, ok
}

// GetByTrackingNumber retrieves an escrow by tracking number
func (r *Repository) GetByTrackingNumber(trackingNumber string) (*Escrow, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, escrow := range r.escrows {
		if escrow.TrackingNumber == trackingNumber {
			return escrow, true
		}
	}
	return nil, false
}

// UpdateStatus updates the status of an escrow
func (r *Repository) UpdateStatus(paymentHash string, status Status) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	escrow, ok := r.escrows[paymentHash]
	if !ok {
		return ErrEscrowNotFound
	}

	escrow.Status = status
	return nil
}

// UpdateTrackingNumber sets the tracking number for an escrow
func (r *Repository) UpdateTrackingNumber(paymentHash, trackingNumber string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	escrow, ok := r.escrows[paymentHash]
	if !ok {
		return ErrEscrowNotFound
	}

	escrow.TrackingNumber = trackingNumber
	escrow.Status = StatusShipped
	return nil
}

// Delete removes an escrow from storage
func (r *Repository) Delete(paymentHash string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.escrows, paymentHash)
}

// List returns all escrows
func (r *Repository) List() []*Escrow {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]*Escrow, 0, len(r.escrows))
	for _, escrow := range r.escrows {
		result = append(result, escrow)
	}
	return result
}

// Errors
var ErrEscrowNotFound = errors.New("escrow not found")
