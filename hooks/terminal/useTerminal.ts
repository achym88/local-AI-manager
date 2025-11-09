import { useEffect, useRef, useState } from 'react';
import { getSocket, disconnectSocket, TerminalInfo } from '@/lib/terminal/socket';
import type { Terminal as TerminalType } from '@xterm/xterm';
import type { FitAddon as FitAddonType } from '@xterm/addon-fit';

export interface ClaudeContext {
  totalTokens: number;
  filesCount: number;
  lastUpdated: Date;
  rawOutput?: string;
}

export const useTerminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<TerminalType | null>(null);
  const fitAddonRef = useRef<FitAddonType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [terminalInfo, setTerminalInfo] = useState<TerminalInfo | null>(null);
  const [claudeContext, setClaudeContext] = useState<ClaudeContext | null>(null);
  const [isClaudeRunning, setIsClaudeRunning] = useState(false);

  const outputBufferRef = useRef<string>('');
  const isWaitingForContextRef = useRef<boolean>(false);
  const claudeStartedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!terminalRef.current || typeof window === 'undefined') return;

    // Dynamically import xterm modules (client-side only)
    const initTerminal = async () => {
      if (!terminalRef.current) return;

      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');

      const terminalElement = terminalRef.current;

      // Initialize XTerm
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#ffffff',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5',
        },
        scrollback: 1000,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalElement);
      fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Socket.IO connection
    const socket = getSocket();

    socket.on('connect', () => {
      setIsConnected(true);
      const { cols, rows } = term;
      socket.emit('create-terminal', { cols, rows });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setTerminalInfo(null);
    });

    socket.on('terminal-created', (info: TerminalInfo) => {
      setTerminalInfo(info);
      term.writeln(`\x1b[32m✓ Terminal ready\x1b[0m`);
      term.writeln(`\x1b[90mPID: ${info.pid} | Shell: ${info.shell}\x1b[0m`);
      term.writeln(`\x1b[90mWorking directory: ${info.cwd}\x1b[0m`);
      term.writeln('');

      // Auto-run Claude after a short delay to let terminal settle
      setTimeout(() => {
        if (!claudeStartedRef.current) {
          socket.emit('terminal-input', 'claude\r');
          claudeStartedRef.current = true;
          setIsClaudeRunning(true);
        }
      }, 500);
    });

    socket.on('terminal-output', (data: string) => {
      term.write(data);

      // Monitor output for Claude interaction (check the ref, not state)
      if (claudeStartedRef.current) {
        outputBufferRef.current += data;

        console.log('[Claude Monitor] Buffer length:', outputBufferRef.current.length, 'Waiting for context:', isWaitingForContextRef.current);

        // Check if we're waiting for context output
        if (isWaitingForContextRef.current) {
          // Look for context information in the output - more flexible regex
          const contextPatterns = [
            /Context:\s*(\d+)\s*tokens?\s*.*?(\d+)\s*files?/is,
            /(\d+)\s*tokens?.*?Context.*?(\d+)\s*files?/is,
            /(\d+)\s*total tokens.*?(\d+)\s*files?/is,
          ];

          let contextMatch = null;
          for (const pattern of contextPatterns) {
            const match = outputBufferRef.current.match(pattern);
            if (match) {
              contextMatch = match;
              break;
            }
          }

          if (contextMatch) {
            console.log('[Claude Monitor] Found context:', contextMatch);
            setClaudeContext({
              totalTokens: parseInt(contextMatch[1]) || 0,
              filesCount: parseInt(contextMatch[2]) || 0,
              lastUpdated: new Date(),
              rawOutput: outputBufferRef.current,
            });
            isWaitingForContextRef.current = false;
            outputBufferRef.current = '';
          }
        } else {
          // Detect when Claude finishes responding
          // Look for Claude's prompt patterns more robustly
          const hasClaudePrompt = /Claude ❯|Claude >|\n❯|\n>/.test(outputBufferRef.current);
          const hasRegularPrompt = /\$\s*$|\n>\s*$/.test(outputBufferRef.current);

          if ((hasClaudePrompt || hasRegularPrompt) && outputBufferRef.current.length > 50) {
            console.log('[Claude Monitor] Claude response detected, requesting context');
            // Claude finished responding, trigger /context update
            setTimeout(() => {
              socket.emit('terminal-input', '/context\r');
              isWaitingForContextRef.current = true;
              outputBufferRef.current = '';
            }, 300);
          }
        }

        // Keep buffer from growing too large
        if (outputBufferRef.current.length > 10000) {
          outputBufferRef.current = outputBufferRef.current.slice(-5000);
        }
      }
    });

    socket.on('terminal-exit', ({ exitCode }: { exitCode: number }) => {
      term.writeln(`\n\x1b[31mTerminal exited with code ${exitCode}\x1b[0m`);
    });

    socket.on('terminal-error', ({ message }: { message: string }) => {
      term.writeln(`\x1b[31mError: ${message}\x1b[0m`);
    });

    // Handle terminal input
    term.onData((data) => {
      socket.emit('terminal-input', data);
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
        const { cols, rows } = xtermRef.current;
        socket.emit('terminal-resize', { cols, rows });
      }
    };

      window.addEventListener('resize', handleResize);

      // Store cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
        disconnectSocket();
      };
    };

    // Call the async initialization
    let cleanup: (() => void) | undefined;
    initTerminal().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    // Cleanup
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const fit = () => {
    if (fitAddonRef.current && xtermRef.current) {
      fitAddonRef.current.fit();
      const socket = getSocket();
      const { cols, rows } = xtermRef.current;
      socket.emit('terminal-resize', { cols, rows });
    }
  };

  return {
    terminalRef,
    isConnected,
    terminalInfo,
    claudeContext,
    isClaudeRunning,
    fit,
  };
};
