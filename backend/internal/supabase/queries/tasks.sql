-- name: CreateTask :one
INSERT INTO tasks (title, description, skill, urgency, credit_reward, requester_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetTask :one
SELECT * FROM tasks
WHERE id = $1;

-- name: ListAllTasks :many
SELECT * FROM tasks
ORDER BY created_at DESC
LIMIT $1;

-- name: ListOpenTasks :many
SELECT * FROM tasks
WHERE status = 'open'
ORDER BY created_at DESC;

-- name: ListTasksBySkill :many
SELECT * FROM tasks
WHERE skill = $1 AND status = 'open'
ORDER BY credit_reward DESC;

-- name: ListTasksByRequester :many
SELECT * FROM tasks
WHERE requester_id = $1
ORDER BY created_at DESC;

-- name: ListTasksByClaimer :many
SELECT * FROM tasks
WHERE claimed_by_id = $1
ORDER BY created_at DESC;

-- name: ClaimTask :exec
UPDATE tasks
SET claimed_by_id = $2, status = 'claimed'
WHERE id = $1 AND status = 'open';

-- name: CompleteTask :exec
UPDATE tasks
SET status = 'completed'
WHERE id = $1 AND status = 'claimed';

-- name: ConfirmTask :exec
UPDATE tasks
SET status = 'confirmed'
WHERE id = $1 AND status = 'completed';

-- name: CancelTask :exec
UPDATE tasks
SET status = 'cancelled', claimed_by_id = NULL
WHERE id = $1;

-- name: DeleteTask :exec
DELETE FROM tasks
WHERE id = $1 AND status = 'open';
