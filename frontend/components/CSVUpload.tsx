'use client';

import { useState } from 'react';
import { campaignAPI } from '@/lib/api';

export default function CSVUpload({ 
  campaignId, 
  onSuccess 
}: { 
  campaignId: string; 
  onSuccess: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const data = await campaignAPI.uploadTargets(campaignId, file);
      setResult(data);
      onSuccess();
    } catch (error: any) {
      setResult({
        errors: [error.response?.data?.error || 'Upload failed'],
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="inline-block">
      <label className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer">
        {uploading ? 'Uploading...' : 'Upload Targets (CSV)'}
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="font-medium">
            {result.imported ? `✅ Imported ${result.imported} targets` : 'Upload Result'}
          </p>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-2 text-sm text-red-600">
              <p className="font-medium">Errors:</p>
              <ul className="list-disc ml-5">
                {result.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}