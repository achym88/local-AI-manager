import { FileBrowser } from "@/components/FileBrowser";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Navigation to Projects */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 p-4 flex justify-between items-center">
        <h2 className="text-slate-300 font-medium">AI Root Browser</h2>
        <Link
          href="/projects"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
        >
          Project Board
        </Link>
      </div>
      <FileBrowser />
    </div>
  );
}
