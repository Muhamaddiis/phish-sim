'use client';

import { useState } from 'react';
import { campaignAPI } from '@/lib/api';

export default function CampaignForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email_subject: '',
    email_body: '',
    from_address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await campaignAPI.create(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const defaultTemplate = `<html>
<body style="font-family: Arial, sans-serif;">
  <p>Hello {{Name}},</p>
  <p>We need to verify your account information. Please click the link below:</p>
  <p><a href="{{Link}}" style="color: #0066cc;">Verify My Account</a></p>
  <p>Best regards,<br>IT Security Team</p>
</body>
</html>`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Campaign Name
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Q4 2024 Security Awareness"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Subject
        </label>
        <input
          type="text"
          required
          value={formData.email_subject}
          onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Action Required: Verify Your Account"
        />
        <p className="mt-1 text-xs text-gray-500">
          Use placeholders: {'{'}{'{'} Name{'}'}{'}'}, {'{'}{'{'} Department{'}'}{'}'}, etc.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          From Address
        </label>
        <input
          type="email"
          required
          value={formData.from_address}
          onChange={(e) => setFormData({ ...formData, from_address: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="security@company.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Body (HTML)
        </label>
        <textarea
          required
          rows={10}
          value={formData.email_body}
          onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
          placeholder={defaultTemplate}
        />
        <p className="mt-1 text-xs text-gray-500">
          Required: {'{'}{'{'} Link{'}'}{'}'}  Optional: {'{'}{'{'} Name{'}'}{'}'}, {'{'}{'{'} Department{'}'}{'}'}, {'{'}{'{'} Role{'}'}{'}'}, etc.
        </p>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  );
}
