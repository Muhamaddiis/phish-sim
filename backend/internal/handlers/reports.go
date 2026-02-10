package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"gorm.io/gorm"

	"github.com/Muhamaddiis/phish-sim/internal/models"
)

type ReportsHandler struct {
	db *gorm.DB
}

func NewReportsHandler(db *gorm.DB) *ReportsHandler {
	return &ReportsHandler{db: db}
}

// ExecutiveReport represents a high-level summary for executives
type ExecutiveReport struct {
	GeneratedAt       time.Time                `json:"generated_at"`
	ReportPeriod      string                   `json:"report_period"`
	OverallMetrics    OverallMetrics           `json:"overall_metrics"`
	TrendAnalysis     TrendAnalysis            `json:"trend_analysis"`
	DepartmentRanking []DepartmentRanking      `json:"department_ranking"`
	RiskAssessment    RiskAssessment           `json:"risk_assessment"`
	TopVulnerable     []VulnerableUser         `json:"top_vulnerable"`
	Recommendations   []string                 `json:"recommendations"`
	CampaignSummary   []CampaignSummaryMetrics `json:"campaign_summary"`
}

type OverallMetrics struct {
	TotalCampaigns        int     `json:"total_campaigns"`
	TotalEmailsSent       int64   `json:"total_emails_sent"`
	TotalTargets          int64   `json:"total_targets"`
	AverageOpenRate       float64 `json:"average_open_rate"`
	AverageClickRate      float64 `json:"average_click_rate"`
	AverageSubmitRate     float64 `json:"average_submit_rate"`
	ImprovementFromLast   float64 `json:"improvement_from_last_period"`
	MostVulnerableDept    string  `json:"most_vulnerable_department"`
	LeastVulnerableDept   string  `json:"least_vulnerable_department"`
	TotalUsersCompromised int64   `json:"total_users_compromised"`
}

type TrendAnalysis struct {
	OpenRateTrend     string  `json:"open_rate_trend"` // "improving", "declining", "stable"
	ClickRateTrend    string  `json:"click_rate_trend"`
	SubmitRateTrend   string  `json:"submit_rate_trend"`
	MonthOverMonth    float64 `json:"month_over_month_change"`
	PredictedNextRate float64 `json:"predicted_next_rate"`
}

type DepartmentRanking struct {
	Department   string  `json:"department"`
	ClickRate    float64 `json:"click_rate"`
	SubmitRate   float64 `json:"submit_rate"`
	RiskScore    float64 `json:"risk_score"` // 0-100, higher = more vulnerable
	RiskLevel    string  `json:"risk_level"` // "Low", "Medium", "High", "Critical"
	TotalTargets int     `json:"total_targets"`
	Compromised  int     `json:"compromised"`
}

type RiskAssessment struct {
	OverallRiskLevel  string  `json:"overall_risk_level"`
	RiskScore         float64 `json:"risk_score"`
	HighRiskDepts     int     `json:"high_risk_departments"`
	CriticalUsers     int     `json:"critical_users"` // Users who fell for multiple campaigns
	RecommendedAction string  `json:"recommended_action"`
}

type VulnerableUser struct {
	Name             string  `json:"name"`
	Email            string  `json:"email"`
	Department       string  `json:"department"`
	TimesCompromised int     `json:"times_compromised"`
	LastCompromised  string  `json:"last_compromised"`
	RiskScore        float64 `json:"risk_score"`
}

type CampaignSummaryMetrics struct {
	CampaignName  string    `json:"campaign_name"`
	SentDate      time.Time `json:"sent_date"`
	TotalSent     int       `json:"total_sent"`
	OpenRate      float64   `json:"open_rate"`
	ClickRate     float64   `json:"click_rate"`
	SubmitRate    float64   `json:"submit_rate"`
	Effectiveness string    `json:"effectiveness"` // "Excellent", "Good", "Fair", "Poor"
}

