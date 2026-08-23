import { clsx } from "clsx"

type BadgeVariant = "default" | "success" | "failed" | "pending" | "gold"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses = {
  default: "bg-surface-hover text-text-secondary",
  success: "bg-success/10 text-success",
  failed: "bg-failed/10 text-failed",
  pending: "bg-pending/10 text-pending",
  gold: "bg-accent/10 text-accent",
}

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "sharp-sm inline-flex items-center px-2 py-0.5 text-xs font-mono",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
