package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"

	appmid "github.com/egeuysall/summit/internal/middleware"
	"github.com/egeuysall/summit/internal/models"
	generated "github.com/egeuysall/summit/internal/supabase/generated"
	"github.com/egeuysall/summit/internal/utils"
)

// ListTasks retrieves all open tasks.
func ListTasks(w http.ResponseWriter, r *http.Request) {
	tasks, err := utils.Queries.ListOpenTasks(r.Context())
	if err != nil {
		utils.SendError(w, "Failed to fetch tasks", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToTaskResponses(tasks), http.StatusOK)
}

// CreateTask creates a new task for the authenticated user.
func CreateTask(w http.ResponseWriter, r *http.Request) {
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
		Title        string  `json:"title"`
		Description  string  `json:"description"`
		Skill        string  `json:"skill"`
		Urgency      *string `json:"urgency,omitempty"`
		CreditReward int32   `json:"credit_reward"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Title == "" || req.Description == "" || req.Skill == "" {
		utils.SendError(w, "Title, description, and skill are required", http.StatusBadRequest)
		return
	}

	if req.CreditReward <= 0 {
		utils.SendError(w, "Credit reward must be positive", http.StatusBadRequest)
		return
	}

	// Check if user has enough credits
	profile, err := utils.Queries.GetProfile(r.Context(), uuid)
	if err != nil {
		utils.SendError(w, "Failed to fetch profile", http.StatusInternalServerError)
		return
	}

	if !profile.Credits.Valid || profile.Credits.Int32 < req.CreditReward {
		utils.SendError(w, "Insufficient credits", http.StatusBadRequest)
		return
	}

	var urgency pgtype.Text
	if req.Urgency != nil {
		urgency.String = *req.Urgency
		urgency.Valid = true
	}

	params := generated.CreateTaskParams{
		Title:        req.Title,
		Description:  req.Description,
		Skill:        req.Skill,
		Urgency:      urgency,
		CreditReward: req.CreditReward,
		RequesterID:  uuid,
	}

	task, err := utils.Queries.CreateTask(r.Context(), params)
	if err != nil {
		utils.SendError(w, "Failed to create task", http.StatusInternalServerError)
		return
	}

	// Deduct credits from requester
	_, err = utils.Queries.DecrementCredits(r.Context(), generated.DecrementCreditsParams{
		ID:      uuid,
		Credits: pgtype.Int4{Int32: req.CreditReward, Valid: true},
	})
	if err != nil {
		utils.SendError(w, "Failed to deduct credits", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToTaskResponse(task), http.StatusCreated)
}

// GetTask retrieves a specific task by ID.
func GetTask(w http.ResponseWriter, r *http.Request) {
	taskIDStr := chi.URLParam(r, "taskID")
	if taskIDStr == "" {
		utils.SendError(w, "Task ID is required", http.StatusBadRequest)
		return
	}

	taskID, err := utils.ParseUUID(taskIDStr)
	if err != nil {
		utils.SendError(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	task, err := utils.Queries.GetTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Task not found", http.StatusNotFound)
		return
	}

	utils.SendJson(w, models.ToTaskResponse(task), http.StatusOK)
}

// DeleteTask deletes a task (only if it's open and belongs to the requester).
func DeleteTask(w http.ResponseWriter, r *http.Request) {
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

	taskIDStr := chi.URLParam(r, "taskID")
	if taskIDStr == "" {
		utils.SendError(w, "Task ID is required", http.StatusBadRequest)
		return
	}

	taskID, err := utils.ParseUUID(taskIDStr)
	if err != nil {
		utils.SendError(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	// Verify the task belongs to the requester
	task, err := utils.Queries.GetTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Task not found", http.StatusNotFound)
		return
	}

	if utils.UUIDToString(task.RequesterID) != userID {
		utils.SendError(w, "You can only delete your own tasks", http.StatusForbidden)
		return
	}

	if task.Status.Valid && task.Status.String != "open" {
		utils.SendError(w, "Can only delete open tasks", http.StatusBadRequest)
		return
	}

	err = utils.Queries.DeleteTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Failed to delete task", http.StatusInternalServerError)
		return
	}

	// Refund credits to requester
	err = utils.Queries.IncrementCredits(r.Context(), generated.IncrementCreditsParams{
		ID:      uuid,
		Credits: pgtype.Int4{Int32: task.CreditReward, Valid: true},
	})
	if err != nil {
		utils.SendError(w, "Task deleted but failed to refund credits", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, map[string]string{"message": "Task deleted successfully"}, http.StatusOK)
}

// ClaimTask allows a user to claim an open task.
func ClaimTask(w http.ResponseWriter, r *http.Request) {
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

	taskIDStr := chi.URLParam(r, "taskID")
	if taskIDStr == "" {
		utils.SendError(w, "Task ID is required", http.StatusBadRequest)
		return
	}

	taskID, err := utils.ParseUUID(taskIDStr)
	if err != nil {
		utils.SendError(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	// Verify the task exists and is open
	task, err := utils.Queries.GetTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Task not found", http.StatusNotFound)
		return
	}

	if task.Status.Valid && task.Status.String != "open" {
		utils.SendError(w, "Task is not available for claiming", http.StatusBadRequest)
		return
	}

	if utils.UUIDToString(task.RequesterID) == userID {
		utils.SendError(w, "You cannot claim your own task", http.StatusBadRequest)
		return
	}

	err = utils.Queries.ClaimTask(r.Context(), generated.ClaimTaskParams{
		ID:          taskID,
		ClaimedByID: uuid,
	})
	if err != nil {
		utils.SendError(w, "Failed to claim task", http.StatusInternalServerError)
		return
	}

	// Fetch and return the updated task
	updatedTask, err := utils.Queries.GetTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Task claimed but failed to fetch", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToTaskResponse(updatedTask), http.StatusOK)
}

// CompleteTask marks a task as completed by the claimer.
func CompleteTask(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmid.UserIDFromContext(r.Context())
	if !ok {
		utils.SendError(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	taskIDStr := chi.URLParam(r, "taskID")
	if taskIDStr == "" {
		utils.SendError(w, "Task ID is required", http.StatusBadRequest)
		return
	}

	taskID, err := utils.ParseUUID(taskIDStr)
	if err != nil {
		utils.SendError(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	// Verify the task is claimed by this user
	task, err := utils.Queries.GetTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Task not found", http.StatusNotFound)
		return
	}

	if !task.ClaimedByID.Valid || utils.UUIDToString(task.ClaimedByID) != userID {
		utils.SendError(w, "You can only complete tasks you have claimed", http.StatusForbidden)
		return
	}

	if task.Status.Valid && task.Status.String != "claimed" {
		utils.SendError(w, "Task must be claimed to mark as completed", http.StatusBadRequest)
		return
	}

	err = utils.Queries.CompleteTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Failed to complete task", http.StatusInternalServerError)
		return
	}

	// Fetch and return the updated task
	updatedTask, err := utils.Queries.GetTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Task completed but failed to fetch", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToTaskResponse(updatedTask), http.StatusOK)
}

// ConfirmTask confirms a completed task by the requester and transfers credits.
func ConfirmTask(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmid.UserIDFromContext(r.Context())
	if !ok {
		utils.SendError(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	taskIDStr := chi.URLParam(r, "taskID")
	if taskIDStr == "" {
		utils.SendError(w, "Task ID is required", http.StatusBadRequest)
		return
	}

	taskID, err := utils.ParseUUID(taskIDStr)
	if err != nil {
		utils.SendError(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	// Verify the task belongs to the requester
	task, err := utils.Queries.GetTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Task not found", http.StatusNotFound)
		return
	}

	if utils.UUIDToString(task.RequesterID) != userID {
		utils.SendError(w, "Only the requester can confirm the task", http.StatusForbidden)
		return
	}

	if task.Status.Valid && task.Status.String != "completed" {
		utils.SendError(w, "Task must be completed to confirm", http.StatusBadRequest)
		return
	}

	if !task.ClaimedByID.Valid {
		utils.SendError(w, "Task has no claimer", http.StatusBadRequest)
		return
	}

	err = utils.Queries.ConfirmTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Failed to confirm task", http.StatusInternalServerError)
		return
	}

	// Transfer credits to the claimer
	err = utils.Queries.IncrementCredits(r.Context(), generated.IncrementCreditsParams{
		ID:      task.ClaimedByID,
		Credits: pgtype.Int4{Int32: task.CreditReward, Valid: true},
	})
	if err != nil {
		utils.SendError(w, "Task confirmed but failed to transfer credits", http.StatusInternalServerError)
		return
	}

	// Fetch and return the updated task
	updatedTask, err := utils.Queries.GetTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Task confirmed but failed to fetch", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToTaskResponse(updatedTask), http.StatusOK)
}

// CancelTask cancels a task and refunds credits to the requester.
func CancelTask(w http.ResponseWriter, r *http.Request) {
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

	taskIDStr := chi.URLParam(r, "taskID")
	if taskIDStr == "" {
		utils.SendError(w, "Task ID is required", http.StatusBadRequest)
		return
	}

	taskID, err := utils.ParseUUID(taskIDStr)
	if err != nil {
		utils.SendError(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	// Verify the task belongs to the requester
	task, err := utils.Queries.GetTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Task not found", http.StatusNotFound)
		return
	}

	if utils.UUIDToString(task.RequesterID) != userID {
		utils.SendError(w, "Only the requester can cancel the task", http.StatusForbidden)
		return
	}

	err = utils.Queries.CancelTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Failed to cancel task", http.StatusInternalServerError)
		return
	}

	// Refund credits to requester
	err = utils.Queries.IncrementCredits(r.Context(), generated.IncrementCreditsParams{
		ID:      uuid,
		Credits: pgtype.Int4{Int32: task.CreditReward, Valid: true},
	})
	if err != nil {
		utils.SendError(w, "Task cancelled but failed to refund credits", http.StatusInternalServerError)
		return
	}

	// Fetch and return the updated task
	updatedTask, err := utils.Queries.GetTask(r.Context(), taskID)
	if err != nil {
		utils.SendError(w, "Task cancelled but failed to fetch", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToTaskResponse(updatedTask), http.StatusOK)
}

// GetMyPostedTasks retrieves tasks posted by the authenticated user.
func GetMyPostedTasks(w http.ResponseWriter, r *http.Request) {
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

	tasks, err := utils.Queries.ListTasksByRequester(r.Context(), uuid)
	if err != nil {
		utils.SendError(w, "Failed to fetch posted tasks", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToTaskResponses(tasks), http.StatusOK)
}

// GetMyClaimedTasks retrieves tasks claimed by the authenticated user.
func GetMyClaimedTasks(w http.ResponseWriter, r *http.Request) {
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

	tasks, err := utils.Queries.ListTasksByClaimer(r.Context(), uuid)
	if err != nil {
		utils.SendError(w, "Failed to fetch claimed tasks", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToTaskResponses(tasks), http.StatusOK)
}
