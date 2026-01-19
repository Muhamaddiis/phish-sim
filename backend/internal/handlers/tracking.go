package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"

	"github.com/Muhamaddiis/phish-sim/internal/models"
)

type TrackingHandler struct {
	db *gorm.DB
}

func NewTrackingHandler(db *gorm.DB) *TrackingHandler {
	return &TrackingHandler{db: db}
}

// TrackOpen logs email open event and returns 1x1 transparent GIF
func (h *TrackingHandler) TrackOpen(w http.ResponseWriter, r *http.Request) {
    fmt.Println("🔥 TrackOpen hit:", r.RemoteAddr)
	token := chi.URLParam(r, "token")

	// Find target by token
	var target models.Target
	if err := h.db.Where("token = ?", token).First(&target).Error; err != nil {
		// Return GIF anyway to avoid revealing tracking
		serveTrackingPixel(w)
		return
	}

	// Log open event
	event := models.Event{
		TargetID:  target.ID,
		EventType: "open",
		Meta: map[string]interface{}{
			"ip":         r.RemoteAddr,
			"user_agent": r.UserAgent(),
			"referer":    r.Referer(),
		},
	}

	h.db.Create(&event)

	// Return 1x1 transparent GIF
	serveTrackingPixel(w)
}

// TrackClick logs click event and redirects to landing page
func (h *TrackingHandler) TrackClick(w http.ResponseWriter, r *http.Request) {
    fmt.Println("🔥 TrackClick hit:", r.RemoteAddr)
	token := chi.URLParam(r, "token")

	// Find target by token
	var target models.Target
	if err := h.db.Where("token = ?", token).First(&target).Error; err != nil {
		http.Error(w, "Invalid link", http.StatusNotFound)
		return
	}

	// Log click event
	event := models.Event{
		TargetID:  target.ID,
		EventType: "click",
		Meta: map[string]interface{}{
			"ip":         r.RemoteAddr,
			"user_agent": r.UserAgent(),
			"referer":    r.Referer(),
		},
	}

	h.db.Create(&event)

	// Redirect to landing page
	http.Redirect(w, r, fmt.Sprintf("/landing/%s", token), http.StatusFound)
}

// ServeLandingPage serves the fake login page
func (h *TrackingHandler) ServeLandingPage(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")

	// Verify token exists
	var target models.Target
	if err := h.db.Where("token = ?", token).First(&target).Error; err != nil {
		http.Error(w, "Invalid link", http.StatusNotFound)
		return
	}

	// Serve landing page HTML
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	
	tmpl := template.Must(template.New("landing").Parse(landingPageHTML))
	tmpl.Execute(w, map[string]interface{}{
		"Token": token,
		"Name":  target.Name,
	})
}

// TrackSubmit logs form submission event
func (h *TrackingHandler) TrackSubmit(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token    string `json:"token"`
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	// Find target by token
	var target models.Target
	if err := h.db.Where("token = ?", req.Token).First(&target).Error; err != nil {
		respondError(w, http.StatusNotFound, "Invalid token")
		return
	}

	// Log submit event (do NOT store actual passwords in production)
	event := models.Event{
		TargetID:  target.ID,
		EventType: "submit",
		Meta: map[string]interface{}{
			"ip":         r.RemoteAddr,
			"user_agent": r.UserAgent(),
			"username":   req.Username,
			// Do NOT log actual password - this is just to track that submission happened
			"password_length": len(req.Password),
		},
	}

	h.db.Create(&event)

	// Return educational message
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "This was a security awareness test",
		"details": "You have submitted credentials to a simulated phishing page. In a real attack, your credentials would now be compromised. Please be cautious of suspicious emails and always verify the URL before entering sensitive information.",
	})
}

// serveTrackingPixel returns a 1x1 transparent GIF
func serveTrackingPixel(w http.ResponseWriter) {
	// Base64 encoded 1x1 transparent GIF
	gif, _ := base64.StdEncoding.DecodeString("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
	
	w.Header().Set("Content-Type", "image/gif")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.Write(gif)
}

// Landing page HTML template
const landingPageHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Verification Required</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
            padding: 40px;
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo-icon {
            width: 60px;
            height: 60px;
            background: #667eea;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 30px;
            font-weight: bold;
        }
        h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
            text-align: center;
        }
        .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }
        button:hover {
            background: #5568d3;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .message {
            margin-top: 20px;
            padding: 15px;
            border-radius: 6px;
            display: none;
        }
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .learn-more {
            margin-top: 15px;
            padding: 15px;
            background: #fff3cd;
            border: 1px solid #ffeeba;
            border-radius: 6px;
            font-size: 13px;
            line-height: 1.6;
            display: none;
        }
        .learn-more h3 {
            color: #856404;
            font-size: 15px;
            margin-bottom: 10px;
        }
        .learn-more ul {
            margin-left: 20px;
            color: #856404;
        }
        .learn-more li {
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <div class="logo-icon">🔒</div>
        </div>
        <h1>Account Verification</h1>
        <p class="subtitle">Please verify your identity to continue</p>
        
        <form id="loginForm">
            <input type="hidden" id="token" value="{{.Token}}">
            
            <div class="form-group">
                <label for="username">Username or Email</label>
                <input type="text" id="username" name="username" required autocomplete="username">
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>
            
            <button type="submit" id="submitBtn">Verify Account</button>
        </form>
        
        <div id="message" class="message"></div>
        <div id="learnMore" class="learn-more"></div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const messageEl = document.getElementById('message');
            const learnMoreEl = document.getElementById('learnMore');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying...';
            
            const formData = {
                token: document.getElementById('token').value,
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            };
            
            try {
                const response = await fetch('/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                messageEl.className = 'message success';
                messageEl.style.display = 'block';
                messageEl.innerHTML = '<strong>⚠️ Security Awareness Training</strong><br>' + data.message;
                
                learnMoreEl.style.display = 'block';
                learnMoreEl.innerHTML = '<h3>🎓 What You Should Know:</h3>' +
                    '<ul>' +
                    '<li>Always check the sender\'s email address carefully</li>' +
                    '<li>Hover over links to see the real URL before clicking</li>' +
                    '<li>Look for HTTPS and verify the domain name</li>' +
                    '<li>Be suspicious of urgent or threatening language</li>' +
                    '<li>When in doubt, contact IT Security directly</li>' +
                    '</ul>' +
                    '<p style="margin-top:10px"><strong>Your data was not compromised.</strong> This was a safe training exercise.</p>';
                
                document.getElementById('loginForm').style.display = 'none';
            } catch (error) {
                messageEl.className = 'message error';
                messageEl.style.display = 'block';
                messageEl.textContent = 'An error occurred. Please try again.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verify Account';
            }
        });
    </script>
</body>
</html>
`