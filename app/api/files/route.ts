import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const AI_ROOT = "/Users/boruvka/AI_root";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dirPath = searchParams.get("path") || "";

    // Security: Prevent directory traversal attacks
    const fullPath = path.resolve(AI_ROOT, dirPath);

    if (!fullPath.startsWith(AI_ROOT)) {
      return NextResponse.json(
        { error: "Access denied: path outside AI_root" },
        { status: 403 }
      );
    }

    // Read directory contents
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    const files = await Promise.all(
      entries
        .filter((entry) => !entry.name.startsWith(".")) // Hide hidden files
        .map(async (entry) => {
          try {
            const entryPath = path.join(fullPath, entry.name);
            const stats = await fs.stat(entryPath);

            return {
              name: entry.name,
              type: entry.isDirectory() ? "folder" : "file",
              size: stats.size,
              modified: stats.mtime.toISOString(),
              path: path.relative(AI_ROOT, entryPath),
            };
          } catch (err) {
            console.error(`Error reading ${entry.name}:`, err);
            return null;
          }
        })
    );

    // Sort: folders first, then by name
    const sortedFiles = files
      .filter((f) => f !== null)
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      path: dirPath || "/",
      fullPath: fullPath,
      files: sortedFiles,
    });
  } catch (error) {
    console.error("Error reading directory:", error);

    if (error instanceof Error) {
      if (error.message.includes("ENOENT")) {
        return NextResponse.json(
          { error: "Directory not found" },
          { status: 404 }
        );
      }
      if (error.message.includes("EACCES")) {
        return NextResponse.json(
          { error: "Permission denied" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to read directory" },
      { status: 500 }
    );
  }
}
