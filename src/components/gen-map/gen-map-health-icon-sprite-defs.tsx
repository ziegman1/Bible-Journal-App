"use client";

/**
 * Inline SVG sprite for Gen Map health icons. Each `<symbol>` is toggled via `<use href="#id">`
 * with `opacity` / `text-foreground` on the host `<svg>` (see `gen-map-health-icon-grid.tsx`).
 */
export function GenMapHealthIconSpriteDefs() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute size-0 overflow-hidden"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <symbol id="gen-map-health-gospel" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.45}>
            <path d="M7.5 4.5 L9.5 1.6 L12 3.5 L14.5 1.6 L16.5 4.5" />
            <path d="M7.5 8.2V16.5M7.5 16.5L6.2 15M7.5 16.5L8.8 15" strokeWidth={1.35} />
            <path d="M12 7.5V17.2M9 12.5H15" strokeWidth={1.35} />
            <path d="M16.5 16.5V8.2M16.5 8.2L15.2 9.7M16.5 8.2L17.8 9.7" strokeWidth={1.35} />
          </g>
        </symbol>

        <symbol id="gen-map-health-repent" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.5 8C5.5 6 18.5 5.5 19.5 8C20.5 10.5 20.5 13 19.5 15C18 17.5 9 17.5 7 15.5" strokeWidth={1.85} />
            <path d="M7 15.5L4.2 15.5L5.6 13.8M4.2 15.5L5.6 17.2" strokeWidth={1.85} />
          </g>
        </symbol>

        <symbol id="gen-map-health-baptism" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.45}>
            <path d="M3.5 7.5C5.5 5.5 7.5 9.5 9.5 7.5S13.5 5.5 15.5 7.5 18.5 9.5 20.5 7.5" />
            <path d="M3.5 12C5.5 10 7.5 14 9.5 12S13.5 10 15.5 12 18.5 14 20.5 12" />
            <path d="M3.5 16.5C5.5 14.5 7.5 18.5 9.5 16.5S13.5 14.5 15.5 16.5 18.5 18.5 20.5 16.5" />
          </g>
        </symbol>

        <symbol id="gen-map-health-holy-spirit" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth={1.45}>
            <path d="M12 19.5C9 18 7 15 7.5 12C8 9.5 10.5 8 11.5 5.5C12 8 14 9.5 14.5 12C15 15 13 18 12 19.5Z" />
            <path d="M12 17.8C10.5 17 9.5 15.2 9.8 13.2C10 11.5 11.2 10.5 12 8.8C12.8 10.5 14 11.5 14.2 13.2C14.5 15.2 13.5 17 12 17.8Z" />
          </g>
        </symbol>

        <symbol id="gen-map-health-gods-word" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.2 6.8H18.8V15.4Q18.8 17.2 12 17.85Q5.2 17.2 5.2 15.4V6.8Z" strokeWidth={1.75} />
            <path d="M12 6.8V17.85" strokeWidth={1.75} />
            <path d="M6.8 9.4h3.4M6.7 11.7h3.5M7 14h2.9" strokeWidth={1.2} />
            <path d="M13.8 9.4h3.4M13.7 11.7h3.5M14 14h2.9" strokeWidth={1.2} />
          </g>
        </symbol>

        <symbol id="gen-map-health-love" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth={1.45}>
            <path d="M12 18.8C8.5 16.2 5.5 13.5 5.5 10.2C5.5 7.8 7.2 6.2 9.2 6.2C10.4 6.2 11.4 6.8 12 7.8C12.6 6.8 13.6 6.2 14.8 6.2C16.8 6.2 18.5 7.8 18.5 10.2C18.5 13.5 15.5 16.2 12 18.8Z" />
          </g>
        </symbol>

        <symbol id="gen-map-health-lords-supper" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M13.4 10.6Q16.5 8.1 19.6 10.6L18.9 13.7Q16.5 15.3 14.1 13.7L13.4 10.6Z"
              strokeWidth={1.72}
            />
            <path d="M16.5 13.7V16.9" strokeWidth={1.72} />
            <path d="M13.8 17.4H19.2Q16.5 18.1 13.8 17.4" strokeWidth={1.72} />
            <ellipse cx="9.55" cy="12.35" rx="3.65" ry="4.35" strokeWidth={1.72} />
            <path d="M7.1 10.35h4.9M6.9 12.35h5.3M7.05 14.25h5" strokeWidth={1.2} />
          </g>
        </symbol>

        <symbol id="gen-map-health-prayer" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="15.2" cy="7.4" r="2.15" strokeWidth={1.45} />
            <path d="M15.2 9.5V14.5" strokeWidth={1.45} />
            <path d="M15 11.6Q17.1 9.7 19.3 7.9" strokeWidth={1.45} />
            <path d="M15.2 14.5L17.7 16.9L11.6 18.95" strokeWidth={1.45} />
          </g>
        </symbol>

        <symbol id="gen-map-health-signs" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinejoin="round">
            <path d="M10.15 5.4L13.85 5.4L12.92 14.95L11.08 14.95Z" strokeWidth={1.55} />
            <ellipse cx="12" cy="18.55" rx="1.7" ry="1.05" strokeWidth={1.55} />
          </g>
        </symbol>

        <symbol id="gen-map-health-giving" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3.85V20.15" strokeWidth={1.55} />
            <path
              d="M14.35 5.15C10.9 4.65 7.05 7.05 7.15 9.35C7.25 11.25 10.15 12.15 12 12.38C14.35 12.65 17.05 14.05 16.9 16.55C16.75 19.05 13.15 20.45 9.65 19.35"
              strokeWidth={1.55}
            />
          </g>
        </symbol>

        <symbol id="gen-map-health-worship" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.2 4.6L11.1 6.1M12 3.35V5.5M13.8 4.6L12.9 6.1" strokeWidth={1.22} />
            <circle cx="12" cy="8.55" r="2" strokeWidth={1.48} />
            <path d="M12 10.5V17.2" strokeWidth={1.48} />
            <path d="M12 10.8L7.2 4.9M12 10.8L16.8 4.9" strokeWidth={1.48} />
          </g>
        </symbol>

        <symbol id="gen-map-health-multiplication" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M12 5.15L7.95 7.95M12 5.15L16.05 7.95M7.95 10.35L5.55 15M7.95 10.35L10.35 15M16.05 10.35L13.65 15M16.05 10.35L18.45 15"
              strokeWidth={1.28}
            />
            <circle cx="12" cy="3.95" r="1.14" strokeWidth={1.28} />
            <circle cx="7.95" cy="9.15" r="1.14" strokeWidth={1.28} />
            <circle cx="16.05" cy="9.15" r="1.14" strokeWidth={1.28} />
            <circle cx="5.55" cy="16.15" r="1.14" strokeWidth={1.28} />
            <circle cx="10.35" cy="16.15" r="1.14" strokeWidth={1.28} />
            <circle cx="13.65" cy="16.15" r="1.14" strokeWidth={1.28} />
            <circle cx="18.45" cy="16.15" r="1.14" strokeWidth={1.28} />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}
