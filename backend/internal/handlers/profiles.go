package handlers

import (
	"encoding/json"
	"net/http"

	appmid "github.com/egeuysall/summit/internal/middleware"
	"github.com/egeuysall/summit/internal/models"
	"github.com/egeuysall/summit/internal/utils"
	"github.com/jackc/pgx/v5/pgtype"

	generated "github.com/egeuysall/summit/internal/supabase/generated"
)

// GetProfile retrieves the profile of the authenticated user.
func GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmid.UserIDFromContext(r.Context())
	if !ok {
		utils.SendError(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	uuid, err := utils.ParseUUID(userID)
	if err != nil {
		utils.SendError(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	profile, err := utils.Queries.GetProfile(r.Context(), uuid)
	if err != nil {
		utils.SendError(w, "Profile not found", http.StatusNotFound)
		return
	}

	utils.SendJson(w, models.ToProfileResponse(profile), http.StatusOK)
}

func CreateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmid.UserIDFromContext(r.Context())
	if !ok {
		utils.SendError(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	uuid, err := utils.ParseUUID(userID)
	if err != nil {
		utils.SendError(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	existingProfile, err := utils.Queries.GetProfile(r.Context(), uuid)
	if err == nil {
		utils.SendJson(w, models.ToProfileResponse(existingProfile), http.StatusOK)
		return
	}

	var req struct {
		Name      string   `json:"name"`
		AvatarUrl *string  `json:"avatar_url,omitempty"`
		Skills    []string `json:"skills"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		utils.SendError(w, "Name is required", http.StatusBadRequest)
		return
	}

	var avatarUrl pgtype.Text
	if req.AvatarUrl != nil {
		avatarUrl.String = *req.AvatarUrl
		avatarUrl.Valid = true
	}

	params := generated.CreateProfileParams{
		ID:        uuid,
		Name:      req.Name,
		AvatarUrl: avatarUrl,
		Skills:    req.Skills,
		Credits:   pgtype.Int4{Int32: 100, Valid: true},
	}

	profile, err := utils.Queries.CreateProfile(r.Context(), params)
	if err != nil {
		utils.SendError(w, "Failed to create profile", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToProfileResponse(profile), http.StatusCreated)
}

func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmid.UserIDFromContext(r.Context())
	if !ok {
		utils.SendError(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	uuid, err := utils.ParseUUID(userID)
	if err != nil {
		utils.SendError(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Name      string   `json:"name"`
		AvatarUrl *string  `json:"avatar_url,omitempty"`
		Skills    []string `json:"skills"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		utils.SendError(w, "Name is required", http.StatusBadRequest)
		return
	}

	var avatarUrl pgtype.Text
	if req.AvatarUrl != nil {
		avatarUrl.String = *req.AvatarUrl
		avatarUrl.Valid = true
	}

	params := generated.UpdateProfileParams{
		ID:        uuid,
		Name:      req.Name,
		AvatarUrl: avatarUrl,
		Skills:    req.Skills,
	}

	err = utils.Queries.UpdateProfile(r.Context(), params)
	if err != nil {
		utils.SendError(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	profile, err := utils.Queries.GetProfile(r.Context(), uuid)
	if err != nil {
		utils.SendError(w, "Profile updated but failed to fetch", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToProfileResponse(profile), http.StatusOK)
}

func GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	limit := int32(100)

	leaderboard, err := utils.Queries.GetLeaderboard(r.Context(), limit)
	if err != nil {
		utils.SendError(w, "Failed to fetch leaderboard", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToLeaderboardResponses(leaderboard), http.StatusOK)
}
