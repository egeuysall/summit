package utils

import (
	"encoding/json"
	"net/http"

	generated "github.com/egeuysall/summit/internal/supabase/generated"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

var Queries *generated.Queries

func Init(q *generated.Queries) {
	Queries = q
}

func SendJson(w http.ResponseWriter, data interface{}, statusCode int) {
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]interface{}{"data": data})
}

func SendError(w http.ResponseWriter, message string, statusCode int) {
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func ParseUUID(str string) (pgtype.UUID, error) {
	var id pgtype.UUID
	err := id.Scan(str)
	return id, err
}

func UUIDToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return uuid.UUID(u.Bytes).String()
}
