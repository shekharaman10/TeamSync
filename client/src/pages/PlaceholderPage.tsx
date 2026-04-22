type Props = { title: string };

export function PlaceholderPage({ title }: Props) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        <p className="mt-1 text-xs text-zinc-600">Coming soon</p>
      </div>
    </div>
  );
}
