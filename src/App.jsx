import { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import NeuralBackground from './components/NeuralBackground';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import ChoosePath from './pages/ChoosePath';
import SubjectSelection from './pages/SubjectSelection';
import TopicSelection from './pages/TopicSelection';
import LearningInterface from './pages/LearningInterface';
import SessionResults from './pages/SessionResults';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <UserProvider>
        <NeuralBackground />
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/choose-path" element={<ChoosePath />} />
            <Route path="/subjects" element={<SubjectSelection />} />
            <Route path="/topics" element={<TopicSelection />} />
            <Route path="/learn" element={<LearningInterface />} />
            <Route path="/results" element={<SessionResults />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </UserProvider>
    </BrowserRouter>
  );
}
