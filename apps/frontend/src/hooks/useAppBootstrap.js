import { useEffect, useMemo, useRef, useState } from "react";
import { usePrivy, useSolanaWallets } from "@privy-io/react-auth";

export function useAppBootstrap(logo) {
  const { authenticated, user, ready } = usePrivy();
  const { createWallet: createSolanaWallet, wallets: solanaWallets } = useSolanaWallets();

  const [showBackupModal, setShowBackupModal] = useState(false);
  const [booting, setBooting] = useState(true);
  const didBootRef = useRef(false);
  const lastRegisteredUserRef = useRef(null);

  const apiUrl = useMemo(() => import.meta.env.VITE_API_URL || "http://localhost:3001", []);

  const checkBackupReminder = () => {
    const backupCompleted = localStorage.getItem("wallet_backup_completed") === "true";
    const lastShown = localStorage.getItem("backup_modal_last_shown");
    const shouldShow = !backupCompleted && (!lastShown || Date.now() - parseInt(lastShown, 10) > 24 * 60 * 60 * 1000);
    if (shouldShow) {
      setTimeout(() => {
        setShowBackupModal(true);
        localStorage.setItem("backup_modal_last_shown", Date.now().toString());
      }, 2000);
    }
  };

  const handleBackupCompleted = () => {
    setShowBackupModal(false);
    localStorage.removeItem("wallet_backup_reminded");
  };

  const ensureSolWallet = async () => {
    const hasSolanaWallet =
      solanaWallets.length > 0 ||
      user?.linkedAccounts?.some(
        (a) => a.type === "wallet" && (a.chainType === "solana" || a.chain_type === "solana")
      );
    if (!hasSolanaWallet) {
      try {
        await createSolanaWallet();
        await new Promise((r) => setTimeout(r, 600));
      } catch {}
    }
  };

  const registerWithBackend = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privyUser: user }),
      });
      if (!res.ok) {
        try {
          await res.json();
        } catch {}
      }
    } catch {}
  };

  useEffect(() => {
    if (!ready) {
      setBooting(true);
      return;
    }
    if (didBootRef.current) return;
    didBootRef.current = true;

    let cancelled = false;
    (async () => {
      setBooting(true);
      try {
        if (authenticated && user) {
          await ensureSolWallet();
          await registerWithBackend();
          lastRegisteredUserRef.current = user.id || null;
          checkBackupReminder();
        } else {
          checkBackupReminder();
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    if (lastRegisteredUserRef.current === user.id) return;
    lastRegisteredUserRef.current = user.id;

    (async () => {
      try {
        await ensureSolWallet();
        await registerWithBackend();
        checkBackupReminder();
      } catch {}
    })();
  }, [authenticated, user?.id, ready]);

  const showPreloader = !ready || (booting && !didBootRef.current ? true : booting);

  return {
    ready,
    authenticated,
    user,
    showPreloader,
    showBackupModal,
    setShowBackupModal,
    handleBackupCompleted,
  };
}


