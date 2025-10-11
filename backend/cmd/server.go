package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/egeuysall/summit/internal/api"
	supabase "github.com/egeuysall/summit/internal/supabase"
	generated "github.com/egeuysall/summit/internal/supabase/generated"
	"github.com/egeuysall/summit/internal/utils"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	dbConn := supabase.Connect()
	defer dbConn.Close()

	utils.Init(generated.New(dbConn))

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("PORT not set in environment")
	}

	log.Printf("🚀 Summit API starting on http://localhost:%s", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), api.Router()); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
