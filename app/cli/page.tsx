'use client';

import Terminal from '@/components/terminal/Terminal';
import ContextPanel from '@/components/terminal/ContextPanel';
import Link from 'next/link';
import { useTerminal } from '@/hooks/terminal/useTerminal';

export default function CLIPage() {
  const { terminalRef, isConnected, terminalInfo, claudeContext, isClaudeRunning, fit } = useTerminal();

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Kanban Board
            </Link>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Manager - Terminal</h1>
          </div>
          <div className="w-40" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Terminal - 70% */}
        <div className="w-[70%] p-4">
          <Terminal
            terminalRef={terminalRef}
            isConnected={isConnected}
          />
        </div>

        {/* Context Panel - 30% */}
        <div className="w-[30%]">
          <ContextPanel
            terminalInfo={terminalInfo}
            isConnected={isConnected}
            claudeContext={claudeContext}
            isClaudeRunning={isClaudeRunning}
          />
        </div>
      </div>
    </div>
  );
}
