package lightning

import (
	"context"
	"crypto/tls"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// Invoice represents a Lightning invoice
type Invoice struct {
	PaymentRequest string
	PaymentHash    []byte
	Amount         int64
	Description    string
	Expiry         int64
}

// Client wraps the LND gRPC client for escrow operations
type Client struct {
	conn     *grpc.ClientConn
	ctx      context.Context
	macaroon []byte
}

// NewClient creates a new LND gRPC client connection
func NewClient(rpcHost, macaroonPath, tlsCertPath string) (*Client, error) {
	// Read TLS certificate
	tlsCert, err := os.ReadFile(tlsCertPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read TLS cert: %w", err)
	}

	// Read macaroon
	macaroonBytes, err := os.ReadFile(macaroonPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read macaroon: %w", err)
	}

	// Create TLS credentials from cert
	creds := credentials.NewTLS(&tls.Config{
		InsecureSkipVerify: true,
	})

	// For macaroon authentication, we use a custom dialer
	opts := []grpc.DialOption{
		grpc.WithTransportCredentials(creds),
		grpc.WithPerRPCCredentials(&macaroonCredential{macaroonBytes}),
	}

	conn, err := grpc.Dial(rpcHost, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to LND: %w", err)
	}

	_ = tlsCert // TLS cert loaded for future use

	return &Client{
		conn:     conn,
		ctx:      context.Background(),
		macaroon: macaroonBytes,
	}, nil
}

// macaroonCredential implements grpc credentials for macaroon auth
type macaroonCredential struct {
	macaroon []byte
}

func (m *macaroonCredential) RequireTransportSecurity() bool { return true }

func (m *macaroonCredential) GetRequestMetadata(ctx context.Context, in ...string) (map[string]string, error) {
	return map[string]string{
		"macaroon": hex.EncodeToString(m.macaroon),
	}, nil
}

// AddHoldInvoice creates a hold invoice (HODL invoice) for escrow
// This is a simplified interface - in production, you'd use the actual LND router client
func (c *Client) AddHoldInvoice(amountSats int64, paymentHash, description string, expiry int64) (*Invoice, error) {
	// In production, this would call the LND router client
	// For hackathon demo, we return a mock invoice
	return &Invoice{
		PaymentRequest: fmt.Sprintf("lnbc%s...", paymentHash[:10]),
		PaymentHash:    []byte(paymentHash),
		Amount:         amountSats,
		Description:    description,
		Expiry:         expiry,
	}, nil
}

// SettleInvoice settles a hold invoice with the preimage, releasing funds
func (c *Client) SettleInvoice(preimage string) error {
	// In production, this would call the LND router client
	// For hackathon demo, this is a no-op
	return nil
}

// CancelInvoice cancels an invoice, triggering a refund
func (c *Client) CancelInvoice(paymentHash string) error {
	// In production, this would call the LND client
	// For hackathon demo, this is a no-op
	return nil
}

// SubscribeInvoices subscribes to invoice updates for escrow state tracking
func (c *Client) SubscribeInvoices() (<-chan Invoice, error) {
	// In production, this would stream from LND
	// For hackathon demo, return a mock channel
	ch := make(chan Invoice)
	go func() {
		// Mock implementation
	}()
	return ch, nil
}

// InvoiceUpdate represents an invoice state change
type InvoiceUpdate struct {
	PaymentHash string
	Status      string
	Timestamp   time.Time
}
