import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import ProfileOverview from './ProfileOverview';
import ProfileHistory from './ProfileHistory';
import ProfileWallet from './ProfileWallet';
import ProfileSettings from './ProfileSettings';

export default function Profile() {
  const { authenticated, user } = usePrivy();
  const [activeTab, setActiveTab] = useState('overview');

  if (!authenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="text-center animate-fade-in">
          <div className="text-8xl mb-6 animate-float">🔐</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-lg text-gray-600 mb-8">Please connect your wallet to view your profile.</p>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <p className="text-primary-700">Your profile contains betting history, wallet information, and account settings.</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'history', label: 'Betting History', icon: '📊' },
    { id: 'wallet', label: 'Wallet & Transactions', icon: '💰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ProfileOverview user={user} />;
      case 'history':
        return <ProfileHistory user={user} />;
      case 'wallet':
        return <ProfileWallet user={user} />;
      case 'settings':
        return <ProfileSettings user={user} />;
      default:
        return <ProfileOverview user={user} />;
    }
  };

return (
  <div className="w-full">
    {/* Header */}
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-900 text-white mx-auto flex items-center justify-center text-xl mb-3">
          🐹
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 m-0">Your Profile</h1>
        <p className="text-sm text-gray-600 mt-2">
          Manage your account, wallet and prediction history
        </p>
      </div>
    </div>

    {/* Tabs */}
  <div className="bg-white border-b border-gray-200">
  <div className="max-w-6xl mx-auto px-6">
    <div className="py-4">
      <div
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-gray-50"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              className={[
                "px-3 py-1.5 text-sm font-semibold rounded-md transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/50",
                isActive
                  ? "bg-black text-white shadow-sm ring-1 ring-black scale-[1.02]"
                  : "text-gray-700 hover:text-gray-900 hover:bg-white"
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  </div>
</div>


    {/* Content */}
    <div className="bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {renderTabContent()}
      </div>
    </div>
  </div>
);

}
