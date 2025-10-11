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
	UpdatedAt string   `json:"updated_at"`
}

// LeaderboardEntryResponse represents a leaderboard entry with snake_case JSON tags
type LeaderboardEntryResponse struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	AvatarURL *string `json:"avatar_url,omitempty"`
	Credits   int32   `json:"credits"`
	Rank      int     `json:"rank"`
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
	Status       string  `json:"status"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

// TransactionResponse represents a transaction with snake_case JSON tags
type TransactionResponse struct {
	ID              string  `json:"id"`
	UserID          string  `json:"user_id"`
	Amount          int32   `json:"amount"`
	TransactionType string  `json:"transaction_type"`
	Description     *string `json:"description,omitempty"`
	CreatedAt       string  `json:"created_at"`
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
		UpdatedAt: formatTimestamp(p.CreatedAt), // Use created_at as updated_at since we don't track updates yet
	}
}

// ToLeaderboardEntryResponse converts a GetLeaderboardRow to LeaderboardEntryResponse with rank
func ToLeaderboardEntryResponse(row generated.GetLeaderboardRow, rank int) LeaderboardEntryResponse {
	var avatarURL *string
	if row.AvatarUrl.Valid {
		avatarURL = &row.AvatarUrl.String
	}

	return LeaderboardEntryResponse{
		ID:        utils.UUIDToString(row.ID),
		Name:      row.Name,
		AvatarURL: avatarURL,
		Credits:   row.Credits.Int32,
		Rank:      rank,
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

	// Status should always have a value, default to "open" if not set
	status := "open"
	if t.Status.Valid && t.Status.String != "" {
		status = t.Status.String
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
		UpdatedAt:    formatTimestamp(t.CreatedAt), // Use created_at as updated_at since we don't track updates yet
	}
}

// ToTransactionResponse converts a generated Transaction to TransactionResponse
func ToTransactionResponse(t generated.Transaction) TransactionResponse {
	// Determine transaction type based on amount
	transactionType := "task_reward"
	if t.Credits < 0 {
		transactionType = "task_posted"
	}

	// Generate description
	var description *string
	if t.TaskID.Valid {
		taskIDStr := utils.UUIDToString(t.TaskID)
		var desc string
		if t.Credits > 0 {
			desc = "Credits earned from completing task"
		} else {
			desc = "Credits spent on posting task"
		}
		description = &desc
		_ = taskIDStr // Task ID available if needed for future enhancements
	}

	return TransactionResponse{
		ID:              utils.UUIDToString(t.ID),
		UserID:          utils.UUIDToString(t.UserID),
		Amount:          t.Credits,
		TransactionType: transactionType,
		Description:     description,
		CreatedAt:       formatTimestamp(t.CreatedAt),
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
		responses[i] = ToLeaderboardEntryResponse(row, i+1)
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
