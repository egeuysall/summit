'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
	useEffect(() => {
		console.error('[Dashboard Error]', error);
	}, [error]);

	return (
		<div className="min-h-screen flex flex-col">
			{/* Simple header */}
			<header className="border-b border-neutral-300 dark:border-neutral-700">
				<div className="w-[90vw] md:w-[92.5vw] lg:w-[95vw] mx-auto">
					<div className="flex-between h-16">
						<span className="text-h5 font-heading font-semibold">Summit</span>
					</div>
				</div>
			</header>

			{/* Error content */}
			<main className="flex-1 w-[90vw] md:w-[92.5vw] lg:w-[95vw] mx-auto py-8">
				<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
					<div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20">
						<AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
					</div>

					<div className="space-y-2">
						<h1 className="text-h3 font-heading font-semibold text-neutral-900 dark:text-neutral-100">
							Something went wrong
						</h1>
						<p className="text-large text-neutral-600 dark:text-neutral-400 max-w-md">
							We encountered an error while loading the dashboard. Please try again.
						</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						<Button onClick={reset} className="primary">
							Try again
						</Button>
						<Button
							variant="outline"
							onClick={() => window.location.href = '/dashboard/tasks'}
						>
							Go to Tasks
						</Button>
					</div>

					{process.env.NODE_ENV === 'development' && (
						<details className="mt-8 text-left">
							<summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
								Error details (development only)
							</summary>
							<pre className="mt-2 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md text-xs text-neutral-800 dark:text-neutral-200 overflow-auto max-w-md">
								{error.message}
								{error.digest && `\nDigest: ${error.digest}`}
							</pre>
						</details>
					)}
				</div>
			</main>
		</div>
	);
}
