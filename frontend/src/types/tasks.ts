export interface Task {
	id: string;
	title: string;
	description: string;
	skill: string;
	urgency?: string;
	credit_reward: number;
	status: 'open' | 'claimed' | 'completed' | 'confirmed' | 'cancelled';
	requester_id: string;
	claimed_by_id?: string;
	created_at: string;
	updated_at: string;
}

export interface CreateTaskRequest {
	title: string;
	description: string;
	skill: string;
	urgency?: string;
	credit_reward: number;
}
