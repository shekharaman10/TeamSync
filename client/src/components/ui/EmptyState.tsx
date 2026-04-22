type Props = {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/60">
        <svg className="h-6 w-6 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h6M9 12h6M9 15h4" />
        </svg>
      </div>
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-zinc-600">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-teal-400 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-teal-300"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
