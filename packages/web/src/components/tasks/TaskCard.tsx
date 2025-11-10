'use client';

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Plus, MoreVertical, Trash2, Edit } from 'lucide-react';
import type { Task } from '@calenote/shared';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { fadeInUp, hoverScale } from '@/lib/animations/variants';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onAddEntry?: (taskId: string) => void;
  onClick?: (task: Task) => void;
}

export const TaskCard = memo(function TaskCard({ task, onEdit, onDelete, onAddEntry, onClick }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    active: 'bg-blue-500',
    completed: 'bg-green-500',
    archived: 'bg-gray-500',
    cancelled: 'bg-red-500',
  };

  const statusLabels = {
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
    cancelled: 'Cancelled',
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      className="origin-center"
    >
      <Card
        className="hover:shadow-md transition-shadow"
        style={{
          backgroundColor: task.color ? `${task.color}08` : undefined,
          borderLeft: task.color ? `4px solid ${task.color}` : undefined,
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AnimatedButton
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
                animationIntensity="subtle"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </AnimatedButton>

            {task.icon && <span className="text-xl">{task.icon}</span>}

            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold text-lg truncate cursor-pointer hover:text-primary"
                onClick={() => onClick?.(task)}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn('capitalize', statusColors[task.status])}
            >
              {statusLabels[task.status]}
            </Badge>

            <DropdownMenu>
              {/* @ts-ignore - DropdownMenuTrigger type issue with asChild */}
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* @ts-ignore - DropdownMenuItem type issue */}
                <DropdownMenuItem onClick={() => onEdit?.(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                {/* @ts-ignore - DropdownMenuItem type issue */}
                <DropdownMenuItem onClick={() => onAddEntry?.(task.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </DropdownMenuItem>
                {/* @ts-ignore - DropdownMenuItem type issue */}
                <DropdownMenuItem
                  onClick={() => onDelete?.(task.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {task.completed_entries}/{task.total_entries} entries
            </span>
          </div>
          <Progress value={task.completion_percentage} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">
            {task.completion_percentage}% complete
          </div>
        </div>

        {/* Due Date */}
        {task.due_date && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Due:</span>
            <span className={cn(
              'font-medium',
              new Date(task.due_date) < new Date() && task.status !== 'completed'
                ? 'text-destructive'
                : ''
            )}>
              {format(new Date(task.due_date), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {/* Entries List (when expanded) */}
        {isExpanded && task.entries && task.entries.length > 0 && (
          <div className="mt-4 space-y-2 border-t pt-3">
            <h4 className="text-sm font-medium text-muted-foreground">Entries:</h4>
            <div className="space-y-1">
              {task.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 text-sm p-2 rounded hover:bg-accent"
                >
                  {entry.is_completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={cn(
                    'flex-1 truncate',
                    entry.is_completed && 'line-through text-muted-foreground'
                  )}>
                    {entry.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Entry Button (when expanded) */}
        {isExpanded && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onAddEntry?.(task.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry to Task
          </Button>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
});
