type Props = { title: string };

export function EpicBadge({ title }: Props) {
  return (
    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
      {title}
    </span>
  );
}
