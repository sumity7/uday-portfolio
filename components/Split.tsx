type Props = { text: string; className?: string };

/** Splits text into masked characters, keeping words together so lines wrap naturally. */
export function SplitChars({ text, className }: Props) {
  const words = text.split(' ');
  return (
    <span className={`split ${className ?? ''}`}>
      <span className="sr-only">{text}</span>
      {words.map((word, wi) => (
        <span className="split-word" key={wi} aria-hidden="true">
          {Array.from(word).map((ch, ci) => (
            <span className="split-mask" key={ci}>
              <span className="char">{ch}</span>
            </span>
          ))}
          {wi < words.length - 1 && <span className="split-space"> </span>}
        </span>
      ))}
    </span>
  );
}

/** Splits text into words for scroll-scrubbed highlighting. */
export function SplitWords({ text }: Props) {
  return (
    <>
      <span className="sr-only">{text}</span>
      {text.split(' ').map((w, i) => (
        <span className="word" aria-hidden="true" key={i}>
          {w}{' '}
        </span>
      ))}
    </>
  );
}
