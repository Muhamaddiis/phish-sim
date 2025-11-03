package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a system user (admin, SOC analyst, viewer)
type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Username     string    `gorm:"unique;not null" json:"username"`
	PasswordHash string    `gorm:"not null" json:"-"` // Never expose in JSON
	Role         string    `gorm:"not null;default:'viewer'" json:"role"` // admin, soc, viewer
	CreatedAt    time.Time `json:"created_at"`
}

// BeforeCreate hook to generate UUID before creating user
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// Campaign represents a phishing simulation campaign
type Campaign struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name         string    `gorm:"not null" json:"name"`
	EmailSubject string    `gorm:"not null" json:"email_subject"`
	EmailBody    string    `gorm:"type:text;not null" json:"email_body"` // HTML with placeholders
	FromAddress  string    `gorm:"not null" json:"from_address"`
	CreatedBy    uuid.UUID `gorm:"type:uuid" json:"created_by"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Relationships
	Targets []Target `gorm:"foreignKey:CampaignID" json:"targets,omitempty"`
}

func (c *Campaign) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// Target represents an individual email recipient in a campaign
type Target struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	CampaignID uuid.UUID `gorm:"type:uuid;not null;index" json:"campaign_id"`
	Name       string    `json:"name"`
	Email      string    `gorm:"not null;index" json:"email"`
	Department string    `json:"department"`
	Role       string    `json:"role"`
	Location   string    `json:"location"`
	EmployeeID string    `json:"employee_id"`
	Manager    string    `json:"manager"`
	Token      string    `gorm:"unique;not null;index" json:"token"` // Tracking token
	Sent       bool      `gorm:"default:false" json:"sent"`
	SentAt     *time.Time `json:"sent_at,omitempty"`
	CreatedAt  time.Time `json:"created_at"`

	// Relationships
	Events []Event `gorm:"foreignKey:TargetID" json:"events,omitempty"`
}

func (t *Target) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// Event represents a tracking event (open, click, submit)
type Event struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	TargetID  uuid.UUID      `gorm:"type:uuid;not null;index" json:"target_id"`
	EventType string         `gorm:"not null;index" json:"event_type"` // open, click, submit
	Meta      map[string]interface{} `gorm:"type:jsonb" json:"meta"` // IP, User-Agent, form data, etc.
	CreatedAt time.Time      `json:"created_at"`
}

func (e *Event) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// CampaignStats represents aggregated statistics for a campaign
type CampaignStats struct {
	CampaignID     uuid.UUID `json:"campaign_id"`
	CampaignName   string    `json:"campaign_name"`
	TotalTargets   int64     `json:"total_targets"`
	EmailsSent     int64     `json:"emails_sent"`
	Opened         int64     `json:"opened"`
	Clicked        int64     `json:"clicked"`
	Submitted      int64     `json:"submitted"`
	OpenRate       float64   `json:"open_rate"`
	ClickRate      float64   `json:"click_rate"`
	SubmitRate     float64   `json:"submit_rate"`
}

// DepartmentStats represents statistics grouped by department
type DepartmentStats struct {
	Department string  `json:"department"`
	EmailsSent int64   `json:"emails_sent"`
	Opened     int64   `json:"opened"`
	Clicked    int64   `json:"clicked"`
	Submitted  int64   `json:"submitted"`
	OpenRate   float64 `json:"open_rate"`
	ClickRate  float64 `json:"click_rate"`
	SubmitRate float64 `json:"submit_rate"`
}


// TargetWithEvents includes target and their event history
type TargetWithEvents struct {
	Target
	HasOpened    bool      `json:"has_opened"`
	HasClicked   bool      `json:"has_clicked"`
	HasSubmitted bool      `json:"has_submitted"`
	FirstOpened  *time.Time `json:"first_opened,omitempty"`
	FirstClicked *time.Time `json:"first_clicked,omitempty"`
	FirstSubmitted *time.Time `json:"first_submitted,omitempty"`
}