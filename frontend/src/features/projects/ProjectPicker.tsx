import { useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ApiError, createProject, type Project } from '../../api/client';
import { CheckIcon, PlusIcon, SearchIcon } from '../../components/Icons';
import './ProjectPicker.css';

type Props = {
  projects: Project[];
  value: number | null;
  onChange: (projectId: number) => void;
  onCreated: (project: Project) => void;
  invalid?: boolean;
};

/**
 * Project field: a button showing the chosen project, plus "+ New".
 * Both open a sheet with a search box, the project list, and "Add new project".
 */
export default function ProjectPicker({ projects, value, onChange, onCreated, invalid }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newError, setNewError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const selected = projects.find((p) => p.id === value) ?? null;
  const q = query.trim().toLowerCase();
  const filtered = q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects;

  function open(startAdding: boolean) {
    setQuery('');
    setAdding(startAdding);
    setNewName('');
    setNewError(null);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function pick(id: number) {
    onChange(id);
    close();
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setNewError('Enter a project name.');
      return;
    }
    setCreating(true);
    setNewError(null);
    try {
      const project = await createProject(name);
      onCreated(project);
      onChange(project.id);
      setAdding(false);
      close();
    } catch (err) {
      setNewError(err instanceof ApiError ? err.message : 'Could not create the project.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="field">
      <span className="field__label" id="project-label">
        Project
      </span>
      <div className="project-field">
        <button
          type="button"
          className={`project-field__select${invalid ? ' is-invalid' : ''}`}
          onClick={() => open(false)}
          aria-labelledby="project-label"
          aria-haspopup="dialog"
        >
          <span className={selected ? '' : 'project-field__placeholder'}>
            {selected ? selected.name : 'Choose a project'}
          </span>
          <SearchIcon size={20} />
        </button>
        <button type="button" className="project-field__new" onClick={() => open(true)}>
          <PlusIcon size={18} />
          New
        </button>
      </div>

      {/* The sheet is placed at the end of the page (portal) so its form is never inside another form. */}
      {createPortal(
      <dialog
        ref={dialogRef}
        className="sheet"
        aria-label="Choose project"
        onClick={(e) => {
          if (e.target === dialogRef.current) close(); // tap outside the sheet closes it
        }}
      >
        <div className="sheet__body">
          <span className="sheet__handle" aria-hidden="true" />
          <div className="sheet__head">
            <h2>Choose project</h2>
            <button type="button" className="sheet__done" onClick={close}>
              Done
            </button>
          </div>

          <label className="search-box">
            <SearchIcon size={20} />
            <input
              type="search"
              placeholder="Search projects"
              aria-label="Search projects"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <ul className="sheet__list">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`sheet__item${p.id === value ? ' is-selected' : ''}`}
                  aria-pressed={p.id === value}
                  onClick={() => pick(p.id)}
                >
                  <span className="sheet__item-text">
                    <span className="sheet__item-name">{p.name}</span>
                    {p.sample_count !== undefined && (
                      <span className="sheet__item-meta">
                        {p.sample_count} sample{p.sample_count === 1 ? '' : 's'}
                      </span>
                    )}
                  </span>
                  {p.id === value && <CheckIcon size={22} />}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="sheet__empty">
                {projects.length === 0 ? 'No projects yet. Add the first one below.' : 'No project matches. Add it as a new project below.'}
              </li>
            )}
          </ul>

          {adding ? (
            <form className="sheet__add" onSubmit={handleCreate}>
              <label className="field">
                <span className="field__label">New project name</span>
                <input
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Nursery Trial C"
                  autoFocus
                />
              </label>
              {newError && (
                <p className="field__error" role="alert">
                  {newError}
                </p>
              )}
              <div className="sheet__add-actions">
                <button type="button" className="btn btn-outline" onClick={() => setAdding(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create & use'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="sheet__add-btn"
              onClick={() => {
                setNewName(query.trim()); // start with whatever was typed in the search box
                setAdding(true);
              }}
            >
              <PlusIcon size={20} />
              Add new project
            </button>
          )}
        </div>
      </dialog>,
        document.body,
      )}
    </div>
  );
}
