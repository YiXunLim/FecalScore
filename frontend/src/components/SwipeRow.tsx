import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { TrashIcon } from './Icons';
import './SwipeRow.css';

type Props = {
  children: ReactNode;
  /** Called when the revealed Delete button is tapped (show a confirmation there). */
  onDelete: () => void;
  deleteLabel: string;
};

const ACTION_WIDTH = 96; // width of the red Delete button, in px
const OPEN_AT = 48; // swipe further than this and the row stays open

/**
 * Swipe a row left to reveal a red Delete button behind it.
 * Works with a finger or a mouse drag. Up/down scrolling still works normally.
 */
export default function SwipeRow({ children, onDelete, deleteLabel }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; offset: number } | null>(null);
  const mode = useRef<'idle' | 'swiping' | 'scrolling'>('idle');
  const moved = useRef(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Close when tapping anywhere else.
  useEffect(() => {
    if (offset === 0) return;
    const onDown = (e: PointerEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) setOffset(0);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [offset]);

  function onPointerDown(e: ReactPointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, offset };
    mode.current = 'idle';
    moved.current = false;
  }

  function onPointerMove(e: ReactPointerEvent) {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (mode.current === 'idle') {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      mode.current = Math.abs(dx) > Math.abs(dy) ? 'swiping' : 'scrolling';
      if (mode.current === 'swiping') {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(true);
      }
    }
    if (mode.current !== 'swiping') return;
    moved.current = true;
    setOffset(Math.max(-ACTION_WIDTH - 24, Math.min(0, s.offset + dx)));
  }

  function onPointerEnd() {
    if (mode.current === 'swiping') {
      setOffset((o) => (o < -OPEN_AT ? -ACTION_WIDTH : 0));
    }
    setDragging(false);
    start.current = null;
    mode.current = 'idle';
  }

  return (
    <div className="swipe" ref={rowRef}>
      <button
        type="button"
        className="swipe__action"
        onClick={() => {
          setOffset(0);
          onDelete();
        }}
        tabIndex={offset === 0 ? -1 : 0}
        aria-hidden={offset === 0}
      >
        <TrashIcon size={22} />
        Delete
        <span className="visually-hidden"> {deleteLabel}</span>
      </button>
      <div
        className={`swipe__content${dragging ? ' is-dragging' : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={(e) => {
          // A swipe (or a tap that closes an open row) must not also open the item.
          if (moved.current || offset !== 0) {
            e.preventDefault();
            e.stopPropagation();
            if (!moved.current) setOffset(0);
            moved.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
