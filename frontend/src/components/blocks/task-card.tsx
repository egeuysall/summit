import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types/tasks';

interface TaskCardProps {
	task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
	return (
		<Link href={`/dashboard/tasks/${task.id}`} className="no-underline">
			<Card>
				<CardHeader>
					<div className="flex-between mb-2">
						<Badge>{task.status}</Badge>
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
						{task.urgency && <Badge>{task.urgency}</Badge>}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
