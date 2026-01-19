'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DepartmentChart from '@/components/DepartmentChart';
import { statsAPI } from '@/lib/api';
import { MdOutlinePeopleOutline, MdPhishing } from "react-icons/md";
import { HiOutlineMailOpen } from "react-icons/hi";
// import { LuMousePointerClick } from "react-icons/lu";
import { GiClick } from "react-icons/gi";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsAPI.getOverall();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  const overallStats = stats?.overall_stats || {};

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Targets"
            value={overallStats.total_targets || 0}
            icon={<MdOutlinePeopleOutline/>}
            color="blue"
          />
          <StatsCard
            title="Emails Sent"
            value={overallStats.emails_sent || 0}
            icon={<MdPhishing />}
            color="green"
          />
          <StatsCard
            title="Open Rate"
            value={`${(overallStats.open_rate || 0).toFixed(1)}%`}
            icon={<HiOutlineMailOpen/>}
            color="yellow"
          />
          <StatsCard
            title="Click Rate"
            value={`${(overallStats.click_rate || 0).toFixed(1)}%`}
            icon={<GiClick/>}
            color="red"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-neutral-500">Department Performance</h2>
            <DepartmentChart data={stats?.grouped_stats || []} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-neutral-500">Recent Campaigns</h2>
            <div className="space-y-3">
              {stats?.campaign_stats?.slice(0, 5).map((campaign: any) => (
                <div
                  key={campaign.campaign_id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/campaigns/${campaign.campaign_id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{campaign.campaign_name}</h3>
                      <p className="text-sm text-gray-500">
                        {campaign.emails_sent} emails sent
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-indigo-600">
                        {campaign.click_rate.toFixed(1)}% clicked
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/campaigns')}
              className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View All Campaigns
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, color }: any) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`text-3xl p-3 rounded-full ${colors[color as keyof typeof colors]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
