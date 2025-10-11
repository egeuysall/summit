'use client';

import { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '@/hooks/use-authenticated-api';
import { apiClient } from '@/lib/api/client';
import { TaskCard } from '@/components/blocks/task-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@/types/tasks';

export default function MyPostedTasksPage() {
	console.log('[MyPosted] Component rendering');
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const { executeWhenReady, isReady, loading: authLoading } = useAuthenticatedApi();

	console.log('[MyPosted] State:', { isReady, authLoading, loading, tasksCount: tasks.length });

	useEffect(() => {
		console.log('[MyPosted] useEffect triggered, isReady:', isReady);
		// Only fetch tasks when auth is ready
		if (isReady) {
			fetchTasks();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isReady]);

	const fetchTasks = async () => {
		console.log('[MyPosted] Fetching tasks...');
		const result = await executeWhenReady((token) => apiClient.getMyPostedTasks(token));
		console.log('[MyPosted] Fetch result:', result);

		// Handle both direct array and {data: array} response formats
		let tasksData: Task[] = [];
		if (result) {
			if (Array.isArray(result)) {
				tasksData = result;
			} else if (result.data && Array.isArray(result.data)) {
				tasksData = result.data;
			}
		}

		console.log('[MyPosted] Setting tasks, count:', tasksData.length);
		setTasks(tasksData);
		setLoading(false);
	};

	// Show loading while auth is initializing or while fetching tasks
	if (authLoading || loading) {
		console.log('[MyPosted] Rendering loading skeleton');
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

	console.log('[MyPosted] Rendering content, tasks count:', tasks.length);
	return (
		<div className="space-y-6">
			<h1 className="text-h3 font-heading font-semibold">My posted tasks</h1>

			{tasks.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-large text-neutral-500">You haven't posted any tasks yet.</p>
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
