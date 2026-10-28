import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ApiError,
  getProject,
  listProjects,
  listSamples,
  type Project,
  type Sample,
  type SampleQuery,
} from '../api/client';
import { SearchIcon } from '../components/Icons';
import { useDebounced } from '../lib/hooks';
import SampleList from '../features/saved/SampleList';
import SampleEditor from '../features/saved/SampleEditor';
import ExportMenu from '../features/saved/ExportMenu';
import '../features/saved/saved.css';

/** One project: search, filters, the sample list, editing and export. */
export default function ProjectPage() {
  const projectId = Number(useParams().projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [all, setAll] = useState<Sample[]>([]); // every sample in the project (for the filter choices)
  const [shown, setShown] = useState<Sample[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sample | null>(null);

  const [query, setQuery] = useState('');
  const [pen, setPen] = useState('');
  const [trialDay, setTrialDay] = useState('');
  const [score, setScore] = useState('');
  const q = useDebounced(query.trim());

  const filters: SampleQuery = useMemo(
    () => ({ projectId, q, pen, trialDay, score }),
    [projectId, q, pen, trialDay, score],
  );

  function loadAll() {
    listSamples({ projectId }).then(setAll).catch(() => undefined);
  }

  function loadShown() {
    listSamples(filters)
      .then(setShown)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load samples.'));
  }

  useEffect(() => {
    getProject(projectId)
      .then(setProject)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load the project.'));
    listProjects().then(setProjects).catch(() => undefined);
    loadAll();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(loadShown, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Choices for the filter drop-downs, from the samples in this project.
  const pens = useMemo(() => uniqueSorted(all.map((s) => s.pen)), [all]);
  const days = useMemo(() => uniqueSorted(all.map((s) => String(s.trial_day))), [all]);

  const filtering = !!(q || pen || trialDay || score);

  function refresh() {
    setEditing(null);
    loadAll();
    loadShown();
  }

  return (
    <div className="container saved-page">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/saved">Saved samples</Link>
        <span aria-hidden="true">/</span>
        <span>{project?.name ?? '…'}</span>
      </nav>

      <div className="page-head">
        <div>
          <h1>{project?.name ?? 'Project'}</h1>
          {project?.description && <p className="page-head__desc">{project.description}</p>}
        </div>
        <ExportMenu query={filters} disabled={!shown || shown.length === 0} />
      </div>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      <div className="toolbar">
        <label className="search-box toolbar__search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search in this project"
            aria-label="Search in this project"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="toolbar__filters">
          <select className="input" aria-label="Filter by pen" value={pen} onChange={(e) => setPen(e.target.value)}>
            <option value="">Pen: all</option>
            {pens.map((p) => (
              <option key={p} value={p}>
                Pen {p}
              </option>
            ))}
          </select>
          <select
            className="input"
            aria-label="Filter by trial day"
            value={trialDay}
            onChange={(e) => setTrialDay(e.target.value)}
          >
            <option value="">Day: all</option>
            {days.map((d) => (
              <option key={d} value={d}>
                Day {d}
              </option>
            ))}
          </select>
          <select className="input" aria-label="Filter by score" value={score} onChange={(e) => setScore(e.target.value)}>
            <option value="">Score: all</option>
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={String(n)}>
                Score {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {shown && (
        <p className="count-line">
          {filtering
            ? `${shown.length} of ${all.length} sample${all.length === 1 ? '' : 's'}`
            : `${shown.length} sample${shown.length === 1 ? '' : 's'}`}
          {filtering && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setQuery('');
                setPen('');
                setTrialDay('');
                setScore('');
              }}
            >
              Clear filters
            </button>
          )}
        </p>
      )}

      {shown && shown.length > 0 && <SampleList samples={shown} onOpen={setEditing} onDeleted={refresh} />}
      {shown && shown.length === 0 && (
        <p className="empty">
          {filtering ? 'No samples match.' : <>No samples yet. <Link to="/score">Score a sample</Link> and choose this project.</>}
        </p>
      )}

      {editing && (
        <SampleEditor
          sample={editing}
          projects={projects}
          onClose={() => setEditing(null)}
          onSaved={refresh}
          onDeleted={refresh}
        />
      )}
    </div>
  );
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
