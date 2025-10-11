'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/use-api';
import { apiClient } from '@/lib/api/client';
import { TaskCard } from '@/components/blocks/task-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@/types/tasks';

export default function MyPostedTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { execute } = useApi();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const result = await execute((token) => apiClient.getMyPostedTasks(token));
    if (result) {
      setTasks(result);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-h3 font-heading font-semibold">My posted tasks</h1>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-large text-neutral-500">
            You haven't posted any tasks yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
