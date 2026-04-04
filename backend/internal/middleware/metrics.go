package middleware

import (
	"net/http"
	"time"

	"github.com/Muhamaddiis/phish-sim/internal/monitoring"
)

func MetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		next.ServeHTTP(w, r)

		duration := time.Since(start).Seconds()

		monitoring.HTTPRequestTotal.WithLabelValues(r.Method, r.URL.Path).Inc()
		monitoring.HTTPRequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
	})
}