export interface LeaderboardEntry {
	id: string;
	name: string;
	avatar_url?: string;
	credits: number;
	rank: number;
}

export interface Reward {
	id: string;
	name: string;
	description: string;
	credit_cost: number;
	stock: number;
	created_at: string;
	updated_at: string;
}

export interface Transaction {
	id: string;
	user_id: string;
	amount: number;
	transaction_type: string;
	description?: string;
	created_at: string;
}

export interface ApiError {
	error: string;
}

export type Blog = {
	slug: string;
	title: string;
	excerpt: string;
	content: string;
};
