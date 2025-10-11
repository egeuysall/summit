import type {
  Profile,
  CreateProfileRequest,
  UpdateProfileRequest,
} from '../../types/profiles';
import type {
  Task,
  CreateTaskRequest,
} from '../../types/tasks';
import type {
  LeaderboardEntry,
  Reward,
  Transaction,
  ApiError,
} from '../../types/other';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'An error occurred',
      }));
      throw new Error(error.error);
    }

    return response.json();
  }

  private getAuthHeaders(token?: string): HeadersInit {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // Public endpoints
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.request<LeaderboardEntry[]>('/v1/leaderboard');
  }

  async listRewards(): Promise<Reward[]> {
    return this.request<Reward[]>('/v1/rewards');
  }

  async listTasks(): Promise<Task[]> {
    return this.request<Task[]>('/v1/tasks');
  }

  async getTask(taskId: string): Promise<Task> {
    return this.request<Task>(`/v1/tasks/${taskId}`);
  }

  // Protected endpoints
  async getProfile(token: string): Promise<Profile> {
    return this.request<Profile>('/v1/profile', {
      headers: this.getAuthHeaders(token),
    });
  }

  async createProfile(
    token: string,
    data: CreateProfileRequest
  ): Promise<Profile> {
    return this.request<Profile>('/v1/profile', {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(data),
    });
  }

  async updateProfile(
    token: string,
    data: UpdateProfileRequest
  ): Promise<Profile> {
    return this.request<Profile>('/v1/profile', {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(data),
    });
  }

  async createTask(token: string, data: CreateTaskRequest): Promise<Task> {
    return this.request<Task>('/v1/tasks', {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(data),
    });
  }

  async getMyPostedTasks(token: string): Promise<Task[]> {
    return this.request<Task[]>('/v1/tasks/my-posted', {
      headers: this.getAuthHeaders(token),
    });
  }

  async getMyClaimedTasks(token: string): Promise<Task[]> {
    return this.request<Task[]>('/v1/tasks/my-claimed', {
      headers: this.getAuthHeaders(token),
    });
  }

  async deleteTask(token: string, taskId: string): Promise<void> {
    return this.request<void>(`/v1/tasks/${taskId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
  }

  async claimTask(token: string, taskId: string): Promise<Task> {
    return this.request<Task>(`/v1/tasks/${taskId}/claim`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
    });
  }

  async completeTask(token: string, taskId: string): Promise<Task> {
    return this.request<Task>(`/v1/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
    });
  }

  async confirmTask(token: string, taskId: string): Promise<Task> {
    return this.request<Task>(`/v1/tasks/${taskId}/confirm`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
    });
  }

  async cancelTask(token: string, taskId: string): Promise<Task> {
    return this.request<Task>(`/v1/tasks/${taskId}/cancel`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
    });
  }

  async getTransactions(
    token: string,
    limit: number = 50
  ): Promise<Transaction[]> {
    return this.request<Transaction[]>(
      `/v1/transactions?limit=${limit}`,
      {
        headers: this.getAuthHeaders(token),
      }
    );
  }
}

export const apiClient = new ApiClient(API_URL);
