package handlers

import (
	"crypto/rand"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/Muhamaddiis/phish-sim/internal/mailer"
	"github.com/Muhamaddiis/phish-sim/internal/models"
)

type CampaignHandler struct {
	db     *gorm.DB
	mailer *mailer.Mailer
}

func NewCampaignHandler(db *gorm.DB, m *mailer.Mailer) *CampaignHandler {
	return &CampaignHandler{db: db, mailer: m}
}

type CreateCampaignRequest struct {
	Name         string `json:"name"`
	EmailSubject string `json:"email_subject"`
	EmailBody    string `json:"email_body"`
	FromAddress  string `json:"from_address"`
}

// ListCampaigns returns all campaigns
func (h *CampaignHandler) ListCampaigns(w http.ResponseWriter, r *http.Request) {
	var campaigns []models.Campaign
	if err := h.db.Order("created_at DESC").Find(&campaigns).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch campaigns")
		return
	}

	respondJSON(w, http.StatusOK, campaigns)
}

// CreateCampaign creates a new phishing campaign
func (h *CampaignHandler) CreateCampaign(w http.ResponseWriter, r *http.Request) {
	var req CreateCampaignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" || req.EmailSubject == "" || req.EmailBody == "" || req.FromAddress == "" {
		respondError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	// Get user ID from context (set by auth middleware)
	userID := r.Context().Value("user_id").(string)
	uid, _ := uuid.Parse(userID)

	campaign := models.Campaign{
		Name:         req.Name,
		EmailSubject: req.EmailSubject,
		EmailBody:    req.EmailBody,
		FromAddress:  req.FromAddress,
		CreatedBy:    uid,
	}

	if err := h.db.Create(&campaign).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create campaign")
		return
	}

	respondJSON(w, http.StatusCreated, campaign)
}

// GetCampaign returns campaign details with targets
func (h *CampaignHandler) GetCampaign(w http.ResponseWriter, r *http.Request) {
	campaignID := chi.URLParam(r, "id")

	var campaign models.Campaign
	if err := h.db.Preload("Targets.Events").First(&campaign, "id = ?", campaignID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Campaign not found")
		return
	}

	respondJSON(w, http.StatusOK, campaign)
}

// UploadTargets handles CSV upload for campaign targets
func (h *CampaignHandler) UploadTargets(w http.ResponseWriter, r *http.Request) {
	campaignID := chi.URLParam(r, "id")

	// Verify campaign exists
	var campaign models.Campaign
	if err := h.db.First(&campaign, "id = ?", campaignID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Campaign not found")
		return
	}

	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
		respondError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded")
		return
	}
	defer file.Close()

	// Parse CSV
	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		respondError(w, http.StatusBadRequest, "Failed to parse CSV")
		return
	}

	if len(records) < 2 {
		respondError(w, http.StatusBadRequest, "CSV must contain header and at least one row")
		return
	}

	// Parse header (case-insensitive)
	header := records[0]
	headerMap := make(map[string]int)
	for i, col := range header {
		headerMap[strings.ToLower(strings.TrimSpace(col))] = i
	}

	// Validate required columns
	if _, ok := headerMap["email"]; !ok {
		respondError(w, http.StatusBadRequest, "CSV must contain 'email' column")
		return
	}

	// Process targets
	var targets []models.Target
	var errors []string

	for i, record := range records[1:] {
		if len(record) != len(header) {
			errors = append(errors, fmt.Sprintf("Row %d: column count mismatch", i+2))
			continue
		}

		email := getColumn(record, headerMap, "email")
		if email == "" {
			errors = append(errors, fmt.Sprintf("Row %d: email is required", i+2))
			continue
		}

		// Basic email validation
		if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
			errors = append(errors, fmt.Sprintf("Row %d: invalid email format", i+2))
			continue
		}

		// Generate secure tracking token
		token, err := generateSecureToken()
		if err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: failed to generate token", i+2))
			continue
		}

		target := models.Target{
			CampaignID: campaign.ID,
			Email:      email,
			Name:       getColumn(record, headerMap, "name"),
			Department: getColumn(record, headerMap, "department"),
			Role:       getColumn(record, headerMap, "role"),
			Location:   getColumn(record, headerMap, "location"),
			EmployeeID: getColumn(record, headerMap, "employee_id"),
			Manager:    getColumn(record, headerMap, "manager"),
			Token:      token,
		}

		targets = append(targets, target)
	}

	// Bulk insert targets
	if len(targets) > 0 {
		if err := h.db.Create(&targets).Error; err != nil {
			respondError(w, http.StatusInternalServerError, "Failed to save targets")
			return
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"imported": len(targets),
		"errors":   errors,
		"message":  fmt.Sprintf("Imported %d targets", len(targets)),
	})
}

