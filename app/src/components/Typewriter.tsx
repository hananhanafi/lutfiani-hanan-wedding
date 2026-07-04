"use client";

import { useEffect, useState } from "react";

interface Props {
  text: string;
  /** ms before this line starts typing */
  startDelay?: number;
  /** ms per character */
  speed?: number;
  /** show a blinking caret while/after typing */
  caret?: boolean;
  /** keep the caret blinking after the text is done (else it fades out) */
  keepCaret?: boolean;
  className?: string;
  /** called once this line finishes typing */
  onDone?: () => void;
}

/**
 * Types out `text` one character at a time with a blinking caret.
 * Respects prefers-reduced-motion (renders the full text immediately).
 */
export default function Typewriter({
  text,
  startDelay = 0,
  speed = 90,
  caret = true,
  keepCaret = false,
  className,
  onDone,
}: Props) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Honor reduced-motion: reveal instantly.
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setCount(text.length);
      setDone(true);
      onDone?.();
      return;
    }

    let charTimer: ReturnType<typeof setTimeout>;
    const startTimer = setTimeout(() => {
      let i = 0;
      const tick = () => {
        i += 1;
        setCount(i);
        if (i < text.length) {
          charTimer = setTimeout(tick, speed);
        } else {
          setDone(true);
          onDone?.();
        }
      };
      tick();
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(charTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, startDelay, speed]);

  const showCaret = caret && (!done || keepCaret);

  return (
    <span className={className}>
      {text.slice(0, count)}
      {showCaret && (
        <span
          aria-hidden="true"
          className="typewriter-caret"
        >
          |
        </span>
      )}
    </span>
  );
}
