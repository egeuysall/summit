-- name: ListRewards :many
SELECT * FROM rewards
ORDER BY cost ASC;

-- name: GetReward :one
SELECT * FROM rewards
WHERE id = $1;

-- name: GetRewardsByPlanet :many
SELECT * FROM rewards
WHERE planet = $1
ORDER BY cost ASC;
