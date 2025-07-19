import React, { useState, useCallback } from 'react';
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
import { updateTaskOrder } from '../../utils/dragDropAPI';
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
  const [isReordering, setIsReordering] = useState(false);
  
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

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setIsReordering(true);
    
    try {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      // Optimistically update UI
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      
      // Update order_index for each task
      const updatedTasks = reorderedTasks.map((task, index) => ({
        ...task,
        order_index: index + 1
      }));

      onTasksUpdate(updatedTasks);

      // Send update to backend
      const taskOrderUpdates = updatedTasks.map(task => ({
        id: task.id,
        order_index: task.order_index
      }));

      await updateTaskOrder(labId, taskOrderUpdates);
      
      console.log('✅ Task order updated successfully');
    } catch (error) {
      console.error('❌ Failed to update task order:', error);
      // Revert optimistic update on error
      onTasksUpdate(tasks);
    } finally {
      setIsReordering(false);
    }
  }, [labId, tasks, onTasksUpdate]);

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
    return tasks.reduce((total, task) => total + (task.questions?.length || 0), 0);
  };

  const getTotalPoints = () => {
    return tasks.reduce((total, task) => {
      return total + (task.questions?.reduce((taskTotal, question) => taskTotal + (question.points || 0), 0) || 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lab Tasks</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Drag and drop to reorder tasks and questions. Changes are saved automatically.
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

      {isReordering && (
        <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Updating task order...</span>
        </div>
      )}

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
            items={tasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <DraggableTask
                  key={task.id}
                  task={task}
                  index={index}
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
