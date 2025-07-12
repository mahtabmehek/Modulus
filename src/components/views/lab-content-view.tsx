import React, { useState, useEffect } from 'react';
import { labAPI, Lab } from '../../lib/api/labs';

interface LabContentViewProps {
  className?: string;
  labId?: string;
}

export const LabContentView: React.FC<LabContentViewProps> = ({ className, labId: propLabId }) => {
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get lab ID from props
  const labId = propLabId;

  useEffect(() => {
    const fetchLab = async () => {
      if (!labId) {
        setError('No lab ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const labData = await labAPI.getLab(parseInt(labId));
        setLab(labData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lab');
      } finally {
        setLoading(false);
      }
    };

    fetchLab();
  }, [labId]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading lab</h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500">Lab not found</p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lab.title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {lab.module_title} • {lab.course_title}
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lab Metadata */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{lab.estimated_minutes} minutes</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{lab.points_possible} points</span>
          </div>
          {lab.max_attempts > 0 && (
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{lab.max_attempts} max attempts</span>
            </div>
          )}
        </div>
      </div>

      {/* Lab Description */}
      {lab.description && (
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            {lab.description.split('\n').map((paragraph: string, index: number) => (
              <p key={index} className="mb-2">{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* Lab Instructions */}
      <div className="px-6 py-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
        {lab.instructions ? (
          <div className="prose prose-sm max-w-none text-gray-700">
            {lab.instructions.split('\n').map((paragraph: string, index: number) => (
              <p key={index} className="mb-3">{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No instructions provided yet.</p>
        )}
      </div>

      {/* Future: VM/Container Launch Button */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Lab environment will be available soon
          </div>
          <button 
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
          >
            Launch Lab Environment
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabContentView;