// SendCampaign starts sending emails for the campaign
func (h *CampaignHandler) SendCampaign(w http.ResponseWriter, r *http.Request) {
	campaignID := chi.URLParam(r, "id")

	// Get campaign with unsent targets
	var campaign models.Campaign
	if err := h.db.Preload("Targets", "sent = ?", false).First(&campaign, "id = ?", campaignID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Campaign not found")
		return
	}

	if len(campaign.Targets) == 0 {
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"message": "No unsent targets found",
			"sent":    0,
		})
		return
	}

	// Send emails in background (in production, use a job queue)
	go h.sendEmailsBatch(campaign)

	respondJSON(w, http.StatusAccepted, map[string]interface{}{
		"message": "Email sending started",
		"targets": len(campaign.Targets),
	})
}

// sendEmailsBatch sends emails with rate limiting
func (h *CampaignHandler) sendEmailsBatch(campaign models.Campaign) {
	appHost := getEnv("APP_HOST", "http://localhost:8080")

	for _, target := range campaign.Targets {
		// Replace placeholders in email
		subject := replacePlaceholders(campaign.EmailSubject, target)
		trackingLink := fmt.Sprintf("%s/t/%s", appHost, target.Token)
		trackingPixel := fmt.Sprintf(`<img src="%s/open/%s" width="1" height="1" style="display:none" />`, appHost, target.Token)
		
		body := replacePlaceholders(campaign.EmailBody, target)
		body = strings.ReplaceAll(body, "{{Link}}", trackingLink)
		body += trackingPixel // Add tracking pixel at end

		// Send email
		err := h.mailer.SendEmail(campaign.FromAddress, target.Email, subject, body)
		
		now := time.Now()
		if err == nil {
			// Mark as sent
			h.db.Model(&target).Updates(map[string]interface{}{
				"sent":    true,
				"sent_at": &now,
			})
		}

		// Rate limiting: sleep to avoid SMTP throttling
		time.Sleep(time.Millisecond * 500) // 2 emails per second
	}
}

// ExportResults exports campaign results to CSV
func (h *CampaignHandler) ExportResults(w http.ResponseWriter, r *http.Request) {
	campaignID := chi.URLParam(r, "id")

	var targets []models.Target
	if err := h.db.Preload("Events").Where("campaign_id = ?", campaignID).Find(&targets).Error; err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch targets")
		return
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=campaign_%s_results.csv", campaignID))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Write header
	writer.Write([]string{
		"Name", "Email", "Department", "Role", "Location", "Sent",
		"Opened", "Clicked", "Submitted", "First Opened", "First Clicked",
	})

	// Write data
	for _, target := range targets {
		hasOpened := false
		hasClicked := false
		hasSubmitted := false
		var firstOpened, firstClicked string

		for _, event := range target.Events {
			switch event.EventType {
			case "open":
				if !hasOpened {
					hasOpened = true
					firstOpened = event.CreatedAt.Format(time.RFC3339)
				}
			case "click":
				if !hasClicked {
					hasClicked = true
					firstClicked = event.CreatedAt.Format(time.RFC3339)
				}
			case "submit":
				hasSubmitted = true
			}
		}

		writer.Write([]string{
			target.Name,
			target.Email,
			target.Department,
			target.Role,
			target.Location,
			fmt.Sprintf("%v", target.Sent),
			fmt.Sprintf("%v", hasOpened),
			fmt.Sprintf("%v", hasClicked),
			fmt.Sprintf("%v", hasSubmitted),
			firstOpened,
			firstClicked,
		})
	}
}

// Helper functions

func getColumn(record []string, headerMap map[string]int, column string) string {
	if idx, ok := headerMap[column]; ok && idx < len(record) {
		return strings.TrimSpace(record[idx])
	}
	return ""
}

func generateSecureToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func replacePlaceholders(text string, target models.Target) string {
	text = strings.ReplaceAll(text, "{{Name}}", target.Name)
	text = strings.ReplaceAll(text, "{{Email}}", target.Email)
	text = strings.ReplaceAll(text, "{{Department}}", target.Department)
	text = strings.ReplaceAll(text, "{{Role}}", target.Role)
	text = strings.ReplaceAll(text, "{{Location}}", target.Location)
	text = strings.ReplaceAll(text, "{{EmployeeID}}", target.EmployeeID)
	text = strings.ReplaceAll(text, "{{Manager}}", target.Manager)
	return text
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}