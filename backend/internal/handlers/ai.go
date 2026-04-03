package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

type AIHandler struct{}

func NewAIHandler() *AIHandler {
	return &AIHandler{}
}

type GenerateEmailRequest struct {
	Description string `json:"description"`
	Tone        string `json:"tone"`        // professional, urgent, casual
	Purpose     string `json:"purpose"`     // password_reset, security_alert, hr_notice, etc.
}

type GenerateEmailResponse struct {
	Subject  string `json:"subject"`
	Body     string `json:"body"`
	Preview  string `json:"preview"`
}

// GenerateEmail uses Gemini AI to generate phishing email templates
func (h *AIHandler) GenerateEmail(w http.ResponseWriter, r *http.Request) {
	var req GenerateEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Description == "" {
		respondError(w, http.StatusBadRequest, "Description is required")
		return
	}

	// Get Gemini API key from environment
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		respondError(w, http.StatusInternalServerError, "AI service not configured")
		return
	}

	// Build the prompt
	prompt := buildEmailPrompt(req)

	// Call Gemini API
	emailContent, err := callGeminiAPI(apiKey, prompt)
	if err != nil {
		respondError(w, http.StatusInternalServerError, fmt.Sprintf("AI generation failed: %v", err))
		return
	}

	// Parse the response
	response, err := parseAIResponse(emailContent)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to parse AI response")
		return
	}

	respondJSON(w, http.StatusOK, response)
}

// buildEmailPrompt creates a detailed prompt for Gemini
func buildEmailPrompt(req GenerateEmailRequest) string {
	toneGuidance := map[string]string{
		"professional": "formal and professional tone, use proper business language",
		"urgent":       "urgent and time-sensitive tone, create sense of immediacy",
		"casual":       "friendly and casual tone, conversational language",
	}

	purposeGuidance := map[string]string{
		"password_reset":  "password reset or account verification scenario",
		"security_alert":  "security alert or unusual activity notification",
		"hr_notice":       "HR announcement or benefits update",
		"it_update":       "IT system update or maintenance notice",
		"invoice":         "invoice or payment request",
		"document_share":  "document sharing or collaboration request",
	}

	tone := toneGuidance[req.Tone]
	if tone == "" {
		tone = toneGuidance["professional"]
	}

	purpose := purposeGuidance[req.Purpose]
	if purpose == "" {
		purpose = "general corporate communication"
	}

	prompt := fmt.Sprintf(`You are an expert at creating realistic phishing simulation emails for security awareness training.

IMPORTANT CONTEXT: This is for AUTHORIZED security training to educate employees about phishing attacks.

Task: Generate a phishing simulation email based on the following:

Description: %s
Tone: %s
Scenario Type: %s

Requirements:
1. Create a REALISTIC but SAFE phishing email (this is for training)
2. Use proper HTML formatting with inline styles
3. Include these EXACT placeholders (do NOT replace them):
   - {{Name}} - for recipient's name
   - {{Email}} - for recipient's email
   - {{Department}} - for department
   - {{Role}} - for job title
   - {{Link}} - for the tracking link (MUST be included)
4. Make it look like a legitimate corporate email
5. Include subtle red flags that trained users should catch
6. Use realistic sender names (e.g., "IT Security Team", "HR Department")
7. Keep the email concise (200-300 words)
8. Make the HTML mobile-responsive

Return your response in this EXACT JSON format (no markdown, no code blocks):
{
  "subject": "Email subject line here",
  "body": "Complete HTML email body here with {{placeholders}}",
  "preview": "First 100 characters of email for preview"
}

The HTML should be production-ready with proper styling.`, req.Description, tone, purpose)

	return prompt
}

// callGeminiAPI makes a request to Google's Gemini API
func callGeminiAPI(apiKey, prompt string) (string, error) {
	// 1. Use the correct v1beta endpoint for Gemini 3
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=%s", apiKey)

	requestBody := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature":       0.7,
			"maxOutputTokens":   2048,
			"response_mime_type": "application/json",
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no content in API response")
	}

	return result.Candidates[0].Content.Parts[0].Text, nil
}

// parseAIResponse extracts the JSON from Gemini's response
func parseAIResponse(response string) (*GenerateEmailResponse, error) {
    // 1. Log the RAW string from Gemini to see the exact format
    log.Printf("RAW AI RESPONSE: %s", response)

    // 2. Clean the string
    cleaned := cleanJSONResponse(response)
    log.Printf("CLEANED RESPONSE: %s", cleaned)

    var emailResp GenerateEmailResponse
    if err := json.Unmarshal([]byte(cleaned), &emailResp); err != nil {
        // 3. Log the specific JSON error
        log.Printf("JSON Unmarshal Error: %v", err)
        return nil, err
    }

    return &emailResp, nil
}

// cleanJSONResponse removes markdown code blocks and extra whitespace
func cleanJSONResponse(response string) string {
	// Remove ```json and ``` markers if present
	response = trimPrefix(response, "```json")
	response = trimPrefix(response, "```")
	response = trimSuffix(response, "```")
	
	// Find first { and last }
	start := -1
	end := -1
	
	for i, ch := range response {
		if ch == '{' && start == -1 {
			start = i
		}
		if ch == '}' {
			end = i
		}
	}
	
	if start != -1 && end != -1 && end > start {
		return response[start : end+1]
	}
	
	return response
}

func trimPrefix(s, prefix string) string {
	if len(s) >= len(prefix) && s[:len(prefix)] == prefix {
		return s[len(prefix):]
	}
	return s
}

func trimSuffix(s, suffix string) string {
	if len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix {
		return s[:len(s)-len(suffix)]
	}
	return s
}

// func contains(s, substr string) bool {
// 	return len(s) >= len(substr) && 
// 		   (s == substr || 
// 		    (len(s) > len(substr) && 
// 			 findSubstring(s, substr)))
// }

// func findSubstring(s, substr string) bool {
// 	for i := 0; i <= len(s)-len(substr); i++ {
// 		if s[i:i+len(substr)] == substr {
// 			return true
// 		}
// 	}
// 	return false
// }