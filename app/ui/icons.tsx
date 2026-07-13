type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

function Icon({
  children,
  size = 24,
  className,
  strokeWidth = 1.8,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}>
        {children}
      </g>
    </svg>
  );
}

export function CoffeeCupIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 8.5h10.8v6.1a3.9 3.9 0 0 1-3.9 3.9H9.4a3.9 3.9 0 0 1-3.9-3.9V8.5Z" />
      <path d="M16.3 10.2h1.4a2.8 2.8 0 0 1 0 5.6h-1.7M4 19.2h14.6M8 5.7c-.8-.8-.8-1.7 0-2.5M11.2 5.7c-.8-.8-.8-1.7 0-2.5" />
    </Icon>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4.5h14v15H5z" />
      <path d="M8 8h8M8 11.5h8M8 15h4" />
      <path d="M7.2 4.5v1M10.2 4.5v1M13.2 4.5v1M16.2 4.5v1M7.2 18.5v1M10.2 18.5v1M13.2 18.5v1M16.2 18.5v1" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </Icon>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 18 18 6M9 6h9v9" />
    </Icon>
  );
}

export function ScanIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.5 3.5H5a1.5 1.5 0 0 0-1.5 1.5v2.5M16.5 3.5H19A1.5 1.5 0 0 1 20.5 5v2.5M7.5 20.5H5A1.5 1.5 0 0 1 3.5 19v-2.5M16.5 20.5H19a1.5 1.5 0 0 0 1.5-1.5v-2.5" />
      <path d="M7 12h10" />
    </Icon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </Icon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M14 8l4 4-4 4M18 12H9" />
    </Icon>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3ZM19 16l.5 2.5L22 19l-2.5.5L19 22l-.5-2.5L16 19l2.5-.5L19 16Z" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect height="9" rx="1.5" width="13" x="5.5" y="10" />
      <path d="M8.5 10V7.7a3.5 3.5 0 0 1 7 0V10M12 13.5v2" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.5 4.2 4.2L19 7" />
    </Icon>
  );
}

export function GoogleIcon({ size = 24, className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} height={size} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg">
      <path d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36Z" fill="#4285F4" />
      <path d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.06v2.58A10 10 0 0 0 12 22Z" fill="#34A853" />
      <path d="M6.41 13.9a6 6 0 0 1 0-3.8V7.5H3.06a10 10 0 0 0 0 8.98l3.35-2.58Z" fill="#FBBC05" />
      <path d="M12 5.98c1.47 0 2.79.5 3.82 1.5l2.87-2.88A9.97 9.97 0 0 0 3.06 7.51l3.35 2.58C7.2 7.74 9.4 5.98 12 5.98Z" fill="#EA4335" />
    </svg>
  );
}
