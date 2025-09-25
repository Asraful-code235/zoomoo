import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export function useBetting() {
  const { authenticated, user } = usePrivy();
  const [placing, setPlacing] = useState(false);
  
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const placeBet = async (marketId, side, amount) => {
    if (!authenticated) {
      throw new Error("Please sign in to place bets!");
    }
    
    if (!user?.id) {
      throw new Error("User ID not available");
    }

    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      throw new Error("Enter a valid amount");
    }
    
    if (amt < 1) {
      throw new Error("Minimum bet is $1");
    }
    
    if (amt > 1000) {
      throw new Error("Maximum bet is $1,000");
    }

    if (!marketId) {
      throw new Error("No market available");
    }

    try {
      setPlacing(true);
      
      const response = await fetch(`${apiBase}/api/markets/${marketId}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          side, 
          amount: amt, 
          userId: user.id 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bet');
      }

      // Dispatch event for marquee ticker
      window.dispatchEvent(
        new CustomEvent("recent-bet", {
          detail: {
            userHandle:
              user?.twitter?.username ||
              user?.telegram?.username ||
              user?.email?.address?.split("@")[0] ||
              "anon",
            avatarUrl:
              user?.farcaster?.pfp || 
              user?.twitter?.profilePictureUrl || 
              "https://placehold.co/28x28",
            amount: amt,
            side: side ? "YES" : "NO",
            marketQuestion: data.position?.market?.question || "Market",
            ts: Date.now(),
            marketId,
          },
        })
      );

      return data;
    } catch (error) {
      console.error('Betting error:', error);
      throw error;
    } finally {
      setPlacing(false);
    }
  };

  return {
    placeBet,
    placing,
    authenticated,
  };
}
