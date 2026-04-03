'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { CgProfile } from "react-icons/cg";
import { IoIosLogOut } from "react-icons/io";
import { MdOutlineAccountTree, MdLockOutline } from "react-icons/md";
import api from '@/lib/api';

interface UserInfo {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      // Get user info from localStorage or API
      const token = localStorage.getItem('token');
      if (token) {
        // Decode JWT to get user info (simple decode, not verification)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.user_id,
          username: payload.username,
          role: payload.role,
          created_at: new Date(payload.iat * 1000).toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      router.push('/login');
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

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <nav className="flex flex-col">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-3 text-left text-sm font-medium border-l-4 transition-colors ${
                    activeTab === 'profile'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span><CgProfile /></span>
                    profile
                    
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`px-4 py-3 text-left text-sm font-medium border-l-4 transition-colors ${
                    activeTab === 'account'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span><MdOutlineAccountTree/></span>
                    Account
                    
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-4 py-3 text-left text-sm font-medium border-l-4 transition-colors ${
                    activeTab === 'security'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span><MdLockOutline/></span>
                    Security
                    
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-3 text-left text-sm font-medium border-l-4 border-transparent text-red-600 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span><IoIosLogOut /></span>
                    Logout
                    
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="col-span-12 md:col-span-9">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                
                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      {user?.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{user?.username}</h3>
                      <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                        {user?.username}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 capitalize">
                        {user?.role}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User ID
                      </label>
                      <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-mono text-xs">
                        {user?.id}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member Since
                      </label>
                      <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Role Description */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Your Permissions</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {user?.role === 'admin' && (
                        <>
                          <li>✅ Create and manage campaigns</li>
                          <li>✅ Upload and manage targets</li>
                          <li>✅ View all reports and analytics</li>
                          <li>✅ Export data</li>
                          <li>✅ Manage users (if implemented)</li>
                        </>
                      )}
                      {user?.role === 'soc' && (
                        <>
                          <li>✅ View campaigns and reports</li>
                          <li>✅ Generate executive reports</li>
                          <li>✅ Export data</li>
                          <li>❌ Cannot create campaigns</li>
                        </>
                      )}
                      {user?.role === 'viewer' && (
                        <>
                          <li>✅ View dashboards</li>
                          <li>✅ View reports</li>
                          <li>❌ Cannot create campaigns</li>
                          <li>❌ Cannot export data</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Session Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600">Current Session</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Active
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Browser: {navigator.userAgent.split(' ').slice(-2).join(' ')}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                          <p className="text-xs text-gray-500">Receive campaign completion notifications</p>
                        </div>
                        <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md text-sm">
                          Coming Soon
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                          <p className="text-xs text-gray-500">Switch to dark theme</p>
                        </div>
                        <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md text-sm">
                          Coming Soon
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">⚠️</span>
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-900 mb-1">Security Notice</h4>
                        <p className="text-xs text-yellow-800">
                          This tool is for authorized security awareness training only. Unauthorized use is prohibited and may be illegal.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Password</h3>
                    <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md text-sm">
                      Change Password (Coming Soon)
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">2FA Status</p>
                        <p className="text-xs text-gray-500">Add an extra layer of security</p>
                      </div>
                      <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
                        Not Available
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-4 text-red-600">Danger Zone</h3>
                    <div className="border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Logout from all devices</p>
                          <p className="text-xs text-gray-500">End all active sessions</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}