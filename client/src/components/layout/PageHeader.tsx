import { useNavigate } from "react-router-dom";

interface Props {
  title: string;
  backHref?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, backHref, actions }: Props) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 bg-surface-900 border-b border-surface-600 px-4 py-3 flex items-center gap-3">
      {backHref && (
        <button
          onClick={() => navigate(backHref)}
          className="tap-target flex items-center justify-center -ml-2 p-2 text-surface-300"
          aria-label="Назад"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-lg font-semibold text-surface-100 truncate">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
