package handlers

import (
	"net/http"
	"strconv"

	appmid "github.com/egeuysall/summit/internal/middleware"
	"github.com/egeuysall/summit/internal/models"
	generated "github.com/egeuysall/summit/internal/supabase/generated"
	"github.com/egeuysall/summit/internal/utils"
)

// GetMyTransactions retrieves transactions for the authenticated user.
// Accepts optional query parameter "limit" (default: 50, max: 100)
func GetMyTransactions(w http.ResponseWriter, r *http.Request) {
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

	// Parse limit from query params (default 50, max 100)
	limit := int32(50)
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.ParseInt(limitStr, 10, 32); err == nil {
			if parsedLimit > 0 && parsedLimit <= 100 {
				limit = int32(parsedLimit)
			}
		}
	}

	transactions, err := utils.Queries.GetUserTransactions(r.Context(), generated.GetUserTransactionsParams{
		UserID: uuid,
		Limit:  limit,
	})
	if err != nil {
		utils.SendError(w, "Failed to fetch transactions", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToTransactionResponses(transactions), http.StatusOK)
}
