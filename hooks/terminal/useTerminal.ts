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

          // Request initial context after Claude starts
          setTimeout(() => {
            console.log('[Claude Monitor] Requesting initial context');
            socket.emit('terminal-input', '/context\r');
            isWaitingForContextRef.current = true;
          }, 2000);
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
          // Strip ANSI escape codes for easier parsing
          const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[.*?[@-~]/g, '');
          const cleanOutput = stripAnsi(outputBufferRef.current);

          console.log('[Claude Monitor] Clean output:', cleanOutput.slice(-500));

          // Look for context information in the output - comprehensive patterns
          const contextPatterns = [
            // Pattern for "token_budget>200000</budget" format
            /token_budget>(\d+)<\/budget/i,
            // Pattern for "Context: X tokens" or "X tokens" with "Y files"
            /Context[:\s]+(\d+)\s*tokens?.*?(\d+)\s*files?/is,
            /(\d+)\s*tokens?.*?Context.*?(\d+)\s*files?/is,
            /(\d+)\s*total tokens.*?(\d+)\s*files?/is,
            // Pattern for "Context window usage: X/Y tokens"
            /Context window.*?(\d+)[\/\s]+\d+\s*tokens?.*?(\d+)\s*files?/is,
            // Pattern for standalone numbers with tokens/files
            /(\d{3,})\s*tokens.*?(\d+)\s*files/is,
            // Pattern for budget info
            /<budget.*?(\d+).*?budget>.*?(\d+)\s*files/is,
          ];

          let tokensMatch = null;
          let filesMatch = null;

          // Try each pattern
          for (const pattern of contextPatterns) {
            const match = cleanOutput.match(pattern);
            if (match) {
              console.log('[Claude Monitor] Pattern matched:', pattern, 'Result:', match);
              if (match[1]) tokensMatch = match[1];
              if (match[2]) filesMatch = match[2];
              if (tokensMatch && filesMatch) break;
            }
          }

          // Also try to find tokens and files separately
          if (!tokensMatch) {
            const tokenMatch = cleanOutput.match(/(\d{3,})\s*(?:total\s*)?tokens?/i);
            if (tokenMatch) {
              tokensMatch = tokenMatch[1];
              console.log('[Claude Monitor] Found tokens separately:', tokensMatch);
            }
          }

          if (!filesMatch) {
            const fileMatch = cleanOutput.match(/(\d+)\s*files?(?:\s+in context)?/i);
            if (fileMatch) {
              filesMatch = fileMatch[1];
              console.log('[Claude Monitor] Found files separately:', filesMatch);
            }
          }

          // Update context if we found both values or if we have a timeout
          const waitTime = Date.now() - (isWaitingForContextRef.current ? 0 : Date.now());
          if ((tokensMatch && filesMatch) || cleanOutput.length > 2000) {
            console.log('[Claude Monitor] Updating context with tokens:', tokensMatch, 'files:', filesMatch);
            setClaudeContext({
              totalTokens: parseInt(tokensMatch || '0') || 0,
              filesCount: parseInt(filesMatch || '0') || 0,
              lastUpdated: new Date(),
              rawOutput: cleanOutput,
            });
            isWaitingForContextRef.current = false;
            outputBufferRef.current = '';
          }
        } else {
          // Detect when Claude finishes responding
          // Look for Claude's prompt patterns more robustly
          const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[.*?[@-~]/g, '');
          const cleanBuffer = stripAnsi(outputBufferRef.current);

          // Check for various prompt indicators
          const hasClaudePrompt = /Claude ❯|Claude >|Claude\s*[\>❯]/.test(cleanBuffer);
          const hasPromptEnd = /[\>❯]\s*$/.test(cleanBuffer);
          const hasNewPrompt = /\n.*?[\>❯]\s*$/.test(cleanBuffer);

          if ((hasClaudePrompt || hasPromptEnd || hasNewPrompt) && cleanBuffer.length > 50) {
            console.log('[Claude Monitor] Claude response detected, requesting context');
            // Claude finished responding, trigger /context update
            setTimeout(() => {
              socket.emit('terminal-input', '/context\r');
              isWaitingForContextRef.current = true;
              outputBufferRef.current = '';
            }, 500);
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
