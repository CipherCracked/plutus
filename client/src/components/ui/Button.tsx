import { clsx } from "clsx"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses = {
  primary:
    "bg-accent text-background font-mono font-semibold tracking-wider hover:bg-accent-hover transition-base",
  secondary:
    "glass border-glass-border text-foreground hover:bg-surface-hover transition-base",
  ghost:
    "text-text-secondary hover:text-foreground hover:bg-surface-hover transition-base",
  danger:
    "bg-failed/10 text-failed border border-failed/30 hover:bg-failed/20 transition-base",
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-sm",
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "sharp inline-flex items-center justify-center gap-2 font-sans",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
