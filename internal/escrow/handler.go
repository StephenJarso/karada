package escrow

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// Handler handles HTTP requests for escrow operations
type Handler struct {
	service *Service
}

// NewHandler creates a new escrow handler
func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

// Routes returns the router for escrow endpoints
func (h *Handler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Post("/", h.CreateEscrow)
	r.Post("/ship", h.ShipEscrow)
	r.Post("/cancel", h.CancelEscrow)
	r.Post("/{paymentHash}/pay", h.PayEscrow)
	r.Get("/{paymentHash}", h.GetEscrow)
	r.Get("/", h.ListEscrows)

	return r
}

// CreateEscrow handles POST /api/v1/escrow
func (h *Handler) CreateEscrow(w http.ResponseWriter, r *http.Request) {
	var req CreateEscrowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp, err := h.service.CreateEscrow(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// ShipEscrow handles POST /api/v1/escrow/ship
func (h *Handler) ShipEscrow(w http.ResponseWriter, r *http.Request) {
	var req ShipEscrowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.service.ShipEscrow(r.Context(), &req); err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "shipped"})
}

// PayEscrow handles POST /api/v1/escrow/{paymentHash}/pay
func (h *Handler) PayEscrow(w http.ResponseWriter, r *http.Request) {
	paymentHash := chi.URLParam(r, "paymentHash")

	if err := h.service.PayEscrow(r.Context(), paymentHash); err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "held"})
}

// CancelEscrow handles POST /api/v1/escrow/cancel
func (h *Handler) CancelEscrow(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PaymentHash string `json:"payment_hash"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.service.CancelEscrow(r.Context(), req.PaymentHash); err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "cancelled"})
}

// GetEscrow handles GET /api/v1/escrow/{paymentHash}
func (h *Handler) GetEscrow(w http.ResponseWriter, r *http.Request) {
	paymentHash := chi.URLParam(r, "paymentHash")

	escrow, err := h.service.GetEscrow(r.Context(), paymentHash)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(escrow)
}

// ListEscrows handles GET /api/v1/escrow
func (h *Handler) ListEscrows(w http.ResponseWriter, r *http.Request) {
	escrows := h.service.ListEscrows(r.Context())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(escrows)
}
