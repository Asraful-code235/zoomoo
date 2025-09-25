import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import logo from "../src/assets/FC-LOGO2.png";
import Preloader from "./components/Preloader";
import BackupReminderModal from './components/BackupReminderModal'
import Navigation from './components/home/Navigation'
import Sidebar from './components/Sidebar'
import Dashboard from './components/home/Dashboard'
import AdminPanel from './components/AdminPanel'
import Profile from './components/Profile'
import StreamGrid from './components/StreamGrid'
import Welcome from './components/home/Welcome'
import SingleStreamView from './components/streams/SingleStreamView'
import { useAppBootstrap } from './hooks/useAppBootstrap'

function App() {
  const {
    authenticated,
    showPreloader,
    showBackupModal,
    setShowBackupModal,
    handleBackupCompleted,
  } = useAppBootstrap(logo);

  return (
    <Router>
      <Preloader
        show={showPreloader}
        logoSrc={logo}
        tagline={authenticated ? "Syncing your room & wallet…" : "Spinning up hamster cams…"}
      />

      <div className="min-h-screen w-full bg-white overflow-x-hidden">
        <Navigation logo={logo} />
        <Sidebar logo={logo} />

        <main className="w-full md:pl-24 lg:pl-28 xl:pl-32 max-w-[1920px] mx-auto lg:px-8 overflow-x-hidden pb-24  md:pb-24">
          <Routes>
            <Route
              path="/"
              element={<div className="pt-3 md:pt-4 pb-8">{authenticated ? <Dashboard /> : <Welcome />}</div>}
            />
            <Route
              path="/streams"
              element={<div className="pt-3 md:pt-4 pb-8">{authenticated ? <StreamGrid /> : <Welcome />}</div>}
            />
            <Route
              path="/market"
              element={<div className="pt-3 md:pt-4 pb-8">{authenticated ? <StreamGrid /> : <Welcome />}</div>}
            />
            <Route
              path="/streams/:streamId"
              element={<div className="pt-3 md:pt-4 pb-8">{authenticated ? <SingleStreamView /> : <Welcome />}</div>}
            />
            <Route path="/profile" element={authenticated ? <Profile /> : <Welcome />} />
            <Route path="/admin" element={authenticated ? <AdminPanel /> : <Welcome />} />
            <Route
              path="/leaderboard"
              element={<div className="pt-3 md:pt-4 pb-8">{authenticated ? <div className="text-center py-20"><h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2><p className="text-gray-600 mt-2">Coming soon...</p></div> : <Welcome />}</div>}
            />
            <Route
              path="/buy-coins"
              element={<div className="pt-3 md:pt-4 pb-8">{authenticated ? <div className="text-center py-20"><h2 className="text-2xl font-bold text-gray-900">Buy Coins</h2><p className="text-gray-600 mt-2">Coming soon...</p></div> : <Welcome />}</div>}
            />
            <Route
              path="/community"
              element={<div className="pt-3 md:pt-4 pb-8">{authenticated ? <div className="text-center py-20"><h2 className="text-2xl font-bold text-gray-900">Community</h2><p className="text-gray-600 mt-2">Coming soon...</p></div> : <Welcome />}</div>}
            />
            <Route
              path="/thesis"
              element={<div className="pt-3 md:pt-4 pb-8">{authenticated ? <div className="text-center py-20"><h2 className="text-2xl font-bold text-gray-900">Thesis</h2><p className="text-gray-600 mt-2">Coming soon...</p></div> : <Welcome />}</div>}
            />
          </Routes>
        </main>

        <BackupReminderModal
          isOpen={showBackupModal}
          onClose={() => setShowBackupModal(false)}
          onBackupCompleted={handleBackupCompleted}
        />
      </div>
    </Router>
  );
}

export default App
