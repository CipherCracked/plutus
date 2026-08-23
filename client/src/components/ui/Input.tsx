import { clsx } from "clsx"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
}

export function Input({ label, icon, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary">
            {icon}
          </div>
        )}
        <input
          className={clsx(
            "sharp-sm w-full bg-surface border border-border px-3 py-1.5 text-sm text-foreground font-mono",
            "placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent",
            "transition-base",
            icon && "pl-8",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  )
}
