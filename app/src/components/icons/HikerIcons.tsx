import type { ReactNode, SVGProps } from 'react';

/**
 * Custom hiker icons from the FR-19 design system (design/2026-10-redesign/design-system,
 * assets/Icons + HB.icons in bundle.js), drawn on Lucide's 24px grid with stroke 1.75 and
 * round caps so they sit next to lucide-react icons. They draw in currentColor.
 */
type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number };

function Svg({ size = 18, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Worn flag / Worn weight. */
export function BootIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6.5 3h5.5v7l4.6 1.6A4.6 4.6 0 0 1 20 16v1H5.5L6.5 3z" />
      <path d="M4.5 17H20v2a1.5 1.5 0 0 1-1.5 1.5h-12.5A1.5 1.5 0 0 1 4.5 19z" />
      <path d="M12 6H9.5" />
      <path d="M12 8.8H9.5" />
    </Svg>
  );
}

/** "Used in gearlists" badge and the 3-way dialog title. */
export function CarabinerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <g transform="rotate(40 12 12)">
        <path d="M12 2.5a4.5 4.5 0 0 1 4.5 4.5v6.2" />
        <path d="M16.5 16.6V17a4.5 4.5 0 0 1-9 0V7A4.5 4.5 0 0 1 12 2.5" />
        <path d="M14 7.5l2.5 9.5" />
      </g>
    </Svg>
  );
}

/** Worn weight beside the backpack chart. */
export function HikerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="4" r="1.8" />
      <path d="M11 7.5l-1.5 6 2.5 2.5V21" />
      <path d="M9.5 13.5L8 21" />
      <path d="M11 7.5l3 2.5 2.5.5" />
      <path d="M11 7.5L8.5 7a2 2 0 0 0-2 1.6L6 12l3 .8" />
      <path d="M17.5 8.5L19 21" />
    </Svg>
  );
}

/** The app mark: backpack with a peak (multi-colour, from the design tokens). */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <path d="M12 7.5V6a4 4 0 0 1 8 0v1.5" fill="none" stroke="var(--ink)" strokeWidth={2.2} strokeLinecap="round" />
      <rect x="6" y="7" width="20" height="23" rx="7" fill="var(--accent)" />
      <path d="M6 14c3 1.6 6.5 2.3 10 2.3s7-.7 10-2.3" fill="none" stroke="var(--ink)" strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
      <path d="M9.5 26.5l4.2-5.6 2.3 2.7 2.3-3.4 4.2 6.3z" fill="var(--surface)" />
      <circle cx="20.5" cy="19.8" r="1.3" fill="var(--sun)" />
    </svg>
  );
}
