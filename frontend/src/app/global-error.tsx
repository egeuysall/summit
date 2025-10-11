'use client';

import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html>
			<body>
				<div className="flex flex-col gap-md items-center justify-center h-screen w-full">
					<h2>Something went wrong!</h2>
					<Button onClick={() => reset()}>Try again</Button>
				</div>
			</body>
		</html>
	);
}
