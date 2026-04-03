package middleware

import (
	"net/http"
	"os"
	"log"
	"strings"
)

// CORSMiddleware handles CORS with support for ngrok and localhost
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		log.Printf("CORS: origin=%s, method=%s, path=%s", origin, r.Method, r.URL.Path)
		// List of allowed origins
		allowedOrigins := []string{
			os.Getenv("FRONTEND_URL"),
			"http://localhost:3000",
			"http://localhost:3001",
		}

		// Check if origin is explicitly allowed
		allowed := false
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				allowed = true
				break
			}
		}

		// Also allow ngrok URLs
		if !allowed && origin != "" {
			if strings.Contains(origin, "ngrok.io") ||
				strings.Contains(origin, "ngrok-free.app") ||
				strings.Contains(origin, "ngrok-free.dev") ||
				strings.Contains(origin, "localhost") {
				allowed = true
			}
		}

		// Set CORS headers if origin is allowed
		if allowed && origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-Requested-With, ngrok-skip-browser-warning")
			w.Header().Set("Access-Control-Expose-Headers", "Link")
			w.Header().Set("Access-Control-Max-Age", "300")
		}

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}