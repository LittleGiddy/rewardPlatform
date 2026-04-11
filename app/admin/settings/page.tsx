'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    winProbability: 0.002,
    maxWinProbability: 0.05,
    streakBonusEnabled: true,
    dailyAttemptsLimit: 5,
    cooldownMinutes: 10,
    shareRequired: 3
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/admin/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/admin/settings', settings);
      setMessage('✅ Settings saved successfully!');
    } catch (err) {
      setMessage('❌ Failed to save settings');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Platform Settings</h1>
        <p className="text-gray-500 mt-1">Configure your voucher platform behavior</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {message && (
          <div className={`mb-6 p-3 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Win Probability (%)</label>
              <input
                type="number"
                step="0.001"
                value={settings.winProbability * 100}
                onChange={(e) => setSettings({ ...settings, winProbability: parseFloat(e.target.value) / 100 })}
                className="w-full border rounded-lg px-4 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">e.g., 0.2% = 1 in 500 users win</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Max Win Probability (%)</label>
              <input
                type="number"
                step="0.01"
                value={settings.maxWinProbability * 100}
                onChange={(e) => setSettings({ ...settings, maxWinProbability: parseFloat(e.target.value) / 100 })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Daily Attempts Limit</label>
              <input
                type="number"
                value={settings.dailyAttemptsLimit}
                onChange={(e) => setSettings({ ...settings, dailyAttemptsLimit: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Cooldown (minutes)</label>
              <input
                type="number"
                value={settings.cooldownMinutes}
                onChange={(e) => setSettings({ ...settings, cooldownMinutes: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Shares Required</label>
              <input
                type="number"
                value={settings.shareRequired}
                onChange={(e) => setSettings({ ...settings, shareRequired: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.streakBonusEnabled}
                  onChange={(e) => setSettings({ ...settings, streakBonusEnabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Enable Streak Bonus</span>
              </label>
            </div>
          </div>
          
          <button
            onClick={saveSettings}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}