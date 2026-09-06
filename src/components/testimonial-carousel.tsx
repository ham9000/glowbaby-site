"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ExampleTestimonial } from "@/content/site";

type TestimonialCarouselProps = {
  quotes: readonly [ExampleTestimonial, ...ExampleTestimonial[]];
};

function subscribeToEnvironment(onChange: () => void) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  motion.addEventListener("change", onChange);
  document.addEventListener("visibilitychange", onChange);

  return () => {
    motion.removeEventListener("change", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function getEnvironment() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "reduced";
  }

  return document.hidden ? "hidden" : "ready";
}

function getServerEnvironment() {
  return "loading";
}

export function TestimonialCarousel({ quotes }: TestimonialCarouselProps) {
  const headingId = useId();
  const carouselRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const environment = useSyncExternalStore(
    subscribeToEnvironment,
    getEnvironment,
    getServerEnvironment,
  );
  const hasMultipleQuotes = quotes.length > 1;
  const isRotating =
    hasMultipleQuotes &&
    environment === "ready" &&
    isInView &&
    !isPaused &&
    !isHovered &&
    !isFocused;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.25 },
    );

    if (carouselRef.current) {
      observer.observe(carouselRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isRotating) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % quotes.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [isRotating, quotes.length]);

  function selectQuote(index: number) {
    setIsPaused(true);
    setActiveIndex(index);
  }

  const arrowClassName =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/20 bg-white text-xl text-ink transition-colors hover:bg-sage";

  return (
    <section
      ref={carouselRef}
      aria-roledescription="carousel"
      aria-labelledby={headingId}
      className="grid gap-8 rounded-[2rem] border border-ink/10 bg-sage p-6 sm:p-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsFocused(false);
        }
      }}
    >
      <div>
        <p className="eyebrow">Testimonial demo</p>
        <h3 id={headingId} className="mt-4 font-display text-3xl text-ink sm:text-4xl">
          A place for future family stories.
        </h3>
        <p className="mt-5 text-sm leading-6 text-ink/75">
          An example of how family feedback could look here.
          These quotes are fictional examples, not actual customer reviews.
        </p>
      </div>

      <div className="min-w-0">
        <div className="grid" aria-live={isRotating ? "off" : "polite"} aria-atomic="true">
          {quotes.map((quote, index) => (
            <figure
              key={quote.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${quotes.length}`}
              aria-hidden={index !== activeIndex}
              className={`col-start-1 row-start-1 ${index === activeIndex ? "visible" : "invisible"}`}
            >
              <blockquote className="text-[clamp(1.4rem,2.5vw,2rem)] font-semibold leading-relaxed tracking-tight text-ink">
                <p>&ldquo;{quote.quote}&rdquo;</p>
              </blockquote>
              <figcaption className="mt-6">
                <p className="text-sm font-bold text-ink">{quote.perspective}</p>
                <p className="mt-1 text-xs leading-5 text-ink/70">
                  Illustrative quote, not customer feedback.
                </p>
              </figcaption>
            </figure>
          ))}
        </div>

        {hasMultipleQuotes ? (
          <div className="mt-8 border-t border-ink/15 pt-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  aria-label="Previous example quote"
                  className={arrowClassName}
                  onClick={() => selectQuote((activeIndex - 1 + quotes.length) % quotes.length)}
                >
                  <span aria-hidden="true">&larr;</span>
                </button>
                <div className="flex gap-1" role="group" aria-label="Choose an example quote">
                  {quotes.map((quote, index) => (
                    <button
                      key={quote.id}
                      type="button"
                      aria-label={`Show example ${index + 1}: ${quote.perspective}`}
                      aria-current={index === activeIndex ? "true" : undefined}
                      className="flex h-11 w-8 items-center justify-center rounded-full"
                      onClick={() => selectQuote(index)}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 rounded-full ${index === activeIndex ? "bg-violet" : "border border-ink/40 bg-white"}`}
                      />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Next example quote"
                  className={arrowClassName}
                  onClick={() => selectQuote((activeIndex + 1) % quotes.length)}
                >
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
              {environment !== "reduced" ? (
                <button
                  type="button"
                  className="button button-light shrink-0"
                  onClick={() => setIsPaused((paused) => !paused)}
                  aria-label={isPaused ? "Resume automatic quote rotation" : "Pause automatic quote rotation"}
                >
                  {isPaused ? "Play" : "Pause"}
                </button>
              ) : null}
            </div>
            <p className="mt-3 min-h-10 text-center text-xs leading-5 text-ink/70 sm:text-left">
              {environment === "reduced"
                ? "Automatic rotation is off for reduced motion. Use the arrows to explore."
                : isPaused
                  ? "Automatic rotation paused. Press Play to resume."
                  : "Swaps every 8 seconds. Pauses while you hover or focus here."}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
