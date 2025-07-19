import React, { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, Upload, Image as ImageIcon, Paperclip, X } from 'lucide-react';

interface Question {
    id: string;
    type: 'flag' | 'text' | 'file-upload' | 'multiple-choice';
    title: string;
    description: string;
    flag?: string;
    points: number;
    images?: (string | File)[];  // Support both URLs and File objects
    attachments?: (string | File)[];  // Support both URLs and File objects
    multipleChoiceOptions?: {
        option: string;
        isCorrect: boolean;
    }[];
    hints?: string[];
}

interface DraggableQuestionProps {
    question: Question;
    index: number;
    taskId: string;
    onUpdate: (questionId: string, updates: Partial<Question>) => void;
    onDelete: (questionId: string) => void;
    onAddMultipleChoiceOption: (questionId: string) => void;
    onImageUpload?: (questionId: string, files: FileList | null) => void;
    onAttachmentUpload?: (questionId: string, files: FileList | null) => void;
}

export function DraggableQuestion({
    question,
    index,
    taskId,
    onUpdate,
    onDelete,
    onAddMultipleChoiceOption,
    onImageUpload,
    onAttachmentUpload
}: DraggableQuestionProps) {
    const [dragActive, setDragActive] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        console.log('DraggableQuestion: handleDrop called');

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const files = e.dataTransfer.files;
            console.log('Files dropped:', files.length);

            const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
            const otherFiles = Array.from(files).filter(file => !file.type.startsWith('image/'));

            console.log('Image files:', imageFiles.length, 'Other files:', otherFiles.length);

            if (imageFiles.length > 0) {
                const dt = new DataTransfer();
                imageFiles.forEach(file => dt.items.add(file));
                console.log('📷 DRAG & DROP: Storing', dt.files.length, 'images in browser');
                handleImageUpload(dt.files);
            }

            if (otherFiles.length > 0) {
                const dt = new DataTransfer();
                otherFiles.forEach(file => dt.items.add(file));
                console.log('📎 DRAG & DROP: Storing', dt.files.length, 'attachments in browser');
                handleAttachmentUpload(dt.files);
            }
        }
    };

    const handleImageUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        // Store files immediately in browser memory for preview
        const currentImages = question.images || [];
        const newFiles = Array.from(files);

        console.log('📷 BROWSER STORAGE: Adding', newFiles.length, 'images to question', question.id);

        // Add File objects directly to the images array for immediate display
        const updatedImages = [...currentImages, ...newFiles];
        onUpdate(question.id, { images: updatedImages });

        console.log('📷 Images stored in browser memory:', updatedImages.length, 'total images');
    };

    const handleAttachmentUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        // Store files immediately in browser memory
        const currentAttachments = question.attachments || [];
        const newFiles = Array.from(files);

        console.log('📎 BROWSER STORAGE: Adding', newFiles.length, 'attachments to question', question.id);

        // Add File objects directly to the attachments array for immediate display
        const updatedAttachments = [...currentAttachments, ...newFiles];
        onUpdate(question.id, { attachments: updatedAttachments });

        console.log('📎 Attachments stored in browser memory:', updatedAttachments.length, 'total attachments');
    };

    const removeImage = (index: number) => {
        const newImages = question.images?.filter((_, i) => i !== index) || [];
        onUpdate(question.id, { images: newImages });
    };

    const removeAttachment = (index: number) => {
        const newAttachments = question.attachments?.filter((_, i) => i !== index) || [];
        onUpdate(question.id, { attachments: newAttachments });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3 ${isDragging ? 'shadow-lg z-10' : ''
                } ${dragActive ? 'border-2 border-dashed border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Drag to reorder question"
                    >
                        <GripVertical className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Question {index + 1}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <select
                        value={question.type}
                        onChange={(e) => onUpdate(question.id, { type: e.target.value as any })}
                        className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    >
                        <option value="flag">Flag</option>
                        <option value="text">Text Answer</option>
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="file-upload">File Upload</option>
                    </select>

                    {/* Image Upload Button */}
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex items-center px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded border border-green-300 dark:border-green-700"
                        title="Add images"
                    >
                        <ImageIcon className="w-3 h-3 mr-1" />
                        Images
                    </button>

                    {/* Attachment Upload Button */}
                    <button
                        type="button"
                        onClick={() => attachmentInputRef.current?.click()}
                        className="flex items-center px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded border border-blue-300 dark:border-blue-700"
                        title="Add attachments"
                    >
                        <Paperclip className="w-3 h-3 mr-1" />
                        Files
                    </button>

                    <button
                        onClick={() => onDelete(question.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete question"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="mb-3">
                <input
                    type="text"
                    value={question.title}
                    onChange={(e) => onUpdate(question.id, { title: e.target.value })}
                    placeholder="Question title"
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
            </div>

            <textarea
                value={question.description}
                onChange={(e) => {
                    onUpdate(question.id, { description: e.target.value });
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="Question description/instructions"
                rows={2}
                style={{ minHeight: '60px', resize: 'vertical' }}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 mb-3"
            />

            {/* Hidden file inputs */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                    console.log('📷 FILE INPUT: Selected', e.target.files?.length, 'images');
                    handleImageUpload(e.target.files);
                    // Clear the input so the same file can be selected again
                    e.target.value = '';
                }}
                className="hidden"
            />
            <input
                ref={attachmentInputRef}
                type="file"
                multiple
                onChange={(e) => {
                    console.log('📎 FILE INPUT: Selected', e.target.files?.length, 'attachments');
                    handleAttachmentUpload(e.target.files);
                    // Clear the input so the same file can be selected again
                    e.target.value = '';
                }}
                className="hidden"
            />

            {/* Drag and drop area message */}
            {dragActive && (
                <div className="text-center py-4 mb-3">
                    <Upload className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-sm text-blue-600 dark:text-blue-400">Drop files here to attach</p>
                </div>
            )}

            {/* Display uploaded images */}
            {question.images && question.images.length > 0 && (
                <div className="mb-3">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Images ({question.images.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {question.images.map((img, idx) => {
                            // Handle File objects (browser storage), full URLs (already uploaded), and relative paths (server storage)
                            let imageUrl: string;
                            let fileName: string;
                            let isInBrowser = false;

                            if (img instanceof File) {
                                // New file in browser - create object URL
                                imageUrl = URL.createObjectURL(img);
                                fileName = img.name;
                                isInBrowser = true;
                                console.log(`🖼️ Image ${idx}: File object (${fileName}) -> ${imageUrl.substring(0, 50)}...`);
                            } else if (typeof img === 'string') {
                                if (img.startsWith('http://') || img.startsWith('https://')) {
                                    // Already a full URL
                                    imageUrl = img;
                                    console.log(`🖼️ Image ${idx}: Full URL -> ${imageUrl}`);
                                } else if (img.startsWith('/uploads/') || img.startsWith('uploads/')) {
                                    // Relative path from server - construct full URL
                                    imageUrl = `http://localhost:3001${img.startsWith('/') ? img : '/' + img}`;
                                    console.log(`🖼️ Image ${idx}: Server path (${img}) -> ${imageUrl}`);
                                } else {
                                    // Fallback - assume it's a relative path
                                    imageUrl = `http://localhost:3001/uploads/${img}`;
                                    console.log(`🖼️ Image ${idx}: Fallback path (${img}) -> ${imageUrl}`);
                                }
                                fileName = img.split('/').pop() || 'Image';
                            } else {
                                // Fallback
                                imageUrl = '';
                                fileName = 'Image';
                                console.log(`🖼️ Image ${idx}: Unknown type -> fallback`);
                            }

                            return (
                                <div key={idx} className="relative group">
                                    <img
                                        src={imageUrl}
                                        alt={fileName}
                                        className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600"
                                        title={fileName}
                                    />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove image"
                                    >
                                        <X className="w-2 h-2" />
                                    </button>
                                    {isInBrowser && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded-b">
                                            📷 In browser
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Display uploaded attachments */}
            {question.attachments && question.attachments.length > 0 && (
                <div className="mb-3">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Attachments ({question.attachments.length})
                    </label>
                    <div className="space-y-1">
                        {question.attachments.map((attachment, idx) => {
                            // Handle both File objects (browser storage) and URLs (server storage)
                            const fileName = attachment instanceof File ? attachment.name :
                                (typeof attachment === 'string' ? attachment.split('/').pop() || 'File' : 'File');
                            const isInBrowser = attachment instanceof File;

                            return (
                                <div key={idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-xs">
                                    <span className="text-gray-700 dark:text-gray-300 truncate flex items-center">
                                        {isInBrowser && <span className="text-blue-500 mr-1">📎</span>}
                                        {fileName}
                                        {isInBrowser && <span className="text-blue-500 ml-1 text-xs">(in browser)</span>}
                                    </span>
                                    <button
                                        onClick={() => removeAttachment(idx)}
                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
                                        title="Remove attachment"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Question Type Specific Fields */}
            {question.type === 'flag' && (
                <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Expected Flag
                    </label>
                    <input
                        type="text"
                        value={question.flag || ''}
                        onChange={(e) => onUpdate(question.id, { flag: e.target.value })}
                        placeholder="MODULUS{example_flag_here}"
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
            )}

            {question.type === 'multiple-choice' && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs text-gray-600 dark:text-gray-400">
                            Answer Options
                        </label>
                        <button
                            type="button"
                            onClick={() => onAddMultipleChoiceOption(question.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Option
                        </button>
                    </div>
                    {question.multipleChoiceOptions?.map((option, optionIdx) => (
                        <div key={optionIdx} className="flex items-center gap-2 mb-1">
                            <input
                                type="checkbox"
                                checked={option.isCorrect}
                                onChange={(e) => {
                                    const newOptions = [...(question.multipleChoiceOptions || [])];
                                    newOptions[optionIdx].isCorrect = e.target.checked;
                                    onUpdate(question.id, { multipleChoiceOptions: newOptions });
                                }}
                                className="flex-shrink-0"
                            />
                            <input
                                type="text"
                                value={option.option}
                                onChange={(e) => {
                                    const newOptions = [...(question.multipleChoiceOptions || [])];
                                    newOptions[optionIdx].option = e.target.value;
                                    onUpdate(question.id, { multipleChoiceOptions: newOptions });
                                }}
                                placeholder="Answer option"
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                            <button
                                onClick={() => {
                                    const newOptions = question.multipleChoiceOptions?.filter((_, i) => i !== optionIdx) || [];
                                    onUpdate(question.id, { multipleChoiceOptions: newOptions });
                                }}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                                title="Remove option"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
