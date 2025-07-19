// Task and Question type definitions with metadata support

export interface TaskMetadata {
    difficulty?: 'easy' | 'intermediate' | 'advanced';
    estimatedTime?: number; // in minutes
    prerequisites?: string[];
    tags?: string[];
    customFields?: {
        instructor_notes?: string;
        learning_objectives?: string[];
        resources?: string[];
    };
    ui_preferences?: {
        collapsed?: boolean;
        highlighted?: boolean;
        background_color?: string;
    };
    validation_rules?: {
        required_commands?: string[];
        expected_files?: string[];
    };
}

export interface QuestionMetadata {
    points?: number;
    difficulty?: 'easy' | 'intermediate' | 'advanced';
    hint?: string;
    explanation?: string;
    time_limit?: number; // in seconds
    question_type?: 'multiple_choice' | 'short_answer' | 'essay' | 'code' | 'file_upload';
    auto_grade?: boolean;
    rubric?: {
        criteria: string;
        points: number;
    }[];
}

export interface Task {
    id: string;
    lab_id: string;
    title: string;
    description: string;
    order_index: number;
    created_at?: string;
    updated_at?: string;
    metadata?: TaskMetadata;
}

export interface Question {
    id: string;
    task_id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'short_answer' | 'essay' | 'code' | 'file_upload';
    options?: string[];
    correct_answer?: string;
    order_index: number;
    points?: number;
    created_at?: string;
    updated_at?: string;
    metadata?: QuestionMetadata;
}

export interface Lab {
    id: string;
    module_id: string;
    title: string;
    description?: string;
    lab_type: 'vm' | 'container' | 'web' | 'simulation';
    order_index: number;
    estimated_minutes?: number;
    points_possible?: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    tasks?: Task[];
}
