import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';
import ScorePage from './pages/ScorePage';
import SavedPage from './pages/SavedPage';
import ProjectPage from './pages/ProjectPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * All the pages of the app and their web addresses.
 * Pages inside <AppLayout> get the red header and the navigation bar.
 * The scoring flow (camera) is full screen, so it sits outside the layout.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/score" element={<ScorePage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/saved/projects/:projectId" element={<ProjectPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
