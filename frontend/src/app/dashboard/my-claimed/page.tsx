'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api/client';
import { TaskCard } from '@/components/blocks/task-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import type { Task } from '@/types/tasks';

export default function MyClaimedTasksPage() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const { executeWhenReady, authLoading } = useApi();
	const { loading: authContextLoading } = useAuth();

	const fetchTasks = async () => {
		const result = await executeWhenReady((token) => apiClient.getMyClaimedTasks(token));
		let tasksData: Task[] = [];
		if (result) {
			if (Array.isArray(result)) {
				tasksData = result;
			} else if (result.data && Array.isArray(result.data)) {
				tasksData = result.data;
			}
		}

		setTasks(tasksData);
		setLoading(false);
	};

	useEffect(() => {
		// Only fetch tasks when auth is ready
		if (!authContextLoading && !authLoading) {
			fetchTasks();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [authContextLoading, authLoading]);

	// Show loading while auth is initializing or while fetching tasks
	if (authContextLoading || authLoading || loading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-64" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[...Array(3)].map((_, i) => (
						<Skeleton key={i} className="h-64" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h1 className="text-h3 font-heading font-semibold">My claimed tasks</h1>

			{tasks.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-large text-neutral-500">You haven't claimed any tasks yet.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{tasks.map((task) => (
						<TaskCard key={task.id} task={task} />
					))}
				</div>
			)}
		</div>
	);
}
