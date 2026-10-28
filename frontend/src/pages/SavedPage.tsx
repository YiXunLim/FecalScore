import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, deleteProject, listProjects, listSamples, type Project, type Sample } from '../api/client';
import { ArrowRightIcon, PlusIcon, SearchIcon, TrashIcon } from '../components/Icons';
import SwipeRow from '../components/SwipeRow';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate, useDebounced, useMediaQuery } from '../lib/hooks';
import SampleList from '../features/saved/SampleList';
import SampleEditor from '../features/saved/SampleEditor';
import ExportMenu from '../features/saved/ExportMenu';
import NewProjectDialog from '../features/saved/NewProjectDialog';
import '../features/saved/saved.css';

/** Saved samples: search across every project, and the list of projects. */
export default function SavedPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim());
  const [results, setResults] = useState<Sample[] | null>(null);
  const [editing, setEditing] = useState<Sample | null>(null);
  const [creating, setCreating] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const wide = useMediaQuery('(min-width: 900px)');

  function loadProjects() {
    listProjects()
      .then(setProjects)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load projects.'));
  }

  useEffect(loadProjects, []);

  function runSearch() {
    if (!q) {
      setResults(null);
      return;
    }
    listSamples({ q })
      .then(setResults)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Search failed.'));
  }

  useEffect(runSearch, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container saved-page">
      <div className="page-head">
        <h1>Saved samples</h1>
        <button type="button" className="btn btn-outline page-head__btn" onClick={() => setCreating(true)}>
          <PlusIcon size={18} />
          New project
        </button>
      </div>

      <label className="search-box search-box--big">
        <SearchIcon size={22} />
        <input
          type="search"
          placeholder="Search all projects — pen, pig ID, trial day, score, notes…"
          aria-label="Search all projects"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <p className="search-help">
        Tip: type <code>pen 3</code>, <code>#2</code>, <code>day 14</code>, <code>pig 76</code> or <code>score 2</code> to
        match exactly. Combine them, e.g. <code>pen 3 day 14</code>.
      </p>

      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}

      {q && results && (
        <section className="saved-section">
          <div className="section-head">
            <h2>
              {results.length} result{results.length === 1 ? '' : 's'} across all projects
            </h2>
            <ExportMenu query={{ q }} disabled={results.length === 0} />
          </div>
          {results.length > 0 ? (
            <SampleList
              samples={results}
              showProject
              onOpen={setEditing}
              onDeleted={() => {
                runSearch();
                loadProjects();
              }}
            />
          ) : (
            <p className="empty">No samples match “{q}”.</p>
          )}
        </section>
      )}

      <section className="saved-section">
        <h2>Projects</h2>
        {projects === null && !error && <p className="empty">Loading…</p>}
        {projects?.length === 0 && (
          <p className="empty">
            No projects yet. <Link to="/score">Score your first sample</Link> or create a project.
          </p>
        )}
        {!wide && projects && projects.length > 0 && (
          <p className="swipe-hint">Tip: swipe a project left to delete it.</p>
        )}
        <ul className="project-grid">
          {projects?.map((p) => {
            const card = (
              <Link to={`/saved/projects/${p.id}`} className="project-card" draggable={false}>
                <span className="project-card__top">
                  <span className="project-card__name">{p.name}</span>
                  {!wide && <ArrowRightIcon />}
                </span>
                {p.description && <span className="project-card__desc">{p.description}</span>}
                <span className="project-card__meta">
                  <span>
                    {p.sample_count ?? 0} sample{p.sample_count === 1 ? '' : 's'}
                  </span>
                  <span>Updated {formatDate(p.last_sample_at || p.created_at)}</span>
                </span>
              </Link>
            );
            return (
              <li key={p.id} className="project-item">
                {wide ? (
                  <>
                    {card}
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger project-item__delete"
                      aria-label={`Delete project ${p.name}`}
                      onClick={() => setProjectToDelete(p)}
                    >
                      <TrashIcon size={18} />
                    </button>
                  </>
                ) : (
                  <SwipeRow onDelete={() => setProjectToDelete(p)} deleteLabel={`project ${p.name}`}>
                    {card}
                  </SwipeRow>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {editing && (
        <SampleEditor
          sample={editing}
          projects={projects ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            runSearch();
            loadProjects();
          }}
          onDeleted={() => {
            setEditing(null);
            runSearch();
            loadProjects();
          }}
        />
      )}

      {projectToDelete && (
        <ConfirmDialog
          title={`Delete project “${projectToDelete.name}”?`}
          confirmLabel="Delete project"
          onClose={() => setProjectToDelete(null)}
          onConfirm={async () => {
            try {
              await deleteProject(projectToDelete.id);
            } catch (e) {
              throw new Error(e instanceof ApiError ? e.message : 'Could not delete the project.');
            }
            loadProjects();
            runSearch();
          }}
        >
          {projectToDelete.sample_count ? (
            <p className="confirm__warning">
              This also deletes its {projectToDelete.sample_count} sample
              {projectToDelete.sample_count === 1 ? '' : 's'} and all their photos.
            </p>
          ) : (
            <p>This project has no samples.</p>
          )}
          <p>This can’t be undone. Export the project first if you need a copy.</p>
        </ConfirmDialog>
      )}

      {creating && (
        <NewProjectDialog
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            loadProjects();
          }}
        />
      )}
    </div>
  );
}
