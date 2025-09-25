import { usePrivy, useSolanaWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Wallet as WalletIcon, RefreshCw, Copy, Key, ChevronDown } from 'lucide-react';

export default function WalletInfo() {
  const { authenticated, user } = usePrivy();
  const { exportWallet } = useSolanaWallets();

  const [balance, setBalance] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const solanaWallet =
    user?.linkedAccounts?.find(
      (a) => a.type === 'wallet' && (a.chainType === 'solana' || a.chain_type === 'solana')
    ) || (user?.wallet?.chainType === 'solana' ? user.wallet : null);

  const shorten = (addr = '') => (addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-6)}` : addr);

  const fetchUSDCBalance = async (walletAddress) => {
    try {
      setIsLoading(true);
      setError(null);

      const heliusApiKey = import.meta.env.VITE_HELIUS_API_KEY;
      const endpoints = [
        heliusApiKey && heliusApiKey !== 'your_helius_api_key_here'
          ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
          : null,
        import.meta.env.VITE_SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
        'https://solana-api.projectserum.com',
        'https://rpc.ankr.com/solana',
        'https://solana-mainnet.g.alchemy.com/v2/demo',
      ].filter(Boolean);

      let connection = null;
      let lastErr = null;

      for (const url of endpoints) {
        try {
          const c = new Connection(url);
          await c.getSlot();
          connection = c;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!connection) throw new Error(lastErr?.message || 'No RPC available');

      const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      const walletPk = new PublicKey(walletAddress);
      const { getAssociatedTokenAddress } = await import('@solana/spl-token');
      const ata = await getAssociatedTokenAddress(USDC_MINT, walletPk);
      const bal = await connection.getTokenAccountBalance(ata);

      if (bal.value) {
        setBalance((bal.value.uiAmount || 0).toFixed(2));
      } else {
        setBalance('0.00');
      }
    } catch (e) {
      if (e?.message?.includes('could not find account')) {
        setBalance('0.00');
        setError(null);
      } else {
        setError('RPC access limited');
        setBalance('--');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated && solanaWallet?.address) {
      fetchUSDCBalance(solanaWallet.address);
    }
  }, [authenticated, solanaWallet?.address]);

  if (!authenticated || !solanaWallet) return null;

  return (
    <div className="w-full mb-4">
      {/* Compact card */}
      <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-3 md:p-4 shadow-sm hover:shadow transition">
        <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-between">
          {/* Left: icon + balance + address */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-900 text-white flex items-center justify-center">
              <WalletIcon className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">USDC Balance</div>

              <div className="flex items-baseline gap-2">
                <div className="text-xl md:text-2xl font-semibold text-gray-900">
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                      Loading
                    </span>
                  ) : error ? (
                    <span className="text-rose-600">⚠ {error}</span>
                  ) : (
                    `$${balance}`
                  )}
                </div>
                {!isLoading && !error && (
                  <span className="hidden sm:inline text-xs text-gray-500">USDC</span>
                )}
              </div>

              <button
                type="button"
                className="mt-0.5 text-xs text-gray-600 hover:text-gray-900 font-mono truncate max-w-[200px] md:max-w-[260px] text-left"
                onClick={() => navigator.clipboard.writeText(solanaWallet.address)}
                title="Copy address"
              >
                {shorten(solanaWallet.address)}
              </button>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchUSDCBalance(solanaWallet.address)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              title="Refresh balance"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(solanaWallet.address)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              title="Copy address"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => exportWallet({ address: solanaWallet.address })}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              title="Export wallet"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              title={open ? 'Hide details' : 'Show details'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible details (kept minimal) */}
        {open && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Full Address</div>
              <div className="text-xs font-mono break-all text-gray-800">{solanaWallet.address}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Betting Balance</div>
              <div className="text-xs text-gray-600">
                Betting uses your platform balance (see Profile). USDC shown here is on-chain.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
