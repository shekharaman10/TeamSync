type Props = { className?: string };

export function Skeleton({ className = "" }: Props) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-zinc-800 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/5 bg-zinc-800/40 p-5">
      <Skeleton className="mb-3 h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr aria-hidden="true">
      <td className="px-6 py-3.5"><Skeleton className="h-3.5 w-56" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-16" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-6 w-6 rounded-full" /></td>
    </tr>
  );
}
