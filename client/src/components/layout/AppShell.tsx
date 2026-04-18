import BottomNav from "./BottomNav";

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  return (
    <div className="flex flex-col min-h-dvh w-full max-w-[375px] mx-auto bg-surface-900">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
