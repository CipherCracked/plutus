import { clsx } from "clsx"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  active?: boolean
}

export function Card({
  glass = true,
  active = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "sharp-sm bg-surface transition-base",
        "border border-border",
        "shadow",
        active && "ring-1 ring-accent",
        glass && "glass",
        !glass && "bg-surface",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("px-4 py-3 border-b border-border font-mono", className)}
    >
      {children}
    </div>
  )
}

export function CardContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("px-4 py-3", className)}>{children}</div>
  )
}
