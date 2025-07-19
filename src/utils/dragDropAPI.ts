import { Task, Question, TaskMetadata, QuestionMetadata } from '../types/lab';

// API function to update task order
export const updateTaskOrder = async (labId: string, reorderedTasks: { id: string; order_index: number }[]) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/labs/${labId}/tasks/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ tasks: reorderedTasks }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update task order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating task order:', error);
    throw error;
  }
};

// API function to update question order within a task
export const updateQuestionOrder = async (
  taskId: string, 
  reorderedQuestions: { id: string; order_index: number }[]
) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/tasks/${taskId}/questions/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ questions: reorderedQuestions }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update question order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating question order:', error);
    throw error;
  }
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
