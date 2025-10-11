package handlers

import (
	"net/http"

	"github.com/egeuysall/summit/internal/models"
	"github.com/egeuysall/summit/internal/utils"
)

// ListRewards retrieves all available rewards.
func ListRewards(w http.ResponseWriter, r *http.Request) {
	rewards, err := utils.Queries.ListRewards(r.Context())
	if err != nil {
		utils.SendError(w, "Failed to fetch rewards", http.StatusInternalServerError)
		return
	}

	utils.SendJson(w, models.ToRewardResponses(rewards), http.StatusOK)
}
