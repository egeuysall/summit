-- name: CreateTransaction :one
INSERT INTO transactions (user_id, task_id, credits)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUserTransactions :many
SELECT * FROM transactions
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2;

-- name: GetTaskTransactions :many
SELECT * FROM transactions
WHERE task_id = $1
ORDER BY created_at DESC;

-- name: GetAllTransactions :many
SELECT
  t.*,
  p.name as user_name
FROM transactions t
JOIN profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC
LIMIT $1;
