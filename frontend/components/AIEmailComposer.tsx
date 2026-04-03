'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface AIEmailComposerProps {
  onEmailGenerated: (subject: string, body: string) => void;
}

export default function AIEmailComposer({ onEmailGenerated }: AIEmailComposerProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('professional');
  const [purpose, setPurpose] = useState('password_reset');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe what you want the email to say');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await api.post('/api/ai/generate-email', {
        description,
        tone,
        purpose,
      });

      const { subject, body } = response.data;
      
      // Pass generated content to parent
      onEmailGenerated(subject, body);
      
      // Close composer
      setShowComposer(false);
      setDescription('');
      
      // Success message
      alert('✨ Email generated successfully! Review and customize as needed.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate email. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!showComposer) {
    return (
      <button
        onClick={() => setShowComposer(true)}
        className="inline-flex items-center px-4 py-2 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/50"
      >
        <span className="mr-2">
            <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                    <path d="M20 2v4" />
                    <path d="M22 4h-4" />
                    <circle cx="4" cy="20" r="2" />
                  </svg>
        </span>
        Generate with AI
      </button>
    );
  }

  return (
    <div className="border-2 border-purple-200 rounded-xl p-6 bg-linear-to-br from-purple-50 to-indigo-50 mb-6 text-gray-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            AI Email Composer
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Describe what you want and AI will generate a phishing simulation email
          </p>
        </div>
        <button
          onClick={() => setShowComposer(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe Your Email
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Example: Create a password reset email that appears to be from IT Security. It should mention suspicious login activity and ask the user to verify their account immediately. Make it look urgent but professional."
          />
          <p className="mt-1 text-xs text-gray-500">
            Be specific about the scenario, sender, urgency level, and key details to include
          </p>
        </div>

        {/* Tone and Purpose */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="professional">Professional</option>
              <option value="urgent">Urgent</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scenario Type
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="password_reset">Password Reset</option>
              <option value="security_alert">Security Alert</option>
              <option value="hr_notice">HR Notice</option>
              <option value="it_update">IT Update</option>
              <option value="invoice">Invoice/Payment</option>
              <option value="document_share">Document Share</option>
            </select>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">AI will automatically include:</p>
              <ul className="list-disc ml-5 space-y-1 text-xs">
                <li>Proper HTML formatting with inline styles</li>
                <li>Placeholder tags ({'{{Name}}'}, {'{{Link}}'}, etc.)</li>
                <li>Mobile-responsive design</li>
                <li>Realistic corporate email structure</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-purple-200">
          <button
            onClick={() => setShowComposer(false)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !description.trim()}
            className="px-linear from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50"
          >
            {generating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              <span>✨ Generate Email</span>
            )}
          </button>
        </div>
      </div>

      {/* Example Prompts */}
      <div className="mt-4 pt-4 border-t border-purple-200">
        <p className="text-xs font-semibold text-gray-700 mb-2">Example Prompts:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Urgent password reset from IT with suspicious login detected",
            "HR benefits enrollment deadline reminder",
            "Security team asking to verify MFA setup",
            "Shared document from colleague requiring immediate review",
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => setDescription(example)}
              className="text-xs px-3 py-1 bg-white border border-purple-200 rounded-full hover:bg-purple-50 transition-colors text-gray-700"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}