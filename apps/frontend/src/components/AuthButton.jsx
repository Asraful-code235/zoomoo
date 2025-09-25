import { usePrivy } from '@privy-io/react-auth';

export default function AuthButton() {
  const { 
    ready, 
    authenticated, 
    user, 
    login, 
    logout
  } = usePrivy();

  // Don't render until Privy is ready
  if (!ready) {
    return (
      <button className="bg-gray-200 text-gray-500 px-6 py-3 rounded-xl font-semibold cursor-not-allowed transition-all duration-300 animate-pulse border border-gray-300" disabled>
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </span>
      </button>
    );
  }

  // If user is authenticated, show logout button
  if (authenticated && user) {
    return (
      <button 
        className="bg-gradient-to-r from-danger-500 to-danger-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-danger-600 hover:to-danger-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-danger-600"
        onClick={logout}
      >
        <span className="flex items-center gap-2">
          👋 Logout
        </span>
      </button>
    );
  }

  // If not authenticated, show login button
  return (
    <button 
      className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-3.5 rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 transform hover:scale-105 shadow-glow hover:shadow-glow-lg animate-glow border border-primary-600 text-lg"
      onClick={login}
    >
      <span className="flex items-center gap-2">
        🔗 Connect Wallet
      </span>
    </button>
  );
}
