import ProposalBuilder from "./components/ProposalBuilder";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center border-b border-zinc-200 bg-zinc-900 px-6 py-3">
        <h1 className="text-lg font-bold tracking-tight text-white">ProposalCraft</h1>
        <span className="ml-3 rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
          AI-Powered
        </span>
      </header>
      <main className="flex flex-1 flex-col">
        <ProposalBuilder />
      </main>
    </div>
  );
}
