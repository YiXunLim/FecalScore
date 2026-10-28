import { NavLink, Outlet } from 'react-router-dom';
import { APP_NAME } from '../config';
import { CameraIcon, FolderIcon, HomeIcon } from './Icons';
import './AppLayout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/score', label: 'Score', icon: CameraIcon, end: false },
  { to: '/saved', label: 'Saved samples', icon: FolderIcon, end: false },
];

/**
 * The frame around every page:
 *  - red ISU header at the top (with links on wider screens)
 *  - bottom tab bar on phones
 */
export default function AppLayout() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="container app-header__inner">
          <NavLink to="/" className="brand" aria-label={`${APP_NAME} home`}>
            <span className="brand__mark">
              <CameraIcon size={20} />
            </span>
            <span className="brand__name">{APP_NAME}</span>
          </NavLink>

          <nav className="top-nav" aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="top-nav__link">
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="tab-bar" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tab-bar__link">
            <Icon size={24} />
            <span>{label === 'Saved samples' ? 'Saved' : label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
