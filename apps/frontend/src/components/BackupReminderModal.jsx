import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
// Removed BackupReminderModal.css import - now using Tailwind classes

const BackupReminderModal = ({ isOpen, onClose, onBackupCompleted }) => {
  const { exportWallet } = usePrivy();
  const [isExporting, setIsExporting] = useState(false);

  const handleBackupNow = async () => {
    try {
      setIsExporting(true);
      
      // Use Privy's built-in export wallet feature
      await exportWallet();
      
      // Mark backup as completed
      localStorage.setItem('wallet_backup_completed', 'true');
      localStorage.setItem('wallet_backup_date', new Date().toISOString());
      
      // Notify parent component
      onBackupCompleted();
      onClose();
      
      console.log('✅ Wallet backup completed successfully');
    } catch (error) {
      console.error('❌ Wallet backup failed:', error);
      // Don't close modal if backup failed
    } finally {
      setIsExporting(false);
    }
  };

  const handleRemindLater = () => {
    // Set reminder for later (don't mark as completed)
    localStorage.setItem('wallet_backup_reminded', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-95vh overflow-y-auto animate-modal-slide-in">
        <div className="py-8 px-8 text-center border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 m-0">🔐 Secure Your Wallet</h2>
          <p className="text-base text-gray-600 m-0">Protect your funds by backing up your private keys</p>
        </div>

        <div className="py-8 px-8">
          <div className="mb-6">
            <div className="flex items-start mb-5 gap-4">
              <span className="text-xl flex-shrink-0 mt-0.5">🛡️</span>
              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-1 m-0">Your wallet is automatically created</h4>
                <p className="text-sm text-gray-600 leading-relaxed m-0">We've generated a secure wallet for you, but you need to back it up.</p>
              </div>
            </div>
            
            <div className="flex items-start mb-5 gap-4">
              <span className="text-xl flex-shrink-0 mt-0.5">🔑</span>
              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-1 m-0">Private keys = Full control</h4>
                <p className="text-sm text-gray-600 leading-relaxed m-0">Only you should have access to your private keys. Back them up safely.</p>
              </div>
            </div>
            
            <div className="flex items-start mb-0 gap-4">
              <span className="text-xl flex-shrink-0 mt-0.5">💾</span>
              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-1 m-0">Store them securely</h4>
                <p className="text-sm text-gray-600 leading-relaxed m-0">Save your backup in a secure location like a password manager or offline storage.</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm leading-relaxed m-0">⚠️ <strong>Important:</strong> If you lose access to your account and haven't backed up your keys, your funds may be permanently lost.</p>
          </div>
        </div>

        <div className="px-8 pb-5 flex flex-col gap-3">
          <button 
            onClick={handleBackupNow}
            disabled={isExporting}
            className="py-3.5 px-6 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 min-w-30 bg-blue-500 text-white hover:bg-blue-600 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? '🔄 Exporting...' : '🔐 Backup Now'}
          </button>
          
          <button 
            onClick={handleRemindLater}
            disabled={isExporting}
            className="py-3.5 px-6 border border-gray-300 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 min-w-30 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ⏰ Remind Me Later
          </button>
        </div>

        <div className="px-8 pb-8 text-center">
          <p className="text-xs text-gray-400 leading-relaxed m-0">
            This uses Privy's secure export feature to safely back up your wallet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupReminderModal;
