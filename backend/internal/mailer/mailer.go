package mailer

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/mail"
	"net/smtp"
	"os"
	"strconv"
)

// Mailer handles SMTP email sending
type Mailer struct {
	host     string
	port     int
	username string
	password string
	from     string
}

// NewMailer creates a new mailer from environment variables
func NewMailer() *Mailer {
	port, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))

	return &Mailer{
		host:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		port:     port,
		username: getEnv("SMTP_USER", ""),
		password: getEnv("SMTP_PASS", ""),
		from:     getEnv("SMTP_FROM", getEnv("SMTP_USER", "")),
	}
}

// SendEmail sends an email using SMTP with TLS
func (m *Mailer) SendEmail(from, to, subject, body string) error {
	// Validate email addresses
	fromAddr, err := mail.ParseAddress(from)
	if err != nil {
		return fmt.Errorf("invalid from address: %w", err)
	}

	toAddr, err := mail.ParseAddress(to)
	if err != nil {
		return fmt.Errorf("invalid to address: %w", err)
	}

	// Build email headers and body
	headers := make(map[string]string)
	headers["From"] = fromAddr.String()
	headers["To"] = toAddr.String()
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"utf-8\""

	// Construct message
	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	// Connect to SMTP server
	addr := net.JoinHostPort(m.host, strconv.Itoa(m.port))

	// Establish TLS connection
	tlsConfig := &tls.Config{
		ServerName: m.host,
	}

	// Connect to server
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	defer conn.Close()

	// Create SMTP client
	client, err := smtp.NewClient(conn, m.host)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Close()

	// Send EHLO/HELO
	if err = client.Hello("localhost"); err != nil {
		return fmt.Errorf("EHLO failed: %w", err)
	}

	// Check if TLS is supported
	if ok, _ := client.Extension("STARTTLS"); ok {
		if err = client.StartTLS(tlsConfig); err != nil {
			return fmt.Errorf("STARTTLS failed: %w", err)
		}
	}

	// Authenticate
	if m.username != "" && m.password != "" {
		auth := smtp.PlainAuth("", m.username, m.password, m.host)
		if err = client.Auth(auth); err != nil {
			return fmt.Errorf("authentication failed: %w", err)
		}
	}

	// Set sender
	if err = client.Mail(fromAddr.Address); err != nil {
		return fmt.Errorf("MAIL FROM failed: %w", err)
	}

	// Set recipient
	if err = client.Rcpt(toAddr.Address); err != nil {
		return fmt.Errorf("RCPT TO failed: %w", err)
	}

	// Send email body
	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("DATA command failed: %w", err)
	}

	_, err = writer.Write([]byte(message))
	if err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	err = writer.Close()
	if err != nil {
		return fmt.Errorf("failed to close writer: %w", err)
	}

	// Send QUIT
	return client.Quit()
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}