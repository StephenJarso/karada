package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/karada/internal/escrow"
	"github.com/karada/internal/lightning"
	"github.com/karada/internal/oracle"
)

func main() {
	// Load configuration from environment
	rpcHost := getEnv("LND_RPC_HOST", "127.0.0.1:10009")
	macaroonPath := getEnv("LND_MACAROON_PATH", "")
	tlsCertPath := getEnv("LND_TLS_CERT_PATH", "")

	// Default expiry: 432 blocks (~3 days)
	expiry := int64(432 * 60 * 10) // 432 blocks in seconds (approx)

	// Initialize LND client
	ln, err := lightning.NewClient(rpcHost, macaroonPath, tlsCertPath)
	if err != nil {
		log.Printf("Warning: LND client not available (running in mock mode): %v", err)
		ln = nil // Will use mock mode
	}

	// Initialize repository and service
	repo := escrow.NewRepository()
	service := escrow.NewService(repo, ln, expiry)

	// Initialize oracle simulator
	simulator := oracle.NewCourierSimulator(service)

	// Create router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS for frontend
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// API routes
	r.Route("/api/v1", func(api chi.Router) {
		api.Mount("/escrow", escrow.NewHandler(service).Routes())
		api.Mount("/oracle", simulator.Routes())
	})

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// Root route
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"name":    "Karada",
			"status":  "running",
			"version": "0.1.0",
		})
	})

	// Favicon handler
	r.Get("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	// Start server
	server := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		log.Println("Shutting down server...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		server.Shutdown(ctx)
	}()

	log.Println("Server starting on :8080")
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
