export interface Profile {
	id: string;
	name: string;
	avatar_url?: string;
	skills: string[];
	credits: number;
	created_at: string;
	updated_at: string;
}

export interface CreateProfileRequest {
	name: string;
	avatar_url?: string;
	skills: string[];
}

export interface UpdateProfileRequest {
	name: string;
	avatar_url?: string;
	skills: string[];
}
