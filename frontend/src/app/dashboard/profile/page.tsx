'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { execute, loading } = useApi();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAvatarUrl(profile.avatar_url || '');
      setSelectedSkills(profile.skills);
    }
  }, [profile]);

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

    const result = await execute((token) =>
      apiClient.updateProfile(token, {
        name: name.trim(),
        avatar_url: avatarUrl.trim() || undefined,
        skills: selectedSkills,
      })
    );

    if (result) {
      await refreshProfile();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setName(profile.name);
      setAvatarUrl(profile.avatar_url || '');
      setSelectedSkills(profile.skills);
    }
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-h3 font-heading font-semibold mb-6">Profile</h1>

      <Card>
        <CardHeader>
          <div className="flex-between">
            <div>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Manage your profile details</CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
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

              <div className="flex gap-4">
                <Button type="submit" className="primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className="text-h5">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-h5 font-semibold">{profile.name}</h3>
                  <p className="text-base text-neutral-500">{profile.credits} credits</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Member since</Label>
                <p className="text-base">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
