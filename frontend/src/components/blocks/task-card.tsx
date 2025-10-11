import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types/tasks';

interface TaskCardProps {
	task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
	const getStatusColor = (status: Task['status']) => {
		switch (status) {
			case 'open':
				return 'bg-success-500 text-neutral-100';
			case 'claimed':
				return 'bg-info-500 text-neutral-100';
			case 'completed':
				return 'bg-warning-500 text-neutral-100';
			case 'confirmed':
				return 'bg-primary-500 text-neutral-100';
			case 'cancelled':
				return 'bg-error-500 text-neutral-100';
			default:
				return '';
		}
	};

	const getUrgencyColor = (urgency?: string) => {
		if (!urgency) return '';
		switch (urgency.toLowerCase()) {
			case 'high':
				return 'bg-error-100 text-error-900';
			case 'medium':
				return 'bg-warning-100 text-warning-900';
			case 'low':
				return 'bg-info-100 text-info-900';
			default:
				return '';
		}
	};

	return (
		<Link href={`/dashboard/tasks/${task.id}`}>
			<Card className="hover:shadow-md transition-shadow cursor-pointer">
				<CardHeader>
					<div className="flex-between mb-2">
						<Badge className={getStatusColor(task.status)}>{task.status}</Badge>
						<span className="text-base font-semibold text-primary-700">
							{task.credit_reward} credits
						</span>
					</div>
					<CardTitle>{task.title}</CardTitle>
					<CardDescription className="line-clamp-2">{task.description}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline">{task.skill}</Badge>
						{task.urgency && (
							<Badge className={getUrgencyColor(task.urgency)}>{task.urgency}</Badge>
						)}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
