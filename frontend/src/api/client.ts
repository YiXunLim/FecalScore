/**
 * Everything the app sends to or reads from the Python backend.
 * Every backend address starts with /api (see vite.config.ts for how it is forwarded).
 */

export type Project = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  sample_count?: number;
  last_sample_at?: string | null;
};

export type Sample = {
  id: number;
  project_id: number;
  project_name: string;
  pen: string;
  sample_no: number;
  pig_id: string;
  trial_day: number;
  ai_score: number | null;
  final_score: number;
  edited: boolean;
  label: string; // e.g. "Pen 3 #1"
  description: string;
  model_version: string | null;
  captured_at: string;
  created_at: string;
  modified_at: string | null;
  image_url: string | null;
  crop_url: string | null;
  thumb_url: string | null;
};

/** An error with a message that can be shown to the user. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: BodyInit, json = false): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      body,
      headers: json ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your internet connection and that the backend is running.', 0);
  }
  if (!res.ok) {
    let message = `Something went wrong (${res.status}).`;
    try {
      const data = await res.json();
      if (typeof data.detail === 'string') message = data.detail;
      else if (Array.isArray(data.detail) && data.detail[0]?.msg) message = data.detail[0].msg;
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string) => request<T>('GET', path);

/** Returns true when the backend is running and reachable. */
export async function checkBackend(): Promise<boolean> {
  try {
    const data = await apiGet<{ status: string }>('/health');
    return data.status === 'ok';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- projects

export const listProjects = () => apiGet<Project[]>('/projects');

export const createProject = (name: string, description = '') =>
  request<Project>('POST', '/projects', JSON.stringify({ name, description }), true);

// ---------------------------------------------------------------- samples

export async function nextSampleNumber(projectId: number, pen: string, trialDay: number): Promise<number> {
  const q = new URLSearchParams({ project_id: String(projectId), pen, trial_day: String(trialDay) });
  const data = await apiGet<{ sample_no: number }>(`/samples/next-number?${q}`);
  return data.sample_no;
}

export type NewSample = {
  project_id: number;
  pen: string;
  sample_no: number;
  pig_id: string;
  trial_day: number;
  final_score: number;
  ai_score: number | null;
  description: string;
  captured_at: string;
  image: Blob;
  crop: Blob | null;
};

export function createSample(s: NewSample): Promise<Sample> {
  const form = new FormData();
  form.append('project_id', String(s.project_id));
  form.append('pen', s.pen);
  form.append('sample_no', String(s.sample_no));
  form.append('pig_id', s.pig_id);
  form.append('trial_day', String(s.trial_day));
  form.append('final_score', String(s.final_score));
  if (s.ai_score !== null) form.append('ai_score', String(s.ai_score));
  form.append('description', s.description);
  form.append('captured_at', s.captured_at);
  form.append('image', s.image, 'photo.jpg');
  if (s.crop) form.append('crop', s.crop, 'crop.jpg');
  return request<Sample>('POST', '/samples', form);
}

/** Search box text and filters. Leave a value out to not filter by it. */
export type SampleQuery = {
  projectId?: number;
  q?: string;
  pen?: string;
  trialDay?: string;
  score?: string;
};

function queryString(f: SampleQuery): string {
  const params = new URLSearchParams();
  if (f.projectId !== undefined) params.set('project_id', String(f.projectId));
  if (f.q?.trim()) params.set('q', f.q.trim());
  if (f.pen) params.set('pen', f.pen);
  if (f.trialDay) params.set('trial_day', f.trialDay);
  if (f.score) params.set('score', f.score);
  return params.toString();
}

export const listSamples = (f: SampleQuery = {}) => apiGet<Sample[]>(`/samples?${queryString(f)}`);

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

/** Address that downloads the samples matching these filters. */
export const exportUrl = (format: ExportFormat, f: SampleQuery) =>
  `/api/export?format=${format}&${queryString(f)}`;

export const getProject = (id: number) => apiGet<Project>(`/projects/${id}`);

/** Deletes a project and ALL its samples and photos. */
export const deleteProject = (id: number) =>
  request<{ deleted_samples: number }>('DELETE', `/projects/${id}`);

export type SampleChanges = Partial<
  Pick<Sample, 'project_id' | 'pen' | 'sample_no' | 'pig_id' | 'trial_day' | 'final_score' | 'description'>
>;

export const updateSample = (id: number, changes: SampleChanges) =>
  request<Sample>('PATCH', `/samples/${id}`, JSON.stringify(changes), true);

export const deleteSample = (id: number) => request<void>('DELETE', `/samples/${id}`);
