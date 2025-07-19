import React, { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableTask } from './DraggableTask';
import { Task } from '../../types/lab';
import { Plus } from 'lucide-react';

interface Question {
  id: string;
  type: 'flag' | 'text' | 'file-upload' | 'multiple-choice';
  title: string;
  description: string;
  flag?: string;
  points: number;
  images?: string[];
  attachments?: string[];
  multipleChoiceOptions?: {
    option: string;
    isCorrect: boolean;
  }[];
  hints?: string[];
}

interface DragDropLabEditorProps {
  labId: string;
  tasks: (Task & { questions?: Question[] })[];
  onTasksUpdate: (tasks: (Task & { questions?: Question[] })[]) => void;
  onAddTask: () => void;
  onImageUpload?: (taskId: string, questionId: string, files: FileList | null) => void;
  onAttachmentUpload?: (taskId: string, questionId: string, files: FileList | null) => void;
}

export function DragDropLabEditor({ 
  labId, 
  tasks, 
  onTasksUpdate, 
  onAddTask,
  onImageUpload,
  onAttachmentUpload
}: DragDropLabEditorProps) {
  console.log('🔍 DragDropLabEditor render - tasks received:', tasks.map(t => ({ id: t.id, title: t.title, order_index: t.order_index })));
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    console.log('🎯 DRAG END - Starting immediate synchronous reorder');

    // Only handle task reordering - questions are handled by DraggableTask
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Sort tasks for consistent order calculation
    const currentTasks = [...tasks].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    // Check if we're dragging tasks (not questions)
    const isTaskDrag = currentTasks.some(task => task.id === activeId) && 
                      currentTasks.some(task => task.id === overId);
    
    if (isTaskDrag) {
      const oldIndex = currentTasks.findIndex((task) => task.id === activeId);
      const newIndex = currentTasks.findIndex((task) => task.id === overId);

      if (oldIndex !== newIndex) {
        // Reorder tasks IMMEDIATELY - no async operations
        const reorderedTasks = arrayMove(currentTasks, oldIndex, newIndex);
        
        // Update order_index for each task based on new position
        const updatedTasks = reorderedTasks.map((task, index) => ({
          ...task,
          order_index: index + 1
        }));

        console.log('🎯 IMMEDIATE REORDER:', updatedTasks.map(t => `${t.title} (order: ${t.order_index})`));
        
        // Update parent component's state IMMEDIATELY
        onTasksUpdate(updatedTasks);
        console.log('🎯 DRAG END COMPLETE - state updated immediately');
      }
    }
    // If it's not a task drag, ignore it - let DraggableTask handle questions
  }, [tasks, onTasksUpdate]);

  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task & { questions?: Question[] }>) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    onTasksUpdate(updatedTasks);
  }, [tasks, onTasksUpdate]);

  const handleTaskDelete = useCallback((taskId: string) => {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      const filteredTasks = tasks.filter(task => task.id !== taskId);
      // Reorder the remaining tasks
      const reorderedTasks = filteredTasks.map((task, index) => ({
        ...task,
        order_index: index + 1
      }));
      onTasksUpdate(reorderedTasks);
    }
  }, [tasks, onTasksUpdate]);

  const getTotalQuestions = () => {
    const sortedTasks = [...tasks].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    return sortedTasks.reduce((total, task) => total + (task.questions?.length || 0), 0);
  };

  const getTotalPoints = () => {
    const sortedTasks = [...tasks].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    return sortedTasks.reduce((total, task) => {
      return total + (task.questions?.reduce((taskTotal, question) => taskTotal + (question.points || 0), 0) || 0);
    }, 0);
  };

  // Define sortedTasks once for consistent rendering
  const sortedTasks = [...tasks].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lab Tasks</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Drag and drop to reorder tasks and questions. Changes will be saved when you save the lab.
          </p>
        </div>
        
        <button
          onClick={onAddTask}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </button>
      </div>
      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first task to get started with this lab.
          </p>
          <button
            onClick={onAddTask}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Task
          </button>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={sortedTasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sortedTasks.map((task, sortedIndex) => (
                <DraggableTask
                  key={task.id}
                  task={task}
                  index={sortedIndex}
                  onUpdate={handleTaskUpdate}
                  onDelete={handleTaskDelete}
                  onImageUpload={onImageUpload}
                  onAttachmentUpload={onAttachmentUpload}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Lab Statistics */}
      {tasks.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Lab Overview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Tasks:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{tasks.length}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Questions:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{getTotalQuestions()}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Points:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{getTotalPoints()}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Avg Points/Task:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {tasks.length > 0 ? Math.round(getTotalPoints() / tasks.length) : 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
