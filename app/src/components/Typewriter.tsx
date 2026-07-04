"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  /** ms before this line starts typing (after it begins) */
  startDelay?: number;
  /** ms per character */
  speed?: number;
  /** show a blinking caret while/after typing */
  caret?: boolean;
  /** keep the caret blinking after the text is done (else it fades out) */
  keepCaret?: boolean;
  /** wait until the element scrolls into view before typing */
  startOnView?: boolean;
  className?: string;
  /** called once this line finishes typing */
  onDone?: () => void;
}

/**
 * Types out `text` one character at a time with a blinking caret.
 * Respects prefers-reduced-motion (renders the full text immediately).
 * With `startOnView`, typing begins when the element enters the viewport.
 */
export default function Typewriter({
  text,
  startDelay = 0,
  speed = 90,
  caret = true,
  keepCaret = false,
  startOnView = false,
  className,
  onDone,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
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

    const timers: ReturnType<typeof setTimeout>[] = [];
    let started = false;

    const begin = () => {
      if (started) return;
      started = true;
      timers.push(
        setTimeout(() => {
          let i = 0;
          const tick = () => {
            i += 1;
            setCount(i);
            if (i < text.length) {
              timers.push(setTimeout(tick, speed));
            } else {
              setDone(true);
              onDone?.();
            }
          };
          tick();
        }, startDelay)
      );
    };

    let io: IntersectionObserver | undefined;
    if (startOnView && ref.current) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            begin();
            io?.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      io.observe(ref.current);
    } else {
      begin();
    }

    return () => {
      io?.disconnect();
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, startDelay, speed, startOnView]);

  const showCaret = caret && (!done || keepCaret);

  return (
    <span ref={ref} className={className}>
      {text.slice(0, count)}
      {showCaret && (
        <span aria-hidden="true" className="typewriter-caret">
          |
        </span>
      )}
    </span>
  );
}
