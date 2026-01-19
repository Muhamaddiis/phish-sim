'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CSVUpload from '@/components/CSVUpload';
import TargetsTable from '@/components/TargetsTable';
import ExportCSVButton from '@/components/ExportCSVButton';
import DepartmentChart from '@/components/DepartmentChart';
import { campaignAPI } from '@/lib/api';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadCampaign();
    loadStats();
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const data = await campaignAPI.get(campaignId);
      setCampaign(data);
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await campaignAPI.getStats(campaignId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleTargetsUploaded = () => {
    loadCampaign();
    loadStats();
  };

  const handleSendCampaign = async () => {
    if (!confirm('Send emails to all unsent targets?')) return;
    
    setSending(true);
    try {
      await campaignAPI.send(campaignId);
      alert('Campaign sending started!');
      setTimeout(() => {
        loadCampaign();
        loadStats();
      }, 2000);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Campaign not found</div>
        </div>
      </div>
    );
  }

  const overallStats = stats?.overall_stats || {};
  const unsentCount = campaign.targets?.filter((t: any) => !t.sent).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
          <p className="text-gray-600">Subject: {campaign.email_subject}</p>
          <p className="text-gray-600">From: {campaign.from_address}</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex space-x-4">
          <CSVUpload campaignId={campaignId} onSuccess={handleTargetsUploaded} />
          <button
            onClick={handleSendCampaign}
            disabled={sending || unsentCount === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : `Send Campaign (${unsentCount} unsent)`}
          </button>
          <ExportCSVButton campaignId={campaignId} />
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Targets"
              value={overallStats.total_targets || 0}
              color="blue"
            />
            <StatCard
              title="Opened"
              value={`${overallStats.opened || 0} (${(overallStats.open_rate || 0).toFixed(1)}%)`}
              color="green"
            />
            <StatCard
              title="Clicked"
              value={`${overallStats.clicked || 0} (${(overallStats.click_rate || 0).toFixed(1)}%)`}
              color="yellow"
            />
            <StatCard
              title="Submitted"
              value={`${overallStats.submitted || 0} (${(overallStats.submit_rate || 0).toFixed(1)}%)`}
              color="red"
            />
          </div>
        )}

        {/* Department Chart */}
        {stats && stats.department_stats && stats.department_stats.length > 0 && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Department Breakdown</h2>
            <DepartmentChart data={stats.department_stats} />
          </div>
        )}

        {/* Targets Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Targets</h2>
          <TargetsTable targets={campaign.targets || []} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  const colors = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    yellow: 'border-yellow-500',
    red: 'border-red-500',
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${colors[color as keyof typeof colors]}`}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
