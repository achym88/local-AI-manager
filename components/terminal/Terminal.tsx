'use client';

import { RefObject } from 'react';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  terminalRef: RefObject<HTMLDivElement | null>;
  isConnected: boolean;
}

export default function Terminal({ terminalRef, isConnected }: TerminalProps) {
  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-700">
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="text-xs text-gray-500">Terminal</div>
      </div>
      <div ref={terminalRef} className="flex-1 p-2" />
    </div>
  );
}
