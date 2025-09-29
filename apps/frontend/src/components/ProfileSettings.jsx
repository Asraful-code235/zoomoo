import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth';
import { useTheme } from '../hooks/useTheme';

export default function ProfileSettings({ user }) {
  const { exportWallet } = useSolanaWallets();
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: ''
  });
  const [backupStatus, setBackupStatus] = useState({
    completed: false,
    date: null
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
      setProfileForm({
        display_name: user.display_name || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || ''
      });
      checkBackupStatus();
    }
  }, [user?.id]);

  const checkBackupStatus = () => {
    const completed = localStorage.getItem('wallet_backup_completed') === 'true';
    const date = localStorage.getItem('wallet_backup_date');
    setBackupStatus({
      completed,
      date: date ? new Date(date) : null
    });
  };

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/users/${user.id}/preferences`);
      if (!response.ok) throw new Error('Failed to fetch preferences');
      
      const data = await response.json();
      setPreferences(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates) => {
    try {
      setSaving(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/users/${user.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update preferences');
      
      const updatedPreferences = await response.json();
      setPreferences(updatedPreferences);
      setSuccess('Preferences updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setSaving(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      const updatedUser = await response.json();
      setSuccess('Profile updated successfully!');
      setEditingProfile(false);
      setTimeout(() => setSuccess(''), 3000);
      
      // Update parent component if possible
      if (window.location) {
        window.location.reload(); // Simple refresh for now
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChange = (field, value) => {
    updatePreferences({ [field]: value });
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    updatePreferences({ theme: newTheme });
  };

  const handleBackupWallet = async () => {
    try {
      setIsExporting(true);
      setError(null);
      
      // Get Solana wallet specifically
      const solanaWallet = user?.linkedAccounts?.find(account => 
        account.type === 'wallet' && account.chainType === 'solana'
      ) || (user?.wallet?.chainType === 'solana' ? user.wallet : null);
      
      if (!solanaWallet) {
        throw new Error('No Solana wallet found. Please ensure you have a Solana wallet connected.');
      }
      
      // Export the Solana wallet specifically
      await exportWallet({ address: solanaWallet.address });
      
      // Mark backup as completed
      localStorage.setItem('wallet_backup_completed', 'true');
      localStorage.setItem('wallet_backup_date', new Date().toISOString());
      
      // Update backup status
      checkBackupStatus();
      
      setSuccess('Solana wallet backup completed successfully! 🔐');
      setTimeout(() => setSuccess(''), 5000);
      
      console.log('✅ Solana wallet backup completed successfully');
    } catch (error) {
      console.error('❌ Solana wallet backup failed:', error);
      setError('Failed to backup Solana wallet. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile(profileForm);
  };

  const exportData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch user's complete data
      const [historyRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/api/users/${user.id}/history?limit=1000`),
        fetch(`${apiUrl}/api/users/${user.id}/stats`)
      ]);

      const historyData = await historyRes.json();
      const statsData = await statsRes.json();

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          created_at: user.created_at
        },
        statistics: statsData,
        betting_history: historyData.positions,
        preferences: preferences,
        exported_at: new Date().toISOString()
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zoomies-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('Data exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

 return (
  <div className="space-y-6">
    {success && (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        {success}
      </div>
    )}
    {error && (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        {error}
      </div>
    )}

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white m-0">Profile</h3>
        </div>
        <div className="p-6">
          {!editingProfile ? (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Display Name</div>
                  <div className="text-gray-900 dark:text-white font-medium">{user.display_name || "Not set"}</div>
                </div>
                <button
                  onClick={() => setEditingProfile(true)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                >
                  Edit
                </button>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Bio</div>
                <div className="text-gray-900 dark:text-white font-medium">{user.bio || "Not set"}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Email</div>
                <div className="text-gray-900 dark:text-white font-medium">{user.email?.address || "No email"}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={profileForm.display_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, display_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Your display name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white font-semibold hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-black text-white font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white m-0">Appearance</h3>
        </div>
        <div className="p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Theme</div>
          <div className="flex gap-3">
            <button
              onClick={() => handleThemeChange("light")}
              disabled={saving}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold border ${
                theme === "light"
                  ? "bg-gray-50 dark:bg-gray-800 border-gray-800 dark:border-gray-600 text-gray-900 dark:text-white"
                  : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              Light
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
              disabled={saving}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold border ${
                theme === "dark"
                  ? "bg-gray-900 dark:bg-gray-800 text-white border-gray-900 dark:border-gray-600"
                  : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white m-0">Notifications</h3>
        </div>
        <div className="p-6 space-y-5">
          {[
            {
              key: "notifications_enabled",
              title: "All Notifications",
              desc: "Master toggle for all notifications",
              disabled: false,
            },
            {
              key: "email_notifications",
              title: "Email Notifications",
              desc: "Receive updates via email",
              disabled: !preferences?.notifications_enabled,
            },
            {
              key: "push_notifications",
              title: "Push Notifications",
              desc: "Receive browser notifications",
              disabled: !preferences?.notifications_enabled,
            },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{row.title}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{row.desc}</div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  disabled={saving || row.disabled}
                  checked={preferences?.[row.key] || false}
                  onChange={(e) => handleToggleChange(row.key, e.target.checked)}
                />
                <span className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700 transition peer-checked:bg-green-600 dark:peer-checked:bg-green-500 after:absolute after:h-5 after:w-5 after:rounded-full after:bg-white after:translate-x-0 after:transition after:top-0.5 after:left-0.5 peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Data & Wallet Security */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white m-0">Data & Security</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Export Your Data</div>
              <div className="text-xs text-gray-600">Download your betting data and preferences</div>
            </div>
            <button
              onClick={exportData}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-100"
            >
              Export
            </button>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-900 mb-2">Wallet Backup</div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                    backupStatus.completed
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                  }`}
                >
                  {backupStatus.completed
                    ? `Backed up ${backupStatus.date?.toLocaleDateString()}`
                    : "Not backed up"}
                </span>
              </div>
              <button
                onClick={handleBackupWallet}
                disabled={isExporting}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  backupStatus.completed
                    ? "bg-black text-white hover:opacity-90"
                    : "bg-black text-white hover:opacity-90"
                } ${isExporting ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isExporting ? "Exporting…" : backupStatus.completed ? "Re-export Keys" : "Backup Now"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Account Created</div>
              <div className="text-xs text-gray-600">Member since</div>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

}

