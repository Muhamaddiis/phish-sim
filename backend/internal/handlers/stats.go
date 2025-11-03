package handlers

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"

	"github.com/Muhamaddiis/phish-sim/internal/models"
)

type StatsHandler struct {
	db *gorm.DB
}

func NewStatsHandler(db *gorm.DB) *StatsHandler {
	return &StatsHandler{db: db}
}

// GetCampaignStats returns detailed statistics for a specific campaign
func (h *StatsHandler) GetCampaignStats(w http.ResponseWriter, r *http.Request) {
	campaignID := chi.URLParam(r, "id")

	// Get campaign
	var campaign models.Campaign
	if err := h.db.First(&campaign, "id = ?", campaignID).Error; err != nil {
		respondError(w, http.StatusNotFound, "Campaign not found")
		return
	}

	// Calculate overall stats
	stats := h.calculateCampaignStats(campaignID)

	// Calculate per-department stats
	groupBy := r.URL.Query().Get("group_by")
	if groupBy == "" {
		groupBy = "department"
	}

	departmentStats := h.calculateGroupedStats(campaignID, groupBy)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"campaign":         campaign,
		"overall_stats":    stats,
		"department_stats": departmentStats,
		"grouped_by":       groupBy,
	})
}

// GetOverallStats returns statistics across all campaigns
func (h *StatsHandler) GetOverallStats(w http.ResponseWriter, r *http.Request) {
	groupBy := r.URL.Query().Get("group_by")
	if groupBy == "" {
		groupBy = "department"
	}

	// Overall statistics
	var totalTargets int64
	var totalSent int64
	h.db.Model(&models.Target{}).Count(&totalTargets)
	h.db.Model(&models.Target{}).Where("sent = ?", true).Count(&totalSent)

	// Count unique events
	var totalOpened int64
	var totalClicked int64
	var totalSubmitted int64

	h.db.Raw(`
		SELECT COUNT(DISTINCT target_id) 
		FROM events 
		WHERE event_type = 'open'
	`).Scan(&totalOpened)

	h.db.Raw(`
		SELECT COUNT(DISTINCT target_id) 
		FROM events 
		WHERE event_type = 'click'
	`).Scan(&totalClicked)

	h.db.Raw(`
		SELECT COUNT(DISTINCT target_id) 
		FROM events 
		WHERE event_type = 'submit'
	`).Scan(&totalSubmitted)

	overallStats := map[string]interface{}{
		"total_targets":   totalTargets,
		"emails_sent":     totalSent,
		"opened":          totalOpened,
		"clicked":         totalClicked,
		"submitted":       totalSubmitted,
		"open_rate":       calculateRate(totalOpened, totalSent),
		"click_rate":      calculateRate(totalClicked, totalSent),
		"submit_rate":     calculateRate(totalSubmitted, totalSent),
	}

	// Get campaign-level stats
	var campaigns []models.Campaign
	h.db.Find(&campaigns)

	var campaignStats []models.CampaignStats
	for _, campaign := range campaigns {
		stats := h.calculateCampaignStats(campaign.ID.String())
		stats.CampaignID = campaign.ID
		stats.CampaignName = campaign.Name
		campaignStats = append(campaignStats, stats)
	}

	// Get grouped stats across all campaigns
	groupedStats := h.calculateAllGroupedStats(groupBy)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"overall_stats":   overallStats,
		"campaign_stats":  campaignStats,
		"grouped_stats":   groupedStats,
		"grouped_by":      groupBy,
	})
}

// calculateCampaignStats calculates statistics for a campaign
func (h *StatsHandler) calculateCampaignStats(campaignID string) models.CampaignStats {
	var stats models.CampaignStats

	// Count targets
	h.db.Model(&models.Target{}).Where("campaign_id = ?", campaignID).Count(&stats.TotalTargets)
	h.db.Model(&models.Target{}).Where("campaign_id = ? AND sent = ?", campaignID, true).Count(&stats.EmailsSent)

	// Count unique events per type
	h.db.Raw(`
		SELECT COUNT(DISTINCT t.id)
		FROM targets t
		INNER JOIN events e ON e.target_id = t.id
		WHERE t.campaign_id = ? AND e.event_type = 'open'
	`, campaignID).Scan(&stats.Opened)

	h.db.Raw(`
		SELECT COUNT(DISTINCT t.id)
		FROM targets t
		INNER JOIN events e ON e.target_id = t.id
		WHERE t.campaign_id = ? AND e.event_type = 'click'
	`, campaignID).Scan(&stats.Clicked)

	h.db.Raw(`
		SELECT COUNT(DISTINCT t.id)
		FROM targets t
		INNER JOIN events e ON e.target_id = t.id
		WHERE t.campaign_id = ? AND e.event_type = 'submit'
	`, campaignID).Scan(&stats.Submitted)

	// Calculate rates
	stats.OpenRate = calculateRate(stats.Opened, stats.EmailsSent)
	stats.ClickRate = calculateRate(stats.Clicked, stats.EmailsSent)
	stats.SubmitRate = calculateRate(stats.Submitted, stats.EmailsSent)

	return stats
}

