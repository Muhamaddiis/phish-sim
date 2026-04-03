package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware validates JWT token and adds user info to context
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Try to get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		var tokenString string

		if authHeader != "" {
			// Extract token from "Bearer <token>" format
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		// If no Authorization header, try to get token from cookie
		if tokenString == "" {
			cookie, err := r.Cookie("token")
			if err == nil {
				tokenString = cookie.Value
			}
		}

		// If still no token found, return unauthorized
		if tokenString == "" {
			respondUnauthorized(w, r, "No authentication token provided")
			return
		}

		// Parse and validate JWT token
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "default-secret-change-in-production"
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Verify signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})

		if err != nil {
			respondUnauthorized(w, r, "Invalid authentication token")
			return
		}

		if !token.Valid {
			respondUnauthorized(w, r, "Invalid authentication token")
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			respondUnauthorized(w, r ,"Invalid token claims")
			return
		}

		// Add user info to request context
		ctx := context.WithValue(r.Context(), "user_id", claims["user_id"])
		ctx = context.WithValue(ctx, "username", claims["username"])
		ctx = context.WithValue(ctx, "role", claims["role"])

		// Call next handler with updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// respondUnauthorized sends a 401 Unauthorized response
func respondUnauthorized(w http.ResponseWriter, r *http.Request, message string) {
	origin := r.Header.Get("Origin")

    if origin != "" {
        w.Header().Set("Access-Control-Allow-Origin", origin)
        w.Header().Set("Access-Control-Allow-Credentials", "true")
        w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    }
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	w.Write([]byte(`{"error":"` + message + `"}`))
}