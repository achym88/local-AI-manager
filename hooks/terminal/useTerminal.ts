import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { getSocket, disconnectSocket, TerminalInfo } from '@/lib/terminal/socket';

export const useTerminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [terminalInfo, setTerminalInfo] = useState<TerminalInfo | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

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
    term.open(terminalRef.current);
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
    });

    socket.on('terminal-output', (data: string) => {
      term.write(data);
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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      disconnectSocket();
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
    fit,
  };
};
