'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const URGENCY_OPTIONS = ['Low', 'Medium', 'High'];

export default function CreateTaskPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skill, setSkill] = useState('');
  const [urgency, setUrgency] = useState('');
  const [creditReward, setCreditReward] = useState('');
  const { profile } = useAuth();
  const { execute, loading } = useApi();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !skill || !creditReward) {
      toast.error('Please fill in all required fields');
      return;
    }

    const reward = parseInt(creditReward);
    if (isNaN(reward) || reward <= 0) {
      toast.error('Credit reward must be a positive number');
      return;
    }

    if (profile && reward > profile.credits) {
      toast.error('Insufficient credits');
      return;
    }

    const result = await execute((token) =>
      apiClient.createTask(token, {
        title: title.trim(),
        description: description.trim(),
        skill,
        urgency: urgency || undefined,
        credit_reward: reward,
      })
    );

    if (result) {
      toast.success('Task created successfully!');
      router.push(`/dashboard/tasks/${result.id}`);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-h3 font-heading font-semibold mb-6">Post a new task</h1>

      <Card>
        <CardHeader>
          <CardTitle>Task details</CardTitle>
          <CardDescription>
            Create a task and offer credits to get help from the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Fix bug in authentication flow"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the task in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={loading}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill">Required skill *</Label>
              <Select value={skill} onValueChange={setSkill} disabled={loading}>
                <SelectTrigger id="skill">
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency (optional)</Label>
              <Select value={urgency} onValueChange={setUrgency} disabled={loading}>
                <SelectTrigger id="urgency">
                  <SelectValue placeholder="Select urgency level" />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">Credit reward *</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                placeholder="50"
                value={creditReward}
                onChange={(e) => setCreditReward(e.target.value)}
                required
                disabled={loading}
              />
              {profile && (
                <p className="text-small text-neutral-500">
                  Your balance: {profile.credits} credits
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="primary" disabled={loading}>
                {loading ? 'Creating task...' : 'Create task'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
