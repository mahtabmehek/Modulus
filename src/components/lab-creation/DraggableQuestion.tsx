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
  images?: string[];
  attachments?: string[];
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
        console.log('Calling onImageUpload with', dt.files.length, 'files');
        onImageUpload?.(question.id, dt.files);
      }
      
      if (otherFiles.length > 0) {
        const dt = new DataTransfer();
        otherFiles.forEach(file => dt.items.add(file));
        console.log('Calling onAttachmentUpload with', dt.files.length, 'files');
        onAttachmentUpload?.(question.id, dt.files);
      }
    }
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
      className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3 ${
        isDragging ? 'shadow-lg z-10' : ''
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
          console.log('Image input onChange called with', e.target.files?.length, 'files');
          onImageUpload?.(question.id, e.target.files);
        }}
        className="hidden"
      />
      <input
        ref={attachmentInputRef}
        type="file"
        multiple
        onChange={(e) => {
          console.log('Attachment input onChange called with', e.target.files?.length, 'files');
          onAttachmentUpload?.(question.id, e.target.files);
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
            {question.images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img 
                  src={img} 
                  alt="Question" 
                  className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600" 
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <X className="w-2 h-2" />
                </button>
              </div>
            ))}
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
            {question.attachments.map((attachment, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded text-xs">
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  {typeof attachment === 'string' ? attachment.split('/').pop() || 'File' : attachment}
                </span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
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
