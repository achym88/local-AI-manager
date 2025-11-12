import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const AI_ROOT = "/Users/boruvka/AI_root";
const OBSIDIAN_DOCS_PATH = "/Users/boruvka/Library/CloudStorage/GoogleDrive-jan.boruvka8@gmail.com/My Drive/Obsidian Vault/_AI_root";

// Folders to ignore
const IGNORE_FOLDERS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  "coverage",
]);

interface ProjectAnalysis {
  projectName: string;
  success: boolean;
  summary?: string;
  mdFiles?: string[];
  error?: string;
}

// Find all .md files recursively in a directory
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const mdFiles: string[] = [];

  async function scan(currentDir: string, depth: number = 0) {
    // Limit recursion depth to prevent infinite loops
    if (depth > 10) return;

    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden files and ignored folders
        if (entry.name.startsWith(".") || IGNORE_FOLDERS.has(entry.name)) {
          continue;
        }

        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await scan(fullPath, depth + 1);
        } else if (entry.name.endsWith(".md")) {
          mdFiles.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${currentDir}:`, error);
    }
  }

  await scan(dir);
  return mdFiles;
}

// Read and combine markdown file contents
async function readMarkdownContents(files: string[]): Promise<string> {
  const contents: string[] = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const relativePath = path.basename(file);
      contents.push(`\n--- File: ${relativePath} ---\n${content}`);
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }

  return contents.join("\n\n");
}

// Generate summary using Abacus AI
async function generateSummary(
  projectName: string,
  markdownContent: string
): Promise<string> {
  if (!process.env.ABACUS_AI_API_KEY) {
    throw new Error("ABACUS_AI_API_KEY not configured");
  }

  // Truncate content if too large (max ~10000 chars to stay within token limits)
  const truncatedContent = markdownContent.substring(0, 10000);

  const prompt = `Analyze these markdown files from a project called "${projectName}" and create a concise summary describing what the project does, its main features, and purpose. Keep it under 200 words. Be specific and technical.

Markdown content:
${truncatedContent}`;

  const response = await fetch(
    "https://routellm.abacus.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACUS_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "route-llm",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content || "";

  if (!summary) {
    throw new Error("No summary generated from AI");
  }

  return summary.trim();
}

// Create Obsidian note
async function createObsidianNote(
  projectName: string,
  summary: string,
  mdFiles: string[]
): Promise<void> {
  const timestamp = new Date().toISOString();
  const relativeFiles = mdFiles.map((file) =>
    path.relative(path.join(AI_ROOT, projectName), file)
  );

  const noteContent = `# ${projectName}

## Summary
${summary}

## Analyzed Files
${relativeFiles.length > 0 ? relativeFiles.map((f) => `- ${f}`).join("\n") : "No markdown files found"}

## Last Updated
${timestamp}

[[AI Projects]]
`;

  const notePath = path.join(OBSIDIAN_DOCS_PATH, `${projectName}.md`);

  // Ensure the directory exists
  await fs.mkdir(OBSIDIAN_DOCS_PATH, { recursive: true });

  // Write the note (overwrites if exists)
  await fs.writeFile(notePath, noteContent, "utf-8");
}

export async function POST(request: NextRequest) {
  try {
    console.log("Starting documentation generation...");

    // Parse request body to check for specific project
    const body = await request.json().catch(() => ({}));
    const specificProject = body.projectName;

    let projectFolders: string[];

    if (specificProject) {
      // Generate docs for specific project only
      console.log(`Generating documentation for specific project: ${specificProject}`);
      projectFolders = [specificProject];
    } else {
      // Get all top-level folders in AI_root
      const entries = await fs.readdir(AI_ROOT, { withFileTypes: true });
      projectFolders = entries
        .filter(
          (entry) =>
            entry.isDirectory() &&
            !entry.name.startsWith(".") &&
            !IGNORE_FOLDERS.has(entry.name)
        )
        .map((entry) => entry.name);

      console.log(`Found ${projectFolders.length} project folders:`, projectFolders);
    }

    const results: ProjectAnalysis[] = [];

    // Process each project
    for (const projectName of projectFolders) {
      console.log(`\nProcessing project: ${projectName}`);

      try {
        const projectPath = path.join(AI_ROOT, projectName);

        // Find all .md files
        const mdFiles = await findMarkdownFiles(projectPath);
        console.log(`Found ${mdFiles.length} markdown files in ${projectName}`);

        if (mdFiles.length === 0) {
          // Skip projects with no markdown files
          results.push({
            projectName,
            success: false,
            error: "No markdown files found",
          });
          continue;
        }

        // Read markdown contents
        const markdownContent = await readMarkdownContents(mdFiles);
        console.log(`Read ${markdownContent.length} characters of content`);

        // Generate summary with AI
        const summary = await generateSummary(projectName, markdownContent);
        console.log(`Generated summary for ${projectName}`);

        // Create Obsidian note
        await createObsidianNote(projectName, summary, mdFiles);
        console.log(`Created Obsidian note for ${projectName}`);

        results.push({
          projectName,
          success: true,
          summary,
          mdFiles: mdFiles.map((f) => path.basename(f)),
        });
      } catch (error) {
        console.error(`Error processing ${projectName}:`, error);
        results.push({
          projectName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Summary statistics
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`\nCompleted: ${successCount} success, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      total: results.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("Error in generate-docs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
