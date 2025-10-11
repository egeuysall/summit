-- name: CreateProfile :one
INSERT INTO profiles (id, name, avatar_url, skills, credits)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetProfile :one
SELECT * FROM profiles
WHERE id = $1;

-- name: UpdateProfile :exec
UPDATE profiles
SET name = $2, avatar_url = $3, skills = $4
WHERE id = $1;

-- name: UpdateCredits :exec
UPDATE profiles
SET credits = $2
WHERE id = $1;

-- name: IncrementCredits :exec
UPDATE profiles
SET credits = credits + $2
WHERE id = $1;

-- name: DecrementCredits :one
UPDATE profiles
SET credits = credits - $2
WHERE id = $1 AND credits >= $2
RETURNING *;

-- name: GetLeaderboard :many
SELECT id, name, avatar_url, credits
FROM profiles
ORDER BY credits DESC
LIMIT $1;
