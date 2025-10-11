'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SKILL_OPTIONS = [
	'JavaScript',
	'TypeScript',
	'React',
	'Next.js',
	'Node.js',
	'Python',
	'Go',
	'Rust',
	'Design',
	'Writing',
	'Marketing',
	'Video Editing',
];

export default function ProfileSetupPage() {
	const [name, setName] = useState('');
	const [avatarUrl, setAvatarUrl] = useState('');
	const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
	const { execute, loading } = useApi();
	const { refreshProfile } = useAuth();
	const router = useRouter();

	const toggleSkill = (skill: string) => {
		setSelectedSkills((prev) =>
			prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error('Please enter your name');
			return;
		}

		if (selectedSkills.length === 0) {
			toast.error('Please select at least one skill');
			return;
		}

		const result = await execute((token) => {
			return apiClient.createProfile(token, {
				name: name.trim(),
				avatar_url: avatarUrl.trim() || undefined,
				skills: selectedSkills,
			});
		});

		if (result) {
			toast.success('Profile created successfully!');

			window.location.href = '/dashboard/tasks';
		} else {
			console.error('[ProfileSetup] Execute returned null/undefined');
			toast.error('Failed to create profile. Please try again.');
		}
	};

	return (
		<div>
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Set up your profile</CardTitle>
					<CardDescription>Tell us about yourself to get started with Summit</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="name">Name *</Label>
							<Input
								id="name"
								placeholder="Your full name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								disabled={loading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="avatar">Avatar URL (optional)</Label>
							<Input
								id="avatar"
								type="url"
								placeholder="https://example.com/avatar.jpg"
								value={avatarUrl}
								onChange={(e) => setAvatarUrl(e.target.value)}
								disabled={loading}
							/>
						</div>

						<div className="space-y-2">
							<Label>Skills *</Label>
							<p className="text-small text-neutral-500">
								Select the skills you can offer or want to work on
							</p>
							<div className="flex flex-wrap gap-2 mt-2">
								{SKILL_OPTIONS.map((skill) => (
									<Badge
										key={skill}
										variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
										className="cursor-pointer"
										onClick={() => !loading && toggleSkill(skill)}
									>
										{skill}
									</Badge>
								))}
							</div>
						</div>

						<Button type="submit" className="w-full primary" disabled={loading}>
							{loading ? 'Creating profile...' : 'Create profile'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
