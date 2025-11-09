const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const pty = require('node-pty');
const os = require('os');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active PTY sessions
const terminals = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? '*' : `http://${hostname}:${port}`,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('create-terminal', (data) => {
      const { cols = 80, rows = 24 } = data || {};

      // Determine shell based on OS
      const shell = process.env.CLI_SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/zsh');
      const cwd = process.env.CLI_WORKSPACE_PATH || process.cwd();

      try {
        // Spawn PTY process
        const term = pty.spawn(shell, [], {
          name: 'xterm-color',
          cols,
          rows,
          cwd,
          env: {
            ...process.env,
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor',
          }
        });

        terminals.set(socket.id, term);

        // Send output to client
        term.onData((data) => {
          socket.emit('terminal-output', data);
        });

        // Handle terminal exit
        term.onExit(({ exitCode, signal }) => {
          console.log(`Terminal ${socket.id} exited with code ${exitCode}, signal ${signal}`);
          terminals.delete(socket.id);
          socket.emit('terminal-exit', { exitCode, signal });
        });

        socket.emit('terminal-created', {
          pid: term.pid,
          cwd,
          shell
        });

        console.log(`Terminal created for ${socket.id}, PID: ${term.pid}`);
      } catch (error) {
        console.error('Error creating terminal:', error);
        socket.emit('terminal-error', { message: error.message });
      }
    });

    socket.on('terminal-input', (data) => {
      const term = terminals.get(socket.id);
      if (term) {
        term.write(data);
      }
    });

    socket.on('terminal-resize', ({ cols, rows }) => {
      const term = terminals.get(socket.id);
      if (term) {
        try {
          term.resize(cols, rows);
          console.log(`Terminal ${socket.id} resized to ${cols}x${rows}`);
        } catch (error) {
          console.error('Error resizing terminal:', error);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      const term = terminals.get(socket.id);
      if (term) {
        term.kill();
        terminals.delete(socket.id);
      }
    });
  });

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Terminal server running with Socket.IO`);
  });
});
