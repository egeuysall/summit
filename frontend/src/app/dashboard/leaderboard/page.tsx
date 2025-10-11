'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LeaderboardEntry } from '@/types/other';

export default function LeaderboardPage() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

	useEffect(() => {
		fetchLeaderboard();
	}, []);

	const fetchLeaderboard = async () => {
		try {
			const result = await apiClient.getLeaderboard();
			let leaderboardData: LeaderboardEntry[] = [];

			if (result) {
				if (Array.isArray(result)) {
					leaderboardData = result;
				} else if (
					typeof result === 'object' &&
					'data' in result &&
					Array.isArray((result as { data: unknown }).data)
				) {
					leaderboardData = (result as { data: LeaderboardEntry[] }).data;
				}
			}

			setLeaderboard(leaderboardData);
		} catch (error) {
			console.error('Error fetching leaderboard:', error);
			setLeaderboard([]);
		}
	};

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	const getRankBadge = (rank: number) => {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return `#${rank}`;
	};

	return (
		<div className="space-y-6">
			<h1 className="text-h3 font-heading font-semibold">Leaderboard</h1>

			{leaderboard.length === 0 ? (
				<div className="text-center flex-center">
					<p className=" text-neutral-500">No leaderboard data available yet.</p>
				</div>
			) : (
				<div className="space-y-4">
					{leaderboard.map((entry) => (
						<Card key={entry.id}>
							<CardContent>
								<div className="flex items-center justify-center gap-md">
									<h4 className="text-center">{getRankBadge(entry.rank)}</h4>

									<Avatar className="h-12 w-12">
										{entry.avatar_url && <AvatarImage src={entry.avatar_url} />}
										<AvatarFallback>{getInitials(entry.name)}</AvatarFallback>
									</Avatar>

									<div className="flex-1">
										<h6>{entry.name}</h6>
										<p className="text-small text-neutral-500">{entry.credits} credits earned</p>
									</div>

									{entry.rank <= 3 && <Badge>Top contributor</Badge>}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
