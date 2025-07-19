import { Task, Question, TaskMetadata, QuestionMetadata } from '../types/lab';
import { apiClient } from '../lib/api';

// DISABLED: Frontend-only mode - no backend calls during drag & drop
export const updateTaskOrder = async (labId: string, reorderedTasks: { id: string; order_index: number }[]) => {
  console.log('⚠️ updateTaskOrder DISABLED - frontend-only mode');
  console.log('Data would have been sent:', { labId, reorderedTasks });
  return { message: 'Frontend-only mode - no backend call made' };
};

// DISABLED: Frontend-only mode - no backend calls during drag & drop
export const updateQuestionOrder = async (
  taskId: string, 
  reorderedQuestions: { id: string; order_index: number }[]
) => {
  console.log('⚠️ updateQuestionOrder DISABLED - frontend-only mode');
  console.log('Data would have been sent:', { taskId, reorderedQuestions });
  return { message: 'Frontend-only mode - no backend call made' };
};

// API function to update task metadata
export const updateTaskMetadata = async (taskId: string, metadata: TaskMetadata) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/tasks/${taskId}/metadata`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ metadata }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update task metadata');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating task metadata:', error);
    throw error;
  }
};

// API function to update question metadata
export const updateQuestionMetadata = async (questionId: string, metadata: QuestionMetadata) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/questions/${questionId}/metadata`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ metadata }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update question metadata');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating question metadata:', error);
    throw error;
  }
};