// GetExecutiveReport generates comprehensive executive summary
func (h *ReportsHandler) GetExecutiveReport(w http.ResponseWriter, r *http.Request) {
	// Get optional date range from query params
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	// Default to last 30 days if not specified
	if startDate == "" {
		startDate = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	report := ExecutiveReport{
		GeneratedAt:  time.Now(),
		ReportPeriod: fmt.Sprintf("%s to %s", startDate, endDate),
	}

	// Calculate overall metrics
	report.OverallMetrics = h.calculateOverallMetrics(startDate, endDate)

	// Calculate trend analysis
	report.TrendAnalysis = h.calculateTrendAnalysis(startDate, endDate)

	// Get department rankings
	report.DepartmentRanking = h.getDepartmentRankings()

	// Calculate risk assessment
	report.RiskAssessment = h.calculateRiskAssessment()

	// Get top vulnerable users
	report.TopVulnerable = h.getTopVulnerableUsers(10)

	// Generate recommendations
	report.Recommendations = h.generateRecommendations(report)

	// Get campaign summary
	report.CampaignSummary = h.getCampaignSummary(startDate, endDate)

	respondJSON(w, http.StatusOK, report)
}

// calculateOverallMetrics computes high-level metrics
func (h *ReportsHandler) calculateOverallMetrics(startDate, endDate string) OverallMetrics {
	var metrics OverallMetrics

	// Count campaigns in period
	var campaignCount int64
	h.db.Model(&models.Campaign{}).
		Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Count(&campaignCount)
	metrics.TotalCampaigns = int(campaignCount)

	// Total emails sent
	h.db.Model(&models.Target{}).
		Where("sent = true AND sent_at >= ? AND sent_at <= ?", startDate, endDate).
		Count(&metrics.TotalEmailsSent)

	// Total unique targets
	h.db.Model(&models.Target{}).
		Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Count(&metrics.TotalTargets)

	// Calculate rates
	var opened, clicked, submitted int64
	h.db.Raw(`
		SELECT COUNT(DISTINCT e.target_id)
		FROM events e
		JOIN targets t ON e.target_id = t.id
		WHERE e.event_type = 'open' 
		AND e.created_at >= ? AND e.created_at <= ?
	`, startDate, endDate).Scan(&opened)

	h.db.Raw(`
		SELECT COUNT(DISTINCT e.target_id)
		FROM events e
		JOIN targets t ON e.target_id = t.id
		WHERE e.event_type = 'click' 
		AND e.created_at >= ? AND e.created_at <= ?
	`, startDate, endDate).Scan(&clicked)

	h.db.Raw(`
		SELECT COUNT(DISTINCT e.target_id)
		FROM events e
		JOIN targets t ON e.target_id = t.id
		WHERE e.event_type = 'submit' 
		AND e.created_at >= ? AND e.created_at <= ?
	`, startDate, endDate).Scan(&submitted)

	if metrics.TotalEmailsSent > 0 {
		metrics.AverageOpenRate = float64(opened) / float64(metrics.TotalEmailsSent) * 100
		metrics.AverageClickRate = float64(clicked) / float64(metrics.TotalEmailsSent) * 100
		metrics.AverageSubmitRate = float64(submitted) / float64(metrics.TotalEmailsSent) * 100
	}

	metrics.TotalUsersCompromised = submitted

	// Get most/least vulnerable departments
	deptRankings := h.getDepartmentRankings()
	if len(deptRankings) > 0 {
		metrics.MostVulnerableDept = deptRankings[0].Department
		metrics.LeastVulnerableDept = deptRankings[len(deptRankings)-1].Department
	}

	return metrics
}

// calculateTrendAnalysis analyzes trends over time
func (h *ReportsHandler) calculateTrendAnalysis(startDate, endDate string) TrendAnalysis {
	var trend TrendAnalysis

	// Get previous period metrics for comparison
	start, _ := time.Parse("2006-01-02", startDate)
	end, _ := time.Parse("2006-01-02", endDate)
	duration := end.Sub(start)

	prevStart := start.Add(-duration)
	prevEnd := start

	currentMetrics := h.calculateOverallMetrics(startDate, endDate)
	previousMetrics := h.calculateOverallMetrics(
		prevStart.Format("2006-01-02"),
		prevEnd.Format("2006-01-02"),
	)

	// Calculate month-over-month change
	if previousMetrics.AverageClickRate > 0 {
		trend.MonthOverMonth = ((currentMetrics.AverageClickRate - previousMetrics.AverageClickRate) /
			previousMetrics.AverageClickRate) * 100
	}

	// Determine trends
	clickChange := currentMetrics.AverageClickRate - previousMetrics.AverageClickRate
	if clickChange < -5 {
		trend.ClickRateTrend = "improving"
	} else if clickChange > 5 {
		trend.ClickRateTrend = "declining"
	} else {
		trend.ClickRateTrend = "stable"
	}

	submitChange := currentMetrics.AverageSubmitRate - previousMetrics.AverageSubmitRate
	if submitChange < -5 {
		trend.SubmitRateTrend = "improving"
	} else if submitChange > 5 {
		trend.SubmitRateTrend = "declining"
	} else {
		trend.SubmitRateTrend = "stable"
	}

	// Simple linear prediction
	trend.PredictedNextRate = currentMetrics.AverageClickRate + (clickChange * 1.2)
	if trend.PredictedNextRate < 0 {
		trend.PredictedNextRate = 0
	}

	return trend
}

// getDepartmentRankings ranks departments by vulnerability
func (h *ReportsHandler) getDepartmentRankings() []DepartmentRanking {
	var rankings []DepartmentRanking

	rows, err := h.db.Raw(`
		SELECT 
			COALESCE(t.department, 'Unknown') as department,
			COUNT(CASE WHEN t.sent = true THEN 1 END) as total_sent,
			COUNT(DISTINCT CASE WHEN e.event_type = 'click' THEN e.target_id END) as clicked,
			COUNT(DISTINCT CASE WHEN e.event_type = 'submit' THEN e.target_id END) as submitted
		FROM targets t
		LEFT JOIN events e ON e.target_id = t.id
		GROUP BY t.department
		HAVING COUNT(CASE WHEN t.sent = true THEN 1 END) > 0
		ORDER BY submitted DESC, clicked DESC
	`).Rows()

	if err != nil {
		return rankings
	}
	defer rows.Close()

	for rows.Next() {
		var dept string
		var totalSent, clicked, submitted int64

		rows.Scan(&dept, &totalSent, &clicked, &submitted)

		clickRate := 0.0
		submitRate := 0.0
		if totalSent > 0 {
			clickRate = float64(clicked) / float64(totalSent) * 100
			submitRate = float64(submitted) / float64(totalSent) * 100
		}

		// Calculate risk score (0-100)
		// Formula: (click_rate * 0.4) + (submit_rate * 0.6)
		riskScore := (clickRate * 0.4) + (submitRate * 0.6)

		// Determine risk level
		riskLevel := "Low"
		if riskScore >= 40 {
			riskLevel = "Critical"
		} else if riskScore >= 25 {
			riskLevel = "High"
		} else if riskScore >= 15 {
			riskLevel = "Medium"
		}

		rankings = append(rankings, DepartmentRanking{
			Department:   dept,
			ClickRate:    clickRate,
			SubmitRate:   submitRate,
			RiskScore:    riskScore,
			RiskLevel:    riskLevel,
			TotalTargets: int(totalSent),
			Compromised:  int(submitted),
		})
	}

	return rankings
}

// calculateRiskAssessment provides overall risk assessment
func (h *ReportsHandler) calculateRiskAssessment() RiskAssessment {
	var assessment RiskAssessment

	rankings := h.getDepartmentRankings()

	// Count high-risk departments
	totalRiskScore := 0.0
	for _, dept := range rankings {
		totalRiskScore += dept.RiskScore
		if dept.RiskLevel == "High" || dept.RiskLevel == "Critical" {
			assessment.HighRiskDepts++
		}
	}

	// Calculate overall risk score
	if len(rankings) > 0 {
		assessment.RiskScore = totalRiskScore / float64(len(rankings))
	}

	// Determine overall risk level
	if assessment.RiskScore >= 40 {
		assessment.OverallRiskLevel = "Critical"
		assessment.RecommendedAction = "Immediate mandatory security training required for all departments"
	} else if assessment.RiskScore >= 25 {
		assessment.OverallRiskLevel = "High"
		assessment.RecommendedAction = "Implement targeted training for high-risk departments within 2 weeks"
	} else if assessment.RiskScore >= 15 {
		assessment.OverallRiskLevel = "Medium"
		assessment.RecommendedAction = "Schedule quarterly security awareness training"
	} else {
		assessment.OverallRiskLevel = "Low"
		assessment.RecommendedAction = "Maintain current security awareness program"
	}

	// Count critical users (fell for 2+ campaigns)
	h.db.Raw(`
		SELECT COUNT(*)
		FROM (
			SELECT target_id
			FROM events
			WHERE event_type = 'submit'
			GROUP BY target_id
			HAVING COUNT(*) >= 2
		) as critical_users
	`).Scan(&assessment.CriticalUsers)

	return assessment
}

// getTopVulnerableUsers identifies most at-risk users
func (h *ReportsHandler) getTopVulnerableUsers(limit int) []VulnerableUser {
	var users []VulnerableUser

	rows, err := h.db.Raw(`
		SELECT 
			t.name,
			t.email,
			COALESCE(t.department, 'Unknown') as department,
			COUNT(e.id) as times_compromised,
			MAX(e.created_at) as last_compromised
		FROM targets t
		INNER JOIN events e ON e.target_id = t.id
		WHERE e.event_type = 'submit'
		GROUP BY t.id, t.name, t.email, t.department
		ORDER BY times_compromised DESC, last_compromised DESC
		LIMIT ?
	`, limit).Rows()

	if err != nil {
		return users
	}
	defer rows.Close()

	for rows.Next() {
		var user VulnerableUser
		var lastComp time.Time

		rows.Scan(&user.Name, &user.Email, &user.Department, &user.TimesCompromised, &lastComp)
		user.LastCompromised = lastComp.Format("2006-01-02")
		user.RiskScore = float64(user.TimesCompromised) * 25.0 // 25 points per compromise
		if user.RiskScore > 100 {
			user.RiskScore = 100
		}

		users = append(users, user)
	}

	return users
}

// generateRecommendations creates actionable recommendations
func (h *ReportsHandler) generateRecommendations(report ExecutiveReport) []string {
	var recommendations []string

	// Based on overall metrics
	if report.OverallMetrics.AverageClickRate > 30 {
		recommendations = append(recommendations,
			"Click rate exceeds 30% - Implement immediate company-wide security awareness training")
	}

	if report.OverallMetrics.AverageSubmitRate > 20 {
		recommendations = append(recommendations,
			"Submit rate exceeds 20% - Critical: Deploy multi-factor authentication organization-wide")
	}

	// Based on trends
	switch report.TrendAnalysis.ClickRateTrend {
	case "declining":
		recommendations = append(recommendations,
			"Security awareness is declining - Increase training frequency and update content")
	case "improving":
		recommendations = append(recommendations,
			"Positive trend detected - Continue current training programs")
	}

	// Based on vulnerable users
	if len(report.TopVulnerable) > 0 {
		recommendations = append(recommendations,
			fmt.Sprintf("Provide one-on-one security coaching for %d repeatedly compromised users", len(report.TopVulnerable)))
	}

	// Based on departments
	highRiskCount := 0
	for _, dept := range report.DepartmentRanking {
		if dept.RiskLevel == "High" || dept.RiskLevel == "Critical" {
			highRiskCount++
		}
	}

	if highRiskCount > 0 {
		recommendations = append(recommendations,
			fmt.Sprintf("Deploy targeted training for %d high-risk departments", highRiskCount))
	}

	// Default recommendation
	if len(recommendations) == 0 {
		recommendations = append(recommendations,
			"Maintain regular phishing simulations to sustain security awareness")
	}

	return recommendations
}

// getCampaignSummary provides summary of recent campaigns
func (h *ReportsHandler) getCampaignSummary(startDate, endDate string) []CampaignSummaryMetrics {
	var summaries []CampaignSummaryMetrics

	var campaigns []models.Campaign
	h.db.Where("created_at >= ? AND created_at <= ?", startDate, endDate).
		Order("created_at DESC").
		Find(&campaigns)

	for _, campaign := range campaigns {
		stats := h.calculateCampaignStatsForReport(campaign.ID.String())

		effectiveness := "Poor"
		if stats.SubmitRate < 10 {
			effectiveness = "Excellent"
		} else if stats.SubmitRate < 20 {
			effectiveness = "Good"
		} else if stats.SubmitRate < 30 {
			effectiveness = "Fair"
		}

		summaries = append(summaries, CampaignSummaryMetrics{
			CampaignName:  campaign.Name,
			SentDate:      campaign.CreatedAt,
			TotalSent:     int(stats.EmailsSent),
			OpenRate:      stats.OpenRate,
			ClickRate:     stats.ClickRate,
			SubmitRate:    stats.SubmitRate,
			Effectiveness: effectiveness,
		})
	}

	return summaries
}

func (h *ReportsHandler) calculateCampaignStatsForReport(campaignID string) models.CampaignStats {
	var stats models.CampaignStats

	h.db.Model(&models.Target{}).Where("campaign_id = ?", campaignID).Count(&stats.TotalTargets)
	h.db.Model(&models.Target{}).Where("campaign_id = ? AND sent = ?", campaignID, true).Count(&stats.EmailsSent)

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

	if stats.EmailsSent > 0 {
		stats.OpenRate = float64(stats.Opened) / float64(stats.EmailsSent) * 100
		stats.ClickRate = float64(stats.Clicked) / float64(stats.EmailsSent) * 100
		stats.SubmitRate = float64(stats.Submitted) / float64(stats.EmailsSent) * 100
	}

	return stats
}

// ExportExecutiveReportCSV exports report as CSV
func (h *ReportsHandler) ExportExecutiveReportCSV(w http.ResponseWriter, r *http.Request) {
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	if startDate == "" {
		startDate = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	metrics := h.calculateOverallMetrics(startDate, endDate)
	deptRankings := h.getDepartmentRankings()

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=executive_report_%s.csv", time.Now().Format("2006-01-02")))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Overall Metrics Section
	writer.Write([]string{"EXECUTIVE SECURITY REPORT"})
	writer.Write([]string{"Period", startDate + " to " + endDate})
	writer.Write([]string{})
	writer.Write([]string{"OVERALL METRICS"})
	writer.Write([]string{"Total Campaigns", strconv.Itoa(metrics.TotalCampaigns)})
	writer.Write([]string{"Total Emails Sent", strconv.FormatInt(metrics.TotalEmailsSent, 10)})
	writer.Write([]string{"Average Click Rate", fmt.Sprintf("%.2f%%", metrics.AverageClickRate)})
	writer.Write([]string{"Average Submit Rate", fmt.Sprintf("%.2f%%", metrics.AverageSubmitRate)})
	writer.Write([]string{"Users Compromised", strconv.FormatInt(metrics.TotalUsersCompromised, 10)})
	writer.Write([]string{})

	// Department Rankings
	writer.Write([]string{"DEPARTMENT RISK RANKINGS"})
	writer.Write([]string{"Department", "Click Rate", "Submit Rate", "Risk Level", "Risk Score", "Total Targets", "Compromised"})

	for _, dept := range deptRankings {
		writer.Write([]string{
			dept.Department,
			fmt.Sprintf("%.2f%%", dept.ClickRate),
			fmt.Sprintf("%.2f%%", dept.SubmitRate),
			dept.RiskLevel,
			fmt.Sprintf("%.2f", dept.RiskScore),
			strconv.Itoa(dept.TotalTargets),
			strconv.Itoa(dept.Compromised),
		})
	}
}
