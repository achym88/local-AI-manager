"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, Folder, File, ChevronLeft, Home, FileText, Sparkles } from "lucide-react";

interface FileEntry {
  name: string;
  type: "file" | "folder";
  size: number;
  modified: string;
  path: string;
}

interface BrowserResponse {
  path: string;
  fullPath: string;
  files: FileEntry[];
}

export function FileBrowser() {
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<any>(null);

  // Fetch directory contents
  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/files?path=${encodeURIComponent(currentPath)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load directory");
        }

        const data: BrowserResponse = await response.json();
        setFiles(data.files);

        // Update breadcrumbs
        if (data.path === "/") {
          setBreadcrumbs([]);
        } else {
          const parts = data.path.split("/").filter((p) => p);
          setBreadcrumbs(parts);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading files");
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [currentPath]);

  const handleFolderClick = (folderPath: string) => {
    setCurrentPath(folderPath);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath("");
    } else {
      const parts = breadcrumbs.slice(0, index + 1);
      setCurrentPath(parts.join("/"));
    }
  };

  const goBack = () => {
    if (breadcrumbs.length > 0) {
      handleBreadcrumbClick(breadcrumbs.length - 2);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleGenerateDocs = async () => {
    setGenerating(true);
    setGenerationResults(null);
    setError(null);

    try {
      const response = await fetch("/api/generate-docs", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate documentation");
      }

      const results = await response.json();
      setGenerationResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating documentation");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">File Browser</h1>
            <p className="text-slate-400">Browse and organize files in AI_root</p>
          </div>
          {breadcrumbs.length === 0 && (
            <button
              onClick={handleGenerateDocs}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-lg transition font-medium shadow-lg"
            >
              <Sparkles size={20} />
              {generating ? "Generating..." : "Generate Documentation"}
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 mb-6 bg-slate-800/50 rounded-lg p-4">
          <button
            onClick={() => setCurrentPath("")}
            className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300"
            title="Go to root"
          >
            <Home size={20} />
          </button>

          {breadcrumbs.length > 0 && (
            <>
              <ChevronRight size={20} className="text-slate-600" />
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className="px-3 py-1 text-slate-300 hover:bg-slate-700 rounded transition text-sm"
                  >
                    {crumb}
                  </button>
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight size={16} className="text-slate-600" />
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </div>

        {/* Generation Progress/Results */}
        {generating && (
          <div className="mb-6 bg-blue-950/30 border border-blue-900/50 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
              <div>
                <p className="text-blue-200 font-medium">Generating documentation...</p>
                <p className="text-blue-300/70 text-sm mt-1">Analyzing projects and creating Obsidian notes</p>
              </div>
            </div>
          </div>
        )}

        {generationResults && (
          <div className="mb-6 bg-green-950/30 border border-green-900/50 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-green-200 font-semibold text-lg">Documentation Generated!</h3>
                <p className="text-green-300/70 text-sm mt-1">
                  Successfully created {generationResults.successCount} of {generationResults.total} project notes
                </p>
              </div>
              <button
                onClick={() => setGenerationResults(null)}
                className="text-green-400 hover:text-green-200 text-sm"
              >
                Dismiss
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {generationResults.results.map((result: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    result.success
                      ? "bg-green-900/20 border border-green-800/30"
                      : "bg-red-900/20 border border-red-800/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className={result.success ? "text-green-400" : "text-red-400"} />
                    <span className={result.success ? "text-green-200" : "text-red-200"}>
                      {result.projectName}
                    </span>
                  </div>
                  {result.error && (
                    <p className="text-red-300/70 text-xs mt-1 ml-6">{result.error}</p>
                  )}
                  {result.mdFiles && (
                    <p className="text-green-300/60 text-xs mt-1 ml-6">
                      Analyzed {result.mdFiles.length} markdown files
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/50 overflow-hidden">
          {error && (
            <div className="p-6 bg-red-950/30 border-b border-red-900/50 text-red-200">
              <p className="font-medium">Error: {error}</p>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-slate-400 mt-4">Loading directory...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Folder size={48} className="mx-auto mb-3 opacity-30" />
              <p>No files in this directory</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-700 bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Modified
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-700/30 hover:bg-slate-700/20 transition cursor-pointer"
                      onClick={
                        file.type === "folder"
                          ? () => handleFolderClick(file.path)
                          : undefined
                      }
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        {file.type === "folder" ? (
                          <Folder size={18} className="text-blue-400 flex-shrink-0" />
                        ) : (
                          <File size={18} className="text-slate-400 flex-shrink-0" />
                        )}
                        <span className="text-white font-medium">{file.name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm capitalize">
                        {file.type}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {file.type === "file" ? formatFileSize(file.size) : "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {formatDate(file.modified)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
