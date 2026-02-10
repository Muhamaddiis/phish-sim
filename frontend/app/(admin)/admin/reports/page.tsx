'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ExecutiveReport {
  generated_at: string;
  report_period: string;
  overall_metrics: any;
  trend_analysis: any;
  department_ranking: any[];
  risk_assessment: any;
  top_vulnerable: any[];
  recommendations: string[];
  campaign_summary: any[];
}

export default function ReportsPage() {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadReport();
  }, [dateRange]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/reports/executive', {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
        },
      });
      setReport(response.data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const response = await api.get('/api/reports/executive/csv', {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `executive_report_${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading executive report...</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  const metrics = report.overall_metrics;
  const riskLevel = report.risk_assessment.overall_risk_level;

  // Risk level color
  const riskColors = {
    Low: 'bg-green-100 text-green-800 border-green-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    High: 'bg-orange-100 text-orange-800 border-orange-300',
    Critical: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Executive Security Report</h1>
              <p className="text-gray-600 mt-2">
                Generated: {new Date(report.generated_at).toLocaleString()}
              </p>
              <p className="text-gray-600">Period: {report.report_period}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={downloadCSV}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Download CSV
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Print Report
              </button>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="mt-4 flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={loadReport}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Update Report
            </button>
          </div>
        </div>

        {/* Overall Risk Assessment */}
        <div className={`mb-8 p-6 rounded-lg border-2 ${riskColors[riskLevel as keyof typeof riskColors]}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Overall Risk Level: {riskLevel}
              </h2>
              <p className="mt-2 text-lg">
                Risk Score: {report.risk_assessment.risk_score.toFixed(1)}/100
              </p>
              <p className="mt-2 font-medium">
                {report.risk_assessment.recommended_action}
              </p>
            </div>
            <div className="text-6xl">
              {riskLevel === 'Critical' && '🔴'}
              {riskLevel === 'High' && '🟠'}
              {riskLevel === 'Medium' && '🟡'}
              {riskLevel === 'Low' && '🟢'}
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Campaigns"
            value={metrics.total_campaigns}
            icon="📊"
            color="blue"
          />
          <MetricCard
            title="Emails Sent"
            value={metrics.total_emails_sent.toLocaleString()}
            icon="📧"
            color="green"
          />
          <MetricCard
            title="Click Rate"
            value={`${metrics.average_click_rate.toFixed(1)}%`}
            icon="🖱️"
            color="yellow"
            subtitle={getTrendIcon(report.trend_analysis.click_rate_trend)}
          />
          <MetricCard
            title="Users Compromised"
            value={metrics.total_users_compromised}
            icon="⚠️"
            color="red"
          />
        </div>

        {/* Recommendations */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🎯 Key Recommendations</h2>
          <ul className="space-y-3">
            {report.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-indigo-600 mr-3 mt-1">•</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Department Risk Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Department Risk Analysis</h2>
            <Bar
              data={{
                labels: report.department_ranking.map(d => d.department),
                datasets: [
                  {
                    label: 'Risk Score',
                    data: report.department_ranking.map(d => d.risk_score),
                    backgroundColor: report.department_ranking.map(d => {
                      if (d.risk_level === 'Critical') return 'rgba(239, 68, 68, 0.8)';
                      if (d.risk_level === 'High') return 'rgba(251, 146, 60, 0.8)';
                      if (d.risk_level === 'Medium') return 'rgba(251, 191, 36, 0.8)';
                      return 'rgba(34, 197, 94, 0.8)';
                    }),
                  },
                ],
              }}
              options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }}
            />
          </div>

          {/* Campaign Effectiveness */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Campaign Effectiveness</h2>
            <Doughnut
              data={{
                labels: report.campaign_summary.map(c => c.campaign_name),
                datasets: [
                  {
                    label: 'Submit Rate',
                    data: report.campaign_summary.map(c => c.submit_rate),
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(16, 185, 129, 0.8)',
                      'rgba(251, 191, 36, 0.8)',
                      'rgba(239, 68, 68, 0.8)',
                      'rgba(139, 92, 246, 0.8)',
                    ],
                  },
                ],
              }}
            />
          </div>
        </div>

        {/* Department Rankings Table */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Department Risk Rankings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submit Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compromised</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.department_ranking.map((dept, index) => (
                  <tr key={index} className={index < 3 ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dept.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        dept.risk_level === 'Critical' ? 'bg-red-100 text-red-800' :
                        dept.risk_level === 'High' ? 'bg-orange-100 text-orange-800' :
                        dept.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {dept.risk_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dept.click_rate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dept.submit_rate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {dept.compromised} / {dept.total_targets}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Vulnerable Users */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🎯 High-Risk Users (Require Training)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Times Compromised</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Incident</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.top_vulnerable.map((user, index) => (
                  <tr key={index} className={user.times_compromised >= 3 ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full ${
                        user.times_compromised >= 3 ? 'bg-red-100 text-red-800' :
                        user.times_compromised >= 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.times_compromised}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_compromised}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Campaign Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Campaign Performance Summary</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submit Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effectiveness</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.campaign_summary.map((campaign, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {campaign.campaign_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(campaign.sent_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.total_sent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.click_rate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.submit_rate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        campaign.effectiveness === 'Excellent' ? 'bg-green-100 text-green-800' :
                        campaign.effectiveness === 'Good' ? 'bg-blue-100 text-blue-800' :
                        campaign.effectiveness === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {campaign.effectiveness}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, subtitle }: any) {
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
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`text-3xl p-3 rounded-full ${colors[color as keyof typeof colors]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function getTrendIcon(trend: string) {
  if (trend === 'improving') return '📈 Improving';
  if (trend === 'declining') return '📉 Declining';
  return '➡️ Stable';
}