// calculateGroupedStats calculates statistics grouped by field (department, role, location)
func (h *StatsHandler) calculateGroupedStats(campaignID, groupBy string) []models.DepartmentStats {
	var stats []models.DepartmentStats

	query := fmt.Sprintf(`
		SELECT 
			COALESCE(t.%s, 'Unknown') as group_name,
			COUNT(t.id) as total,
			COUNT(CASE WHEN t.sent = true THEN 1 END) as sent,
			COUNT(DISTINCT CASE WHEN e.event_type = 'open' THEN e.target_id END) as opened,
			COUNT(DISTINCT CASE WHEN e.event_type = 'click' THEN e.target_id END) as clicked,
			COUNT(DISTINCT CASE WHEN e.event_type = 'submit' THEN e.target_id END) as submitted
		FROM targets t
		LEFT JOIN events e ON e.target_id = t.id
		WHERE t.campaign_id = ?
		GROUP BY t.%s
		ORDER BY sent DESC
	`, groupBy, groupBy)

	rows, err := h.db.Raw(query, campaignID).Rows()
	if err != nil {
		return stats
	}
	defer rows.Close()

	for rows.Next() {
		var groupName string
		var total, sent, opened, clicked, submitted int64

		rows.Scan(&groupName, &total, &sent, &opened, &clicked, &submitted)

		stat := models.DepartmentStats{
			Department: groupName,
			EmailsSent: sent,
			Opened:     opened,
			Clicked:    clicked,
			Submitted:  submitted,
			OpenRate:   calculateRate(opened, sent),
			ClickRate:  calculateRate(clicked, sent),
			SubmitRate: calculateRate(submitted, sent),
		}
		stats = append(stats, stat)
	}

	return stats
}

// calculateAllGroupedStats calculates grouped stats across all campaigns
func (h *StatsHandler) calculateAllGroupedStats(groupBy string) []models.DepartmentStats {
	var stats []models.DepartmentStats

	query := fmt.Sprintf(`
		SELECT 
			COALESCE(t.%s, 'Unknown') as group_name,
			COUNT(t.id) as total,
			COUNT(CASE WHEN t.sent = true THEN 1 END) as sent,
			COUNT(DISTINCT CASE WHEN e.event_type = 'open' THEN e.target_id END) as opened,
			COUNT(DISTINCT CASE WHEN e.event_type = 'click' THEN e.target_id END) as clicked,
			COUNT(DISTINCT CASE WHEN e.event_type = 'submit' THEN e.target_id END) as submitted
		FROM targets t
		LEFT JOIN events e ON e.target_id = t.id
		GROUP BY t.%s
		ORDER BY sent DESC
	`, groupBy, groupBy)

	rows, err := h.db.Raw(query).Rows()
	if err != nil {
		return stats
	}
	defer rows.Close()

	for rows.Next() {
		var groupName string
		var total, sent, opened, clicked, submitted int64

		rows.Scan(&groupName, &total, &sent, &opened, &clicked, &submitted)

		stat := models.DepartmentStats{
			Department: groupName,
			EmailsSent: sent,
			Opened:     opened,
			Clicked:    clicked,
			Submitted:  submitted,
			OpenRate:   calculateRate(opened, sent),
			ClickRate:  calculateRate(clicked, sent),
			SubmitRate: calculateRate(submitted, sent),
		}
		stats = append(stats, stat)
	}

	return stats
}

// calculateRate calculates percentage rate
func calculateRate(numerator, denominator int64) float64 {
	if denominator == 0 {
		return 0.0
	}
	return float64(numerator) / float64(denominator) * 100.0
}