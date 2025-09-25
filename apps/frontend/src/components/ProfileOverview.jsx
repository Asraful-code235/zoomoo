import { useState, useEffect } from 'react';
import { useSolanaWallets } from '@privy-io/react-auth';
import { Connection, PublicKey } from '@solana/web3.js';
import BettingBalance from './BettingBalance';

export default function ProfileOverview({ user }) {
  const { exportWallet } = useSolanaWallets();
  const [balance, setBalance] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);

  // Get Solana wallet specifically
  const solanaWallet = user?.linkedAccounts?.find(account => 
    account.type === 'wallet' && account.chainType === 'solana'
  ) || (user?.wallet?.chainType === 'solana' ? user.wallet : null);

  // Fetch USDC balance (reusing logic from WalletInfo)
  const fetchUSDCBalance = async (walletAddress) => {
    try {
      setIsLoading(true);
      
      const rpcEndpoints = [
        'https://mainnet.helius-rpc.com/?api-key=fa2ad082-1426-49cc-bad5-d9abbc589803',
        'https://api.mainnet-beta.solana.com',
        'https://rpc.ankr.com/solana',
      ];
      
      let connection = null;
      for (const endpoint of rpcEndpoints) {
        try {
          connection = new Connection(endpoint);
          await connection.getSlot();
          break;
        } catch (err) {
          connection = null;
        }
      }
      
      if (!connection) return;
      
      const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      const walletPublicKey = new PublicKey(walletAddress);
      
      const { getAssociatedTokenAddress } = await import('@solana/spl-token');
      const associatedTokenAccount = await getAssociatedTokenAddress(USDC_MINT, walletPublicKey);
      
      const balance = await connection.getTokenAccountBalance(associatedTokenAccount);
      
      if (balance.value) {
        const usdcBalance = balance.value.uiAmount || 0;
        setBalance(usdcBalance.toFixed(2));
      } else {
        setBalance('0.00');
      }
    } catch (err) {
      if (err.message?.includes('could not find account')) {
        setBalance('0.00');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (solanaWallet?.address) {
      fetchUSDCBalance(solanaWallet.address);
    }
  }, [solanaWallet?.address]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDisplayName = () => {
    return user.email?.address?.split('@')[0] || user.google?.email?.split('@')[0] || 'User';
  };

  const getMemberSince = () => {
    // Use the earliest verification date available
    const dates = user.linkedAccounts
      ?.map(account => account.firstVerifiedAt)
      .filter(Boolean)
      .sort();
    
    return dates?.[0] ? formatDate(dates[0]) : 'Recently';
  };

 return (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Profile Info */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 m-0">Profile</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-bold">
              {getDisplayName().charAt(0).toUpperCase()}
            </div>
            <h4 className="mt-3 text-lg font-semibold text-gray-900">{getDisplayName()}</h4>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Email</span>
              <span className="text-gray-900">{user.email?.address || user.google?.email || "Not provided"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Member Since</span>
              <span className="text-gray-900">{getMemberSince()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">User ID</span>
              <span className="text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded">
                …{user.id.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Summary */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 m-0">Wallet</h3>
        </div>
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="text-3xl font-bold text-gray-900">
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-base font-medium text-gray-600">
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                  Loading…
                </span>
              ) : (
                `$${balance}`
              )}
            </div>
            <div className="text-xs text-gray-600 mt-1">USDC on Solana</div>
          </div>

          {solanaWallet && (
            <div className="space-y-3">
              <div>
                <span className="block text-sm text-gray-600 mb-1">Address</span>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2 rounded-lg">
                  <span className="text-sm font-mono text-gray-900 truncate">
                    {solanaWallet.address.slice(0, 8)}…{solanaWallet.address.slice(-8)}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(solanaWallet.address)}
                      className="text-xs font-semibold px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => exportWallet({ address: solanaWallet.address })}
                      className="text-xs font-semibold px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                  Embedded Solana
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Betting Balance (as-is component) */}
      <BettingBalance />

      {/* Quick Stats (starter) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden lg:col-span-2">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 m-0">Betting Statistics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">0</div>
              <div className="text-xs text-gray-600 mt-1">Total Bets</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">0%</div>
              <div className="text-xs text-gray-600 mt-1">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">$0.00</div>
              <div className="text-xs text-gray-600 mt-1">Total Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">0</div>
              <div className="text-xs text-gray-600 mt-1">Current Streak</div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-700 m-0">
              Start predicting to build your stats.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 m-0">Quick Actions</h3>
        </div>
        <div className="p-6 space-y-3">
          <button className="w-full bg-black text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90">
            Deposit USDC
          </button>
          <button
            onClick={() => solanaWallet?.address && fetchUSDCBalance(solanaWallet.address)}
            className="w-full border border-gray-300 bg-white text-gray-900 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-100"
          >
            Refresh Balance
          </button>
          <button className="w-full border border-gray-300 bg-white text-gray-900 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-100">
            View Detailed Stats
          </button>
        </div>
      </div>
    </div>
  </div>
);

}
