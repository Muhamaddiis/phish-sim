// Phishing Simulation Tool - Backend Server
// Educational use only - requires authorization before use
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	"github.com/Muhamaddiis/phish-sim/internal/db"
	"github.com/Muhamaddiis/phish-sim/internal/handlers"
	"github.com/Muhamaddiis/phish-sim/internal/mailer"
	custommiddleware "github.com/Muhamaddiis/phish-sim/internal/middleware"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database connection
	database, err := db.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Run automatic migrations
	if err := db.RunMigrations(database); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize mailer
	mailService := mailer.NewMailer()

	// Initialize handlers with dependencies
	authHandler := handlers.NewAuthHandler(database)
	campaignHandler := handlers.NewCampaignHandler(database, mailService)
	trackingHandler := handlers.NewTrackingHandler(database)
	statsHandler := handlers.NewStatsHandler(database)

	// Setup router
	r := chi.NewRouter()

	// Middleware stack
	r.Use(middleware.Logger)       // Log all requests
	r.Use(middleware.Recoverer)    // Recover from panics
	r.Use(middleware.RealIP)       // Get real client IP
	r.Use(middleware.Timeout(60 * time.Second)) // Request timeout

	// CORS configuration for frontend
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{getEnv("FRONTEND_URL", "http://localhost:3000")},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public routes (no authentication required)
	r.Group(func(r chi.Router) {
		r.Post("/api/login", authHandler.Login)
		r.Post("/api/register", authHandler.Register)
		
		// Tracking routes (public by design)
		r.Get("/open/{token}", trackingHandler.TrackOpen)
		r.Get("/t/{token}", trackingHandler.TrackClick)
		r.Get("/landing/{token}", trackingHandler.ServeLandingPage)
		r.Post("/submit", trackingHandler.TrackSubmit)
	})

	// Protected API routes (require JWT authentication)
	r.Group(func(r chi.Router) {
		r.Use(custommiddleware.AuthMiddleware)

		// Campaign routes
		r.Get("/api/campaigns", campaignHandler.ListCampaigns)
		r.Post("/api/campaigns", campaignHandler.CreateCampaign)
		r.Get("/api/campaigns/{id}", campaignHandler.GetCampaign)
		r.Post("/api/campaigns/{id}/upload-targets", campaignHandler.UploadTargets)
		r.Post("/api/campaigns/{id}/send", campaignHandler.SendCampaign)
		r.Get("/api/campaigns/{id}/stats", statsHandler.GetCampaignStats)

		// Statistics routes
		r.Get("/api/stats", statsHandler.GetOverallStats)
		
		// Export routes
		r.Get("/api/campaigns/{id}/export", campaignHandler.ExportResults)
	})

	// Health check endpoint
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"healthy"}`))
	})

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("⚠️  ETHICAL USE ONLY - This tool is for authorized security training")
	log.Fatal(http.ListenAndServe(":"+port, r))
}

// getEnv retrieves environment variable or returns default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}