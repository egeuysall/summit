package models

import (
	"time"

	generated "github.com/egeuysall/summit/internal/supabase/generated"
	"github.com/egeuysall/summit/internal/utils"
	"github.com/jackc/pgx/v5/pgtype"
)

// ProfileResponse represents a profile with snake_case JSON tags
type ProfileResponse struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	AvatarURL *string  `json:"avatar_url,omitempty"`
	Skills    []string `json:"skills"`
	Credits   int32    `json:"credits"`
	CreatedAt string   `json:"created_at"`
}

// LeaderboardEntryResponse represents a leaderboard entry with snake_case JSON tags
type LeaderboardEntryResponse struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatar_url,omitempty"`
	Credits   int32   `json:"credits"`
}

// TaskResponse represents a task with snake_case JSON tags
type TaskResponse struct {
	ID           string  `json:"id"`
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	Skill        string  `json:"skill"`
	Urgency      *string `json:"urgency,omitempty"`
	CreditReward int32   `json:"credit_reward"`
	RequesterID  string  `json:"requester_id"`
	ClaimedByID  *string `json:"claimed_by_id,omitempty"`
	Status       *string `json:"status,omitempty"`
	CreatedAt    string  `json:"created_at"`
}

// TransactionResponse represents a transaction with snake_case JSON tags
type TransactionResponse struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	TaskID    string `json:"task_id"`
	Credits   int32  `json:"credits"`
	CreatedAt string `json:"created_at"`
}

// RewardResponse represents a reward with snake_case JSON tags
type RewardResponse struct {
	ID          int32   `json:"id"`
	Name        string  `json:"name"`
	Planet      string  `json:"planet"`
	Cost        int32   `json:"cost"`
	Description *string `json:"description,omitempty"`
}

// ToProfileResponse converts a generated Profile to ProfileResponse
func ToProfileResponse(p generated.Profile) ProfileResponse {
	var avatarURL *string
	if p.AvatarUrl.Valid {
		avatarURL = &p.AvatarUrl.String
	}

	return ProfileResponse{
		ID:        utils.UUIDToString(p.ID),
		Name:      p.Name,
		AvatarURL: avatarURL,
		Skills:    p.Skills,
		Credits:   p.Credits.Int32,
		CreatedAt: formatTimestamp(p.CreatedAt),
	}
}

// ToLeaderboardEntryResponse converts a GetLeaderboardRow to LeaderboardEntryResponse
func ToLeaderboardEntryResponse(row generated.GetLeaderboardRow) LeaderboardEntryResponse {
	var avatarURL *string
	if row.AvatarUrl.Valid {
		avatarURL = &row.AvatarUrl.String
	}

	return LeaderboardEntryResponse{
		ID:        utils.UUIDToString(row.ID),
		Name:      row.Name,
		AvatarURL: avatarURL,
		Credits:   row.Credits.Int32,
	}
}

// ToTaskResponse converts a generated Task to TaskResponse
func ToTaskResponse(t generated.Task) TaskResponse {
	var urgency *string
	if t.Urgency.Valid {
		urgency = &t.Urgency.String
	}

	var claimedByID *string
	if t.ClaimedByID.Valid {
		id := utils.UUIDToString(t.ClaimedByID)
		claimedByID = &id
	}

	var status *string
	if t.Status.Valid {
		status = &t.Status.String
	}

	return TaskResponse{
		ID:           utils.UUIDToString(t.ID),
		Title:        t.Title,
		Description:  t.Description,
		Skill:        t.Skill,
		Urgency:      urgency,
		CreditReward: t.CreditReward,
		RequesterID:  utils.UUIDToString(t.RequesterID),
		ClaimedByID:  claimedByID,
		Status:       status,
		CreatedAt:    formatTimestamp(t.CreatedAt),
	}
}

// ToTransactionResponse converts a generated Transaction to TransactionResponse
func ToTransactionResponse(t generated.Transaction) TransactionResponse {
	return TransactionResponse{
		ID:        utils.UUIDToString(t.ID),
		UserID:    utils.UUIDToString(t.UserID),
		TaskID:    utils.UUIDToString(t.TaskID),
		Credits:   t.Credits,
		CreatedAt: formatTimestamp(t.CreatedAt),
	}
}

// ToRewardResponse converts a generated Reward to RewardResponse
func ToRewardResponse(r generated.Reward) RewardResponse {
	var description *string
	if r.Description.Valid {
		description = &r.Description.String
	}

	return RewardResponse{
		ID:          r.ID,
		Name:        r.Name,
		Planet:      r.Planet,
		Cost:        r.Cost,
		Description: description,
	}
}

// Helper function to format timestamps
func formatTimestamp(ts pgtype.Timestamptz) string {
	if !ts.Valid {
		return ""
	}
	return ts.Time.Format(time.RFC3339)
}

// Batch conversion helpers
func ToProfileResponses(profiles []generated.Profile) []ProfileResponse {
	responses := make([]ProfileResponse, len(profiles))
	for i, p := range profiles {
		responses[i] = ToProfileResponse(p)
	}
	return responses
}

func ToLeaderboardResponses(rows []generated.GetLeaderboardRow) []LeaderboardEntryResponse {
	responses := make([]LeaderboardEntryResponse, len(rows))
	for i, row := range rows {
		responses[i] = ToLeaderboardEntryResponse(row)
	}
	return responses
}

func ToTaskResponses(tasks []generated.Task) []TaskResponse {
	responses := make([]TaskResponse, len(tasks))
	for i, t := range tasks {
		responses[i] = ToTaskResponse(t)
	}
	return responses
}

func ToTransactionResponses(transactions []generated.Transaction) []TransactionResponse {
	responses := make([]TransactionResponse, len(transactions))
	for i, t := range transactions {
		responses[i] = ToTransactionResponse(t)
	}
	return responses
}

func ToRewardResponses(rewards []generated.Reward) []RewardResponse {
	responses := make([]RewardResponse, len(rewards))
	for i, r := range rewards {
		responses[i] = ToRewardResponse(r)
	}
	return responses
}
