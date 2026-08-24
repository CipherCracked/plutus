import { Badge } from "./Badge"

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase()

  const variant =
    normalized === "SUCCESS"
      ? "success"
      : normalized === "FAILED"
        ? "failed"
        : "pending"

  return <Badge variant={variant}>{normalized}</Badge>
}
