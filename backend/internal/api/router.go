package router

import (
	"time"

	"github.com/egeuysall/summit/internal/handlers"
	appmid "github.com/egeuysall/summit/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
)

// Router sets up the HTTP routes and middleware for the backend API.
//
// Returns a *chi.Mux router with all routes and middleware configured.
func Router() *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(
		middleware.Recoverer,
		middleware.RealIP,
		middleware.Timeout(30*time.Second), // Increased for database ops
		middleware.NoCache,
		middleware.Compress(5),
		httprate.LimitByIP(100, time.Minute), // Relaxed for hackathon
		appmid.SetContentType(),
		appmid.Cors(),
	)

	// Public routes
	r.Get("/", handlers.HandleRoot)
	r.Get("/ping", handlers.HandlePing)

	// Protected API v1 routes
	r.Route("/v1", func(r chi.Router) {
		r.Use(appmid.RequireAuth())

		// Profile routes
		r.Get("/profile", handlers.GetProfile)
		r.Post("/profile", handlers.CreateProfile)
		r.Put("/profile", handlers.UpdateProfile)
		r.Get("/leaderboard", handlers.GetLeaderboard)

		// Task routes
		r.Route("/tasks", func(r chi.Router) {
			r.Get("/", handlers.ListTasks)
			r.Post("/", handlers.CreateTask)
			r.Get("/my-posted", handlers.GetMyPostedTasks)
			r.Get("/my-claimed", handlers.GetMyClaimedTasks)
			
			r.Route("/{taskID}", func(r chi.Router) {
				r.Get("/", handlers.GetTask)
				r.Delete("/", handlers.DeleteTask)
				r.Post("/claim", handlers.ClaimTask)
				r.Post("/complete", handlers.CompleteTask)
				r.Post("/confirm", handlers.ConfirmTask)
				r.Post("/cancel", handlers.CancelTask)
			})
		})

		// Transaction routes
		r.Get("/transactions", handlers.GetMyTransactions)

		// Reward routes
		r.Get("/rewards", handlers.ListRewards)
	})

	return r
}