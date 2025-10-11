import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
	return (
		<div className="min-h-screen flex flex-col">
			{/* Header skeleton */}
			<header className="border-b border-neutral-300 dark:border-neutral-700">
				<div className="w-[90vw] md:w-[92.5vw] lg:w-[95vw] mx-auto">
					<div className="flex-between h-16">
						<Skeleton className="h-6 w-16" />
						<div className="hidden md:flex items-center gap-6">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-4 w-20" />
							))}
						</div>
						<div className="flex items-center gap-4">
							<div className="text-right hidden sm:block space-y-1">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-16" />
							</div>
							<Skeleton className="h-10 w-10 rounded-full" />
						</div>
					</div>
				</div>
			</header>

			{/* Main content skeleton */}
			<main className="flex-1 w-[90vw] md:w-[92.5vw] lg:w-[95vw] mx-auto py-8">
				<div className="space-y-6">
					<div className="flex-between">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-10 w-32" />
					</div>
					<div className="flex flex-col sm:flex-row gap-4">
						<Skeleton className="h-10 flex-1" />
						<Skeleton className="h-10 w-full sm:w-48" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={i} className="h-64" />
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
