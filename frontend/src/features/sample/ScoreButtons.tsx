type Props = {
  value: number | null;
  aiScore: number | null;
  onChange: (score: number) => void;
  invalid?: boolean;
};

/** Four big buttons (0–3). The AI's suggestion is pre-selected; tapping another changes it. */
export default function ScoreButtons({ value, aiScore, onChange, invalid }: Props) {
  let note: string;
  if (aiScore === null) {
    note = 'Tap the score you see. (The AI suggestion will appear here once the model is connected.)';
  } else if (value === aiScore) {
    note = `AI predicted ${aiScore}. Tap another number if it looks wrong.`;
  } else {
    note = `Changed from AI prediction (${aiScore}) to ${value}. Both are saved.`;
  }

  return (
    <fieldset className="score-field">
      <legend className="field__label">Fecal score</legend>
      <div className={`score-buttons${invalid ? ' is-invalid-group' : ''}`}>
        {[0, 1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            className={`score-button${value === n ? ' is-selected' : ''}`}
            aria-pressed={value === n}
            onClick={() => onChange(n)}
          >
            {n}
            {aiScore === n && <span className="score-button__ai">AI</span>}
          </button>
        ))}
      </div>
      <span className="field__hint">{note}</span>
    </fieldset>
  );
}
