package api

import (
	"time"

	"github.com/egeuysall/summit/internal/handlers"
	appmid "github.com/egeuysall/summit/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
)

func Router() *chi.Mux {
	r := chi.NewRouter()

	r.Use(
		middleware.Recoverer,
		middleware.RealIP,
		middleware.Timeout(30*time.Second),
		middleware.NoCache,
		middleware.Compress(5),
		httprate.LimitByIP(100, time.Minute),
		appmid.SetContentType(),
		appmid.Cors(),
	)

	r.Get("/", handlers.HandleRoot)
	r.Get("/ping", handlers.HandlePing)

	r.Route("/v1", func(r chi.Router) {
		// Public routes
		r.Get("/leaderboard", handlers.GetLeaderboard)
		r.Get("/rewards", handlers.ListRewards)
		r.Get("/tasks", handlers.ListTasks)
		r.Get("/tasks/{taskID}", handlers.GetTask)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(appmid.RequireAuth())

			r.Get("/profile", handlers.GetProfile)
			r.Post("/profile", handlers.CreateProfile)
			r.Put("/profile", handlers.UpdateProfile)

			r.Post("/tasks", handlers.CreateTask)
			r.Get("/tasks/my-posted", handlers.GetMyPostedTasks)
			r.Get("/tasks/my-claimed", handlers.GetMyClaimedTasks)
			r.Delete("/tasks/{taskID}", handlers.DeleteTask)
			r.Post("/tasks/{taskID}/claim", handlers.ClaimTask)
			r.Post("/tasks/{taskID}/complete", handlers.CompleteTask)
			r.Post("/tasks/{taskID}/confirm", handlers.ConfirmTask)
			r.Post("/tasks/{taskID}/cancel", handlers.CancelTask)

			r.Get("/transactions", handlers.GetMyTransactions)
		})
	})

	return r
}
