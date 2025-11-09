'use client';

import { ClaudeContext } from '@/hooks/terminal/useTerminal';
import { FileText, Layers, Clock } from 'lucide-react';

interface ClaudeContextWidgetProps {
  context: ClaudeContext | null;
  isClaudeRunning: boolean;
}

export default function ClaudeContextWidget({ context, isClaudeRunning }: ClaudeContextWidgetProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">Claude Context</h3>
        <div className={`flex items-center gap-2 ${isClaudeRunning ? 'text-green-400' : 'text-gray-500'}`}>
          <div className={`w-2 h-2 rounded-full ${isClaudeRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs">
            {isClaudeRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
      </div>

      {context ? (
        <div className="space-y-3">
          {/* Token Count Card */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Total Tokens</span>
              </div>
              <span className="text-lg font-mono font-bold text-blue-400">
                {formatNumber(context.totalTokens)}
              </span>
            </div>
          </div>

          {/* Files Count Card */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Files in Context</span>
              </div>
              <span className="text-lg font-mono font-bold text-green-400">
                {formatNumber(context.filesCount)}
              </span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Updated: {formatTime(context.lastUpdated)}</span>
          </div>

          {/* Progress Indicator */}
          <div className="bg-gray-800 rounded p-2 border border-gray-700">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.min((context.totalTokens / 200000) * 100, 100)}%`
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {Math.round((context.totalTokens / 200000) * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">200K token limit</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin" />
            <p className="text-xs text-gray-400">
              {isClaudeRunning ? 'Waiting for context data...' : 'Start Claude to view context'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
