package db

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect() *pgxpool.Pool {
	connStr := os.Getenv("SUPABASE_URL")

	if connStr == "" {
		log.Fatal("SUPABASE_URL not set in environment")
	}

	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		log.Fatal("Failed to parse database URL: ", err)
	}

	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnIdleTime = 30 * time.Minute

	// Set runtime parameters to bypass RLS for service role
	// This allows the backend to perform operations as the service role
	if config.ConnConfig.RuntimeParams == nil {
		config.ConnConfig.RuntimeParams = make(map[string]string)
	}
	// Set the role to postgres (superuser) to bypass RLS
	config.ConnConfig.RuntimeParams["role"] = "postgres"

	ctx := context.Background()
	pool, err := pgxpool.NewWithConfig(ctx, config)

	if err != nil {
		log.Fatal("Failed to create db pool")
	}

	err = pool.Ping(ctx)

	if err != nil {
		log.Fatalf("Unable to ping db: %s", err)
	}

	log.Println("Successfully connected Supabase database with service role")
	return pool
}
