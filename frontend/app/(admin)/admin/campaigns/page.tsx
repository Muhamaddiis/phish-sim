'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CampaignForm from '@/components/CampaignForm';
import { campaignAPI } from '@/lib/api';

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await campaignAPI.list();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignCreated = () => {
    setShowForm(false);
    loadCampaigns();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : 'Create Campaign'}
          </button>
        </div>

        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <CampaignForm onSuccess={handleCampaignCreated} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No campaigns yet. Create your first campaign!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign: any) => (
              <div
                key={campaign.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/admin/campaigns/${campaign.id}`)}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {campaign.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Subject: {campaign.email_subject}
                </p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>From: {campaign.from_address}</span>
                  <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
