package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/egeuysall/summit/internal/utils"
	"github.com/go-chi/cors"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const userIDKey = contextKey("userID")

func RequireAuth() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			supabaseJWTSecret := strings.TrimSpace(os.Getenv("SUPABASE_JWT_SECRET"))
			supabaseIssuer := os.Getenv("SUPABASE_ISSUER")

			supabaseAudience := "authenticated"
			customAud := os.Getenv("SUPABASE_AUDIENCE")

			if customAud != "" {
				supabaseAudience = customAud
			}

			if supabaseJWTSecret == "" {
				log.Println("WARNING: SUPABASE_JWT_SECRET is not set")
				utils.SendError(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				utils.SendError(w, "Unauthorized: missing Authorization header", http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				utils.SendError(w, "Unauthorized: invalid Authorization header format", http.StatusUnauthorized)
				return
			}
			tokenStr := parts[1]

			token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(supabaseJWTSecret), nil
			})

			if err != nil {
				log.Printf("JWT validation error: %v", err)
				utils.SendError(w, "Unauthorized: invalid token", http.StatusUnauthorized)
				return
			}

			if !token.Valid {
				utils.SendError(w, "Unauthorized: invalid token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				utils.SendError(w, "Unauthorized: invalid token claims", http.StatusUnauthorized)
				return
			}

			if iss, ok := claims["iss"].(string); !ok || (supabaseIssuer != "" && iss != supabaseIssuer) {
				log.Printf("Invalid issuer: %v, expected: %v", iss, supabaseIssuer)
				utils.SendError(w, "Unauthorized: invalid issuer", http.StatusUnauthorized)
				return
			}

			if aud, ok := claims["aud"].(string); !ok || (supabaseAudience != "" && aud != supabaseAudience) {
				log.Printf("Invalid audience: %v, expected: %v", aud, supabaseAudience)
				utils.SendError(w, "Unauthorized: invalid audience", http.StatusUnauthorized)
				return
			}

			if exp, ok := claims["exp"].(float64); !ok || int64(exp) < time.Now().Unix() {
				utils.SendError(w, "Unauthorized: token expired", http.StatusUnauthorized)
				return
			}

			sub, ok := claims["sub"].(string)
			if !ok || sub == "" {
				utils.SendError(w, "Unauthorized: missing subject", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, sub)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// UserIDFromContext extracts the user ID from the request context.
func UserIDFromContext(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(userIDKey).(string)
	return userID, ok
}

// Cors returns a middleware that sets CORS headers.
func Cors() func(next http.Handler) http.Handler {
	return cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           3600,
	})
}

// SetContentType sets Content-Type header to application/json for all responses.
func SetContentType() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			next.ServeHTTP(w, r)
		})
	}
}
