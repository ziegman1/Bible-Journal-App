/**
 * Simple illustrated-style icons (Image 2 spirit): chunky strokes, pastel fills, charcoal outline.
 * Sized for embedding in pathway nodes; viewBox 0 0 24 24 unless noted.
 */
import type { SVGProps } from "react";

const ink = "#1e293b";

export function IconSoap(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M5 6c0-1 1-2 2.5-2h9C18 4 19 5 19 6v11c0 1.5-1 2.5-2.5 2.5h-7C8 19.5 7 18.5 7 17V6Z"
        fill="#e0f2fe"
        stroke={ink}
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
      <path d="M9 8h6M9 11h4" stroke={ink} strokeWidth={0.9} strokeLinecap="round" />
      <path
        d="M16 5.5c1.5 0 2.5 1 2.5 2.5M17 4l1.2-1.2M19 6l1.3-.5M18 8l1.5.3"
        stroke="#0ea5e9"
        strokeWidth={0.85}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconPray(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      {/* Praying hands — simple illustrated pair */}
      <path
        d="M9 18V11.5c0-1 .8-1.8 1.8-1.8.5 0 1 .2 1.4.5M15 18V11.5c0-1-.8-1.8-1.8-1.8-.5 0-1 .2-1.4.5"
        stroke={ink}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 11 7 8.5c-.4-.6-.2-1.4.4-1.8.6-.4 1.4-.2 1.8.4l1.2 2M15.5 11 17 8.5c.4-.6.2-1.4-.4-1.8-.6-.4-1.4-.2-1.8.4l-1.2 2"
        stroke={ink}
        strokeWidth={1.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 9.5c.3-.8 1-1.3 1.8-1.3s1.5.5 1.8 1.3"
        fill="#ecfdf5"
        stroke={ink}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <ellipse cx="12" cy="16.5" rx="2.2" ry="1.2" fill="#bbf7d0" stroke={ink} strokeWidth={0.8} />
    </svg>
  );
}

export function IconShareMap(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M4 17V6c0-1 .8-2 2-2h12c1.2 0 2 1 2 2v11c0 1-.8 2-2 2H6c-1.2 0-2-1-2-2Z"
        fill="#fff7ed"
        stroke={ink}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path d="M7 14l3-3 2 2 4-5" stroke="#f97316" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="8" r="1.6" fill="#f97316" stroke={ink} strokeWidth={0.6} />
    </svg>
  );
}

export function IconChat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M6 18c0-1.5 1-2.5 2.5-2.5H17c1.2 0 2.2-.8 2.5-2V8c0-1.5-1-2.5-2.5-2.5H8.5C7 5.5 6 6.5 6 8v10Z"
        fill="#faf5ff"
        stroke={ink}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path d="M8 9h6M8 12h4" stroke={ink} strokeWidth={0.75} strokeLinecap="round" />
      <circle cx="17" cy="6" r="2" fill="#fde68a" stroke={ink} strokeWidth={0.7} />
      <path d="M16 13c.8.4 1.8.6 2.8.5" stroke={ink} strokeWidth={0.7} strokeLinecap="round" />
      <circle cx="19.5" cy="12.5" r="1.2" fill="#e9d5ff" stroke={ink} strokeWidth={0.5} />
    </svg>
  );
}

export function IconMePerson(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx="12" cy="8.5" r="3.2" fill="#bfdbfe" stroke={ink} strokeWidth={1.1} />
      <path
        d="M6.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5"
        fill="#dbeafe"
        stroke={ink}
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      <path
        d="M9 4.5c.8-.6 1.8-1 3-1s2.2.4 3 1"
        fill="#fbbf24"
        stroke={ink}
        strokeWidth={0.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconHandshake(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M5 12.5 7 11l2.5 1 2-2 3 2.5 2.5-1L19 13l-1.5 3-3.5 1.5-4-1-2 2.5-3-1.5L5 12.5Z"
        fill="#f0fdf4"
        stroke={ink}
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
      <path d="M8 10.5c.5-.8 1.5-1.2 2.5-.8" stroke="#16a34a" strokeWidth={0.7} strokeLinecap="round" />
    </svg>
  );
}

export function IconBinoculars(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect x="4" y="9" width="6.5" height="7" rx="2" fill="#dbeafe" stroke={ink} strokeWidth={1.1} />
      <rect x="13.5" y="9" width="6.5" height="7" rx="2" fill="#dbeafe" stroke={ink} strokeWidth={1.1} />
      <path d="M10.5 12h3M7 9V7M17 9V7" stroke={ink} strokeWidth={1} strokeLinecap="round" />
      <circle cx="7.25" cy="12.5" r="1.8" fill="#93c5fd" stroke={ink} strokeWidth={0.6} />
      <circle cx="16.75" cy="12.5" r="1.8" fill="#93c5fd" stroke={ink} strokeWidth={0.6} />
    </svg>
  );
}

export function IconFamily(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 28 20" fill="none" aria-hidden {...props}>
      <circle cx="6" cy="6" r="2.2" fill="#bbf7d0" stroke={ink} strokeWidth={0.9} />
      <circle cx="14" cy="5" r="2.4" fill="#86efac" stroke={ink} strokeWidth={0.9} />
      <circle cx="22" cy="6" r="2.2" fill="#bbf7d0" stroke={ink} strokeWidth={0.9} />
      <path d="M3 17c0-2 1.5-3.5 3-3.5M11 17c0-2.2 1.8-4 4-4s4 1.8 4 4M19 17c0-2 1.5-3.5 3-3.5" stroke={ink} strokeWidth={0.9} strokeLinecap="round" />
    </svg>
  );
}
