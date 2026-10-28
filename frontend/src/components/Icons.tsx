/** Small line icons used across the app. They take the current text color. */

type IconProps = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export function CameraIcon({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 7h3l2-3h8l2 3h3v13H3z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function HomeIcon({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

export function FolderIcon({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function BackIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function CheckIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2.4}>
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export function RetakeIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

export function DownloadIcon({ size = 22 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function SearchIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </svg>
  );
}

export function PlusIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2.4}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function EditIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
    </svg>
  );
}

export function TrashIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
