import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { ExperienceDetailRefined } from './components/ExperienceDetailRefined';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { ExplorePageSimple } from './pages/ExplorePageSimple';
import { AboutPage } from './pages/AboutPage';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const location = useLocation();
  
  // Determine header variant based on route
  const headerVariant = location.pathname.startsWith('/host') ? 'landing' : 'explore';

  return (
    <div className="min-h-screen bg-background">
      <Header variant={headerVariant} />
      
      {selectedExperience ? (
        <ExperienceDetailRefined 
          onClose={() => setSelectedExperience(null)} 
          experienceId={selectedExperience}
        />
      ) : (
        <Routes>
          <Route path="/" element={<HomePage onExperienceSelect={setSelectedExperience} />} />
          <Route path="/host/experiences" element={<LandingPage onExperienceSelect={setSelectedExperience} />} />
          <Route path="/explore" element={<ExplorePageSimple onExperienceSelect={setSelectedExperience} />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      )}
      
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}