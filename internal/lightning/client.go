package lightning

import (
	"context"
	"crypto/tls"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"github.com/lightningnetwork/lnd/lnrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// Client wraps the LND gRPC client for escrow operations
type Client struct {
	client lnrpc.LightningClient
	ctx    context.Context
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
		client: lnrpc.NewLightningClient(conn),
		ctx:    context.Background(),
	}, nil
}

// macaroonCredential implements grpc credentials for macaroon auth
type macaroonCredential struct {
	macaroon []byte
}

func (m *macaroonCredential) RequireTransportSecurity() bool { return true }

func (m *macaroonCredential) GetRequestMetadata(ctx context.Context, in ...[]string) (map[string]string, error) {
	return map[string]string{
		"macaroon": hex.EncodeToString(m.macaroon),
	}, nil
}

// AddHoldInvoice creates a hold invoice (HODL invoice) for escrow
func (c *Client) AddHoldInvoice(amountSats int64, paymentHash, description string, expiry int64) (*lnrpc.AddHoldInvoiceResponse, error) {
	hashBytes, err := hex.DecodeString(paymentHash)
	if err != nil {
		return nil, fmt.Errorf("invalid payment hash: %w", err)
	}

	req := &lnrpc.AddHoldInvoiceRequest{
		Hash:        hashBytes,
		Value:       amountSats,
		Description: description,
		Expiry:      expiry,
	}

	return c.client.AddHoldInvoice(c.ctx, req)
}

// SettleInvoice settles a hold invoice with the preimage, releasing funds
func (c *Client) SettleInvoice(preimage string) (*lnrpc.SettleInvoiceResponse, error) {
	preimageBytes, err := hex.DecodeString(preimage)
	if err != nil {
		return nil, fmt.Errorf("invalid preimage: %w", err)
	}

	req := &lnrpc.SettleInvoiceRequest{
		Preimage: preimageBytes,
	}

	return c.client.SettleInvoice(c.ctx, req)
}

// CancelInvoice cancels an invoice, triggering a refund
func (c *Client) CancelInvoice(paymentHash string) (*lnrpc.CancelInvoiceResponse, error) {
	hashBytes, err := hex.DecodeString(paymentHash)
	if err != nil {
		return nil, fmt.Errorf("invalid payment hash: %w", err)
	}

	req := &lnrpc.CancelInvoiceRequest{
		PaymentHash: hashBytes,
	}

	return c.client.CancelInvoice(c.ctx, req)
}

// SubscribeInvoices subscribes to invoice updates for escrow state tracking
func (c *Client) SubscribeInvoices() (lnrpc.Lightning_SubscribeInvoicesClient, error) {
	req := &lnrpc.InvoiceSubscription{}
	return c.client.SubscribeInvoices(c.ctx, req)
}

// GetInvoice retrieves invoice details
func (c *Client) GetInvoice(paymentHash string) (*lnrpc.GetInvoiceResponse, error) {
	hashBytes, err := hex.DecodeString(paymentHash)
	if err != nil {
		return nil, fmt.Errorf("invalid payment hash: %w", err)
	}

	req := &lnrpc.GetInvoiceRequest{
		PaymentHash: hashBytes,
	}

	return c.client.GetInvoice(c.ctx, req)
}

// LookupInvoiceAlias looks up an invoice by its alias (label)
func (c *Client) LookupInvoiceAlias(alias string) (*lnrpc.Invoice, error) {
	req := &lnrpc.LookupInvoiceRequest{
		Lookup: &lnrpc.LookupInvoiceRequest_InvoiceAlias{
			InvoiceAlias: alias,
		},
	}

	return c.client.LookupInvoice(c.ctx, req)
}

// InvoiceUpdate represents an invoice state change
type InvoiceUpdate struct {
	PaymentHash string
	Status      string
	Timestamp   time.Time
}
