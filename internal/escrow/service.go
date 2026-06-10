package escrow

import (
	"context"
	"time"

	"github.com/karada/pkg/crypto"
	"github.com/karada/internal/lightning"
)

// Service handles escrow business logic
type Service struct {
	repo   *Repository
	ln     *lightning.Client
	expiry int64
}

// NewService creates a new escrow service
func NewService(repo *Repository, ln *lightning.Client, expiry int64) *Service {
	return &Service{
		repo:   repo,
		ln:     ln,
		expiry: expiry,
	}
}

// CreateEscrowRequest represents the request to create an escrow
type CreateEscrowRequest struct {
	AmountSats  int64
	Description string
}

// CreateEscrowResponse represents the response with payment request
type CreateEscrowResponse struct {
	PaymentRequest string
	PaymentHash    string
	Preimage       string
	AmountSats     int64
	Expiry         int64
}

// CreateEscrow creates a new HODL invoice escrow
func (s *Service) CreateEscrow(ctx context.Context, req *CreateEscrowRequest) (*CreateEscrowResponse, error) {
	// Generate preimage and payment hash
	preimage, err := crypto.GeneratePreimage()
	if err != nil {
		return nil, err
	}

	paymentHash, err := crypto.GeneratePaymentHash(preimage)
	if err != nil {
		return nil, err
	}

	// Create hold invoice
	invoice, err := s.ln.AddHoldInvoice(req.AmountSats, paymentHash, req.Description, s.expiry)
	if err != nil {
		return nil, err
	}

	// Store escrow in repository
	escrow := &Escrow{
		ID:          paymentHash,
		PaymentHash: paymentHash,
		Preimage:    preimage,
		AmountSats:  req.AmountSats,
		Status:      StatusPending,
		Description: req.Description,
		Expiry:      s.expiry,
		CreatedAt:   time.Now().Unix(),
		UpdatedAt:   time.Now().Unix(),
	}

	if err := s.repo.Create(escrow); err != nil {
		return nil, err
	}

	return &CreateEscrowResponse{
		PaymentRequest: invoice.PaymentRequest,
		PaymentHash:    paymentHash,
		Preimage:       preimage,
		AmountSats:     req.AmountSats,
		Expiry:         s.expiry,
	}, nil
}

// ShipEscrowRequest represents the request to log shipment
type ShipEscrowRequest struct {
	PaymentHash    string
	TrackingNumber string
}

// ShipEscrow logs a shipment for an escrow
func (s *Service) ShipEscrow(ctx context.Context, req *ShipEscrowRequest) error {
	return s.repo.UpdateTrackingNumber(req.PaymentHash, req.TrackingNumber)
}

// ReleaseFunds releases funds to the merchant (called by oracle on delivery)
func (s *Service) ReleaseFunds(ctx context.Context, trackingNumber string) error {
	escrow, ok := s.repo.GetByTrackingNumber(trackingNumber)
	if !ok {
		return ErrEscrowNotFound
	}

	// Settle the invoice with the preimage
	if err := s.ln.SettleInvoice(escrow.Preimage); err != nil {
		return err
	}

	// Update status to settled
	return s.repo.UpdateStatus(escrow.PaymentHash, StatusSettled)
}

// CancelEscrow cancels an escrow and refunds the buyer
func (s *Service) CancelEscrow(ctx context.Context, paymentHash string) error {
	_, ok := s.repo.GetByPaymentHash(paymentHash)
	if !ok {
		return ErrEscrowNotFound
	}

	// Cancel the invoice
	if err := s.ln.CancelInvoice(paymentHash); err != nil {
		return err
	}

	// Update status to refunded
	return s.repo.UpdateStatus(paymentHash, StatusRefunded)
}

// GetEscrow retrieves an escrow by payment hash
func (s *Service) GetEscrow(ctx context.Context, paymentHash string) (*Escrow, error) {
	escrow, ok := s.repo.GetByPaymentHash(paymentHash)
	if !ok {
		return nil, ErrEscrowNotFound
	}
	return escrow, nil
}

// ListEscrows returns all escrows
func (s *Service) ListEscrows(ctx context.Context) []*Escrow {
	return s.repo.List()
}