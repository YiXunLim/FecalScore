import { Link } from 'react-router-dom';
import { APP_TAGLINE, CREDITS, SCORE_GUIDE } from '../config';
import { CameraIcon } from '../components/Icons';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home">
      <section className="home-hero">
        <div className="container home-hero__inner">
          <p className="home-hero__tagline">{APP_TAGLINE}</p>
          <h1 className="home-hero__title">Score fecal samples with your phone camera</h1>
          <p className="home-hero__text">
            Line the sample stick up with the on-screen template, capture, and the app suggests a
            score from 0 to 3. Every photo is saved with its pen, sample number, pig ID, trial day
            and project so the data stays consistent.
          </p>
          <div className="home-hero__actions">
            <Link to="/score" className="btn btn-primary">
              <CameraIcon />
              Start scoring
            </Link>
            <Link to="/saved" className="btn btn-outline">
              View saved samples
            </Link>
          </div>
        </div>
      </section>

      <section className="container home-section" aria-labelledby="guide-title">
        <h2 id="guide-title" className="home-section__title">
          Fecal score guide
        </h2>
        <ul className="score-guide">
          {SCORE_GUIDE.map((item) => (
            <li key={item.score} className="score-guide__item">
              <span className="score-badge" aria-hidden="true">
                {item.score}
              </span>
              <span className="score-guide__text">
                <strong>
                  <span className="visually-hidden">Score {item.score}: </span>
                  {item.label}
                </strong>
                <span>{item.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="container home-section" aria-labelledby="credits-title">
        <h2 id="credits-title" className="visually-hidden">
          About this project
        </h2>
        <dl className="credits">
          {CREDITS.map((c) => (
            <div key={c.role} className="credits__item">
              <dt>{c.role}</dt>
              <dd>{c.name}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
