'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Task } from '@/types/tasks';

interface TaskDetailPageProps {
	params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
	const { id } = use(params);
	const [task, setTask] = useState<Task | null>(null);
	const [loading, setLoading] = useState(true);
	const { user } = useAuth();
	const { execute, loading: actionLoading } = useApi();
	const router = useRouter();

	useEffect(() => {
		fetchTask();
	}, [id]);

	const fetchTask = async () => {
		try {
			const data = await apiClient.getTask(id);
			setTask(data);
		} catch (error) {
			toast.error('Failed to load task');
			router.push('/dashboard/tasks');
		} finally {
			setLoading(false);
		}
	};

	const handleClaimTask = async () => {
		const result = await execute((token) => apiClient.claimTask(token, id));
		if (result) {
			setTask(result);
			toast.success('Task claimed successfully!');
		}
	};

	const handleCompleteTask = async () => {
		const result = await execute((token) => apiClient.completeTask(token, id));
		if (result) {
			setTask(result);
			toast.success('Task marked as completed!');
		}
	};

	const handleConfirmTask = async () => {
		const result = await execute((token) => apiClient.confirmTask(token, id));
		if (result) {
			setTask(result);
			toast.success('Task confirmed! Credits transferred.');
		}
	};

	const handleCancelTask = async () => {
		const result = await execute((token) => apiClient.cancelTask(token, id));
		if (result) {
			setTask(result);
			toast.success('Task cancelled.');
		}
	};

	const handleDeleteTask = async () => {
		const result = await execute((token) => apiClient.deleteTask(token, id));
		if (result !== null) {
			toast.success('Task deleted successfully!');
			router.push('/dashboard/tasks');
		}
	};

	if (loading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!task) {
		return null;
	}

	const isRequester = user && task.requester_id === user.id;
	const isClaimer = user && task.claimed_by_id === user.id;
	const canClaim = task.status === 'open' && !isRequester;
	const canComplete = task.status === 'claimed' && isClaimer;
	const canConfirm = task.status === 'completed' && isRequester;
	const canCancel = (task.status === 'claimed' || task.status === 'completed') && isRequester;
	const canDelete = task.status === 'open' && isRequester;

	return (
		<div className="max-w-4xl">
			<Button variant="ghost" onClick={() => router.back()} className="mb-4">
				← Back
			</Button>

			<Card>
				<CardHeader>
					<div className="flex-between mb-4">
						<Badge className={task.status === 'open' ? 'bg-success-500' : ''}>{task.status}</Badge>
						<span className="text-h5 font-semibold text-primary-700">
							{task.credit_reward} credits
						</span>
					</div>
					<CardTitle className="text-h3">{task.title}</CardTitle>
					<CardDescription className="text-base">{task.description}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<h3 className="text-base font-semibold mb-2">Details</h3>
						<div className="space-y-2">
							<div className="flex gap-2">
								<span className="text-neutral-500">Skill:</span>
								<Badge variant="outline">{task.skill}</Badge>
							</div>
							{task.urgency && (
								<div className="flex gap-2">
									<span className="text-neutral-500">Urgency:</span>
									<Badge>{task.urgency}</Badge>
								</div>
							)}
							<div>
								<span className="text-neutral-500">Posted:</span>{' '}
								{new Date(task.created_at).toLocaleDateString()}
							</div>
						</div>
					</div>

					<div className="flex flex-wrap gap-4">
						{canClaim && (
							<Button onClick={handleClaimTask} className="primary" disabled={actionLoading}>
								Claim task
							</Button>
						)}

						{canComplete && (
							<Button onClick={handleCompleteTask} className="primary" disabled={actionLoading}>
								Mark as completed
							</Button>
						)}

						{canConfirm && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button className="primary" disabled={actionLoading}>
										Confirm completion
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Confirm task completion?</AlertDialogTitle>
										<AlertDialogDescription>
											This will transfer {task.credit_reward} credits to the person who completed
											the task. This action cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={handleConfirmTask}>Confirm</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}

						{canCancel && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="outline" disabled={actionLoading}>
										Cancel task
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Cancel this task?</AlertDialogTitle>
										<AlertDialogDescription>
											This will cancel the task and refund {task.credit_reward} credits to you.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Keep task</AlertDialogCancel>
										<AlertDialogAction onClick={handleCancelTask}>Cancel task</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}

						{canDelete && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="outline" disabled={actionLoading}>
										Delete task
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete this task?</AlertDialogTitle>
										<AlertDialogDescription>
											This will permanently delete the task and refund {task.credit_reward} credits
											to you. This action cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Keep task</AlertDialogCancel>
										<AlertDialogAction onClick={handleDeleteTask}>Delete task</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
