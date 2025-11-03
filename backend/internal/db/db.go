package db

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/Muhamaddiis/phish-sim/internal/models"
)

// InitDB initializes database connection with PostgreSQL
func InitDB() (*gorm.DB, error) {
	// Build connection string from environment variables
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		getEnv("DB_HOST", "localhost"),
		getEnv("POSTGRES_USER", "phish"),
		getEnv("POSTGRES_PASSWORD", "phishpass"),
		getEnv("POSTGRES_DB", "phishsim"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_SSLMODE", "disable"),
	)

	// Alternatively, use DB_URL if provided
	if dbURL := os.Getenv("DB_URL"); dbURL != "" {
		dsn = dbURL
	}

	// Configure GORM logger
	config := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(dsn), config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("✅ Database connection established")
	return db, nil
}

// RunMigrations runs automatic migrations for all models
func RunMigrations(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// AutoMigrate will create tables if they don't exist
	// and add missing columns without deleting existing data
	err := db.AutoMigrate(
		&models.User{},
		&models.Campaign{},
		&models.Target{},
		&models.Event{},
	)

	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("✅ Database migrations completed")
	
	// Create default admin user if none exists
	createDefaultAdmin(db)
	
	return nil
}

// createDefaultAdmin creates a default admin user for initial setup
func createDefaultAdmin(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Count(&count)
	
	if count == 0 {
		log.Println("Creating default admin user...")
		// Note: Password hashing will be done in the auth handler
		// This is just a placeholder - in production, remove this or require CLI setup
		log.Println("⚠️  No users found. Please create an admin user via POST /api/register")
		log.Println("   Example: {\"username\":\"admin\",\"password\":\"Admin123!\",\"role\":\"admin\"}")
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}