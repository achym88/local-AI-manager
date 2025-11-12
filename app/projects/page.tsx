import { KanbanBoard } from "@/components/KanbanBoard";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div>
      {/* Simple navigation back to home */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition"
        >
          <ChevronLeft size={18} />
          Back to File Browser
        </Link>
      </div>
      <KanbanBoard />
    </div>
  );
}
