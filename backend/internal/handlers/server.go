package handlers

import (
	"net/http"

	"github.com/egeuysall/summit/internal/utils"
)

func HandleRoot(w http.ResponseWriter, r *http.Request) {
	utils.SendJson(w, map[string]string{
		"name":    "Summit API",
		"version": "1.0.0",
		"docs":    "https://github.com/egeuysall/summit",
	}, http.StatusOK)
}

func HandlePing(w http.ResponseWriter, r *http.Request) {
	utils.SendJson(w, map[string]string{"status": "ok"}, http.StatusOK)
}
