'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { TaskCard } from '@/components/blocks/task-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import type { Task } from '@/types/tasks';

export default function TasksPage() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [skillFilter, setSkillFilter] = useState<string>('all');
	const { loading: authLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		// Only fetch tasks when auth is ready
		if (!authLoading) {
			fetchTasks();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [authLoading]);

	useEffect(() => {
		filterTasks();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tasks, searchQuery, skillFilter]);

	const fetchTasks = async () => {
		try {
			const result = await apiClient.listTasks();
			console.log('[Tasks] Fetch result:', result);

			// Handle both direct array and {data: array} response formats
			let tasksData: Task[] = [];
			if (result) {
				if (Array.isArray(result)) {
					tasksData = result;
				} else if (result.data && Array.isArray(result.data)) {
					tasksData = result.data;
				}
			}

			console.log('[Tasks] Setting tasks, count:', tasksData.length);
			setTasks(tasksData);
		} catch (error) {
			console.error('Error fetching tasks:', error);
			setTasks([]);
		} finally {
			setLoading(false);
		}
	};

	const filterTasks = () => {
		// Ensure tasks is an array
		if (!Array.isArray(tasks)) {
			setFilteredTasks([]);
			return;
		}

		let filtered = tasks;

		if (searchQuery) {
			filtered = filtered.filter(
				(task) =>
					task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					task.description.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		if (skillFilter !== 'all') {
			filtered = filtered.filter((task) => task.skill === skillFilter);
		}

		setFilteredTasks(filtered);
	};

	const uniqueSkills = Array.isArray(tasks)
		? Array.from(new Set(tasks.map((task) => task.skill)))
		: [];

	// Show loading while auth is initializing or while fetching tasks
	if (authLoading || loading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-full" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[...Array(6)].map((_, i) => (
						<Skeleton key={i} className="h-64" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex-between">
				<h1 className="text-h3 font-heading font-semibold">Available Tasks</h1>
				<Button onClick={() => router.push('/dashboard/tasks/create')} className="primary">
					Post a task
				</Button>
			</div>

			<div className="flex flex-col sm:flex-row gap-4">
				<Input
					placeholder="Search tasks..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="flex-1"
				/>
				<Select value={skillFilter} onValueChange={setSkillFilter}>
					<SelectTrigger className="w-full sm:w-48">
						<SelectValue placeholder="Filter by skill" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All skills</SelectItem>
						{uniqueSkills.map((skill) => (
							<SelectItem key={skill} value={skill}>
								{skill}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{filteredTasks.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-large text-neutral-500">
						{tasks.length === 0 ? 'No tasks available yet.' : 'No tasks match your filters.'}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredTasks.map((task) => (
						<TaskCard key={task.id} task={task} />
					))}
				</div>
			)}
		</div>
	);
}
