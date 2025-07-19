import React, { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus } from 'lucide-react';
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
import { Task } from '../../types/lab';
import { DraggableQuestion } from './DraggableQuestion';

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

interface DraggableTaskProps {
    task: Task & { questions?: Question[] };
    index: number;
    onUpdate: (taskId: string, updates: Partial<Task & { questions?: Question[] }>) => void;
    onDelete: (taskId: string) => void;
    onImageUpload?: (taskId: string, questionId: string, files: FileList | null) => void;
    onAttachmentUpload?: (taskId: string, questionId: string, files: FileList | null) => void;
}

export function DraggableTask({ task, index, onUpdate, onDelete, onImageUpload, onAttachmentUpload }: DraggableTaskProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

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

    const handleQuestionDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id || !task.questions) {
            return;
        }

        const oldIndex = task.questions.findIndex((q) => q.id === active.id);
        const newIndex = task.questions.findIndex((q) => q.id === over.id);

        if (oldIndex !== newIndex) {
            // Reorder questions in frontend only
            const reorderedQuestions = arrayMove(task.questions, oldIndex, newIndex);

            // Update order_index for each question based on new position
            const updatedQuestions = reorderedQuestions.map((question, idx) => ({
                ...question,
                order_index: idx + 1
            }));

            console.log('🔄 Frontend question reorder in task:', task.title);

            // Update parent component's state
            onUpdate(task.id, { questions: updatedQuestions });
            toast.success('Question order updated! Remember to save the lab.');
        }
    }, [task.id, task.questions, task.title, onUpdate]);

    const addQuestion = () => {
        const newQuestion: Question = {
            id: `q-${Date.now()}`,
            type: 'flag',
            title: 'New Question',
            description: '',
            points: 0,
            images: [],
            attachments: [],
            hints: []
        };

        const updatedQuestions = [...(task.questions || []), newQuestion];
        onUpdate(task.id, { questions: updatedQuestions });
    };

    const updateQuestion = (questionId: string, updates: Partial<Question>) => {
        const updatedQuestions = (task.questions || []).map(q =>
            q.id === questionId ? { ...q, ...updates } : q
        );
        onUpdate(task.id, { questions: updatedQuestions });
    };

    const deleteQuestion = (questionId: string) => {
        const updatedQuestions = (task.questions || []).filter(q => q.id !== questionId);
        onUpdate(task.id, { questions: updatedQuestions });
    };

    const addMultipleChoiceOption = (questionId: string) => {
        const updatedQuestions = (task.questions || []).map(q =>
            q.id === questionId
                ? {
                    ...q,
                    multipleChoiceOptions: [
                        ...(q.multipleChoiceOptions || []),
                        { option: '', isCorrect: false }
                    ]
                }
                : q
        );
        onUpdate(task.id, { questions: updatedQuestions });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white dark:bg-gray-800 rounded-lg border p-4 ${isDragging ? 'shadow-lg z-10' : 'shadow-sm'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Drag to reorder"
                    >
                        <GripVertical className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task {index + 1}</h3>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onDelete(task.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete task"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Task Content */}
            <div className="space-y-4">
                <input
                    type="text"
                    value={task.title}
                    onChange={(e) => onUpdate(task.id, { title: e.target.value })}
                    placeholder="Task title"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <textarea
                    value={task.description}
                    onChange={(e) => onUpdate(task.id, { description: e.target.value })}
                    placeholder="Task description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {/* Questions Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Questions
                        </label>
                        <button
                            onClick={addQuestion}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Question
                        </button>
                    </div>

                    {task.questions && task.questions.length > 0 ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleQuestionDragEnd}
                        >
                            <SortableContext
                                items={task.questions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map(question => question.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div>
                                    {task.questions
                                        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                                        .map((question, questionIndex) => (
                                            <DraggableQuestion
                                                key={question.id}
                                                question={question}
                                                index={questionIndex}
                                                taskId={task.id}
                                                onUpdate={updateQuestion}
                                                onDelete={deleteQuestion}
                                                onAddMultipleChoiceOption={addMultipleChoiceOption}
                                                onImageUpload={(questionId, files) => onImageUpload?.(task.id, questionId, files)}
                                                onAttachmentUpload={(questionId, files) => onAttachmentUpload?.(task.id, questionId, files)}
                                            />
                                        ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No questions yet</p>
                            <button
                                onClick={addQuestion}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center mx-auto"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add First Question
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
