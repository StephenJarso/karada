package oracle

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/karada/internal/escrow"
)

// CourierSimulator simulates courier delivery status updates
type CourierSimulator struct {
	mu            sync.RWMutex
	shipments     map[string]*Shipment
	escrowService *escrow.Service
}

// Shipment represents a simulated shipment
type Shipment struct {
	TrackingNumber string
	Status         string // PENDING, IN_TRANSIT, DELIVERED
	UpdatedAt      time.Time
}

// NewCourierSimulator creates a new courier simulator
func NewCourierSimulator(escrowService *escrow.Service) *CourierSimulator {
	return &CourierSimulator{
		shipments:     make(map[string]*Shipment),
		escrowService: escrowService,
	}
}

// Routes returns the router for oracle endpoints
func (c *CourierSimulator) Routes() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Post("/simulate-delivery", c.SimulateDelivery)
	r.Get("/shipment/{trackingNumber}", c.GetShipment)

	return r
}

// SimulateDeliveryRequest represents the request to simulate delivery
type SimulateDeliveryRequest struct {
	TrackingNumber string `json:"tracking_number"`
}

// SimulateDelivery handles POST /api/v1/oracle/simulate-delivery
// This simulates a courier API webhook that triggers on delivery
func (c *CourierSimulator) SimulateDelivery(w http.ResponseWriter, r *http.Request) {
	var req SimulateDeliveryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Update shipment status to delivered
	c.mu.Lock()
	c.shipments[req.TrackingNumber] = &Shipment{
		TrackingNumber: req.TrackingNumber,
		Status:         "DELIVERED",
		UpdatedAt:      time.Now(),
	}
	c.mu.Unlock()

	// Release funds to merchant
	if err := c.escrowService.ReleaseFunds(r.Context(), req.TrackingNumber); err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "delivered",
		"message": "Funds released to merchant",
	})
}

// GetShipment handles GET /api/v1/oracle/shipment/{trackingNumber}
func (c *CourierSimulator) GetShipment(w http.ResponseWriter, r *http.Request) {
	trackingNumber := chi.URLParam(r, "trackingNumber")

	c.mu.RLock()
	shipment, ok := c.shipments[trackingNumber]
	c.mu.RUnlock()

	if !ok {
		http.Error(w, "shipment not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(shipment)
}

// CreateShipment creates a new shipment record (called when merchant ships)
func (c *CourierSimulator) CreateShipment(trackingNumber string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.shipments[trackingNumber] = &Shipment{
		TrackingNumber: trackingNumber,
		Status:         "PENDING",
		UpdatedAt:      time.Now(),
	}
}
