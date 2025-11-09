'use client';

import { useEffect, useState } from 'react';
import type { TerminalInfo } from '@/lib/terminal/socket';
import type { ClaudeContext } from '@/hooks/terminal/useTerminal';
import ClaudeContextWidget from './ClaudeContextWidget';

interface ContextPanelProps {
  terminalInfo: TerminalInfo | null;
  isConnected: boolean;
  claudeContext: ClaudeContext | null;
  isClaudeRunning: boolean;
}

export default function ContextPanel({
  terminalInfo,
  isConnected,
  claudeContext,
  isClaudeRunning,
}: ContextPanelProps) {
  const [sessionDuration, setSessionDuration] = useState(0);

  useEffect(() => {
    if (!isConnected) {
      setSessionDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setSessionDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full bg-gray-900 border-l border-gray-700 flex flex-col">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Context Panel</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Claude Context Widget - NEW! */}
        <ClaudeContextWidget context={claudeContext} isClaudeRunning={isClaudeRunning} />

        {/* Divider */}
        <div className="border-t border-gray-700" />

        {/* Session Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Session Info</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-300">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            {terminalInfo && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">PID</span>
                  <span className="text-sm text-gray-300 font-mono">{terminalInfo.pid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Shell</span>
                  <span className="text-sm text-gray-300 font-mono">{terminalInfo.shell}</span>
                </div>
              </>
            )}
            {isConnected && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Duration</span>
                <span className="text-sm text-gray-300 font-mono">{formatDuration(sessionDuration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Working Directory */}
        {terminalInfo && (
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Working Directory</h3>
            <div className="bg-gray-800 rounded p-3 border border-gray-700">
              <code className="text-xs text-green-400 break-all">{terminalInfo.cwd}</code>
            </div>
          </div>
        )}

        {/* Claude CLI Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Claude Code CLI</h3>
          <div className="space-y-2 text-xs text-gray-400">
            <p>Claude Code CLI je dostupný přes:</p>
            <code className="block bg-gray-800 rounded p-2 text-green-400">claude --version</code>
            <div className="mt-3 space-y-1">
              <p className="font-semibold text-gray-300">Užitečné příkazy:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><code className="text-green-400">claude</code> - Start Claude CLI</li>
                <li><code className="text-green-400">ls</code> - List files</li>
                <li><code className="text-green-400">pwd</code> - Current directory</li>
                <li><code className="text-green-400">git status</code> - Git status</li>
                <li><code className="text-green-400">npm run dev</code> - Start dev server</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Tips</h3>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="bg-gray-800 rounded p-3 border border-gray-700">
              <p className="font-semibold text-gray-300 mb-1">Zkratky:</p>
              <ul className="space-y-1">
                <li><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+C</kbd> - Přerušit proces</li>
                <li><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+L</kbd> - Vyčistit terminal</li>
                <li><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">↑/↓</kbd> - Historie příkazů</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
