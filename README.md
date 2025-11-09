# Local AI Manager

A comprehensive project management application combining a beautiful Kanban board with an integrated terminal featuring Claude Code CLI support.

## Features

### Kanban Board
- ✨ **Drag & Drop** - Smooth animations when moving tasks between columns
- 🤖 **AI Prompts** - Generate detailed development prompts from task titles using OpenAI
- 📝 **Task Management** - Create, edit, and delete tasks with notes
- 📊 **Custom Columns** - Add unlimited custom columns beyond the default TODO, In Progress, Completed
- 💾 **Local Storage** - All data persists automatically in your browser
- 🎨 **Beautiful UI** - Dark theme with glassmorphism and smooth animations

### Integrated Terminal
- 💻 **Embedded Terminal** - Full-featured terminal running in the browser
- 🔌 **Real Shell Access** - Actual zsh/bash shell via PTY (pseudo-terminal)
- 🌐 **WebSocket Connection** - Real-time bidirectional communication via Socket.IO
- 🤖 **Claude Code CLI** - Direct access to Claude AI assistant in terminal
- 📊 **Context Panel** - Session monitoring, working directory display, quick tips
- ⚡ **Live Updates** - Real-time terminal output and command execution

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key (free or paid account at https://platform.openai.com)
- Claude Code CLI installed (optional, for AI terminal features)
  - Install from: https://docs.claude.com/en/docs/claude-code/installation
  - Should be available at `~/.local/bin/claude`

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

1. Get your OpenAI API key from: https://platform.openai.com/account/api-keys
2. Create a new file `.env.local` in the project root
3. Add the following configuration:

```bash
# OpenAI API Key (for AI prompt generation in Kanban board)
OPENAI_API_KEY=sk-your-actual-api-key-here

# Terminal Configuration
CLI_WORKSPACE_PATH=/Users/boruvka/AI_root/AI_APP_WEB_UI_AI/local-AI-manager
CLI_SHELL=/bin/zsh
```

**Important:**
- Do NOT commit `.env.local` to version control
- Keep your API key secure and never share it
- The `.env.local` file is already in `.gitignore`
- Update `CLI_WORKSPACE_PATH` to match your actual project path
- Change `CLI_SHELL` if you prefer bash or another shell

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Usage

### Navigating the Application

The application has two main sections accessible via the navigation:
- **Kanban Board** (/) - Project and task management
- **Terminal** (/cli) - Integrated terminal with Claude Code CLI

### Kanban Board

#### Creating Tasks

1. Click the "+ Add Task" button in any column
2. Enter task title and optional notes
3. Click "Add"

### Using AI Prompts

1. Hover over any task card
2. Click the sparkle icon (✨) in the top-right
3. Wait for OpenAI to generate a detailed development prompt
4. The prompt appears in a yellow section below the description
5. Click "Regenerate" to create a new prompt anytime

### Managing Tasks

- **Edit**: Click the pencil icon to edit title and notes
- **Delete**: Click the trash icon to remove a task
- **Move**: Drag tasks between columns with smooth animations

#### Custom Columns

- Click the "+ Add Column" button after the last column
- Enter a column name
- Delete custom columns with the trash icon (default columns cannot be deleted)

### Terminal

#### Accessing the Terminal

1. Click the "Open Terminal" button in the Kanban board header
2. Or navigate directly to http://localhost:3000/cli

#### Using the Terminal

The terminal provides full shell access with the following features:

- **Execute Shell Commands**: Run any bash/zsh command (ls, pwd, git, npm, etc.)
- **Claude Code CLI**: Type `claude` to interact with Claude AI assistant
- **File Operations**: Navigate directories, edit files, run scripts
- **Context Panel**: View session info, working directory, and quick tips

#### Terminal Features

- **Real-time Output**: See command output as it happens
- **Session Monitoring**: Track PID, shell type, and session duration
- **Working Directory Display**: Always know your current location
- **Keyboard Shortcuts**:
  - `Ctrl+C` - Interrupt current process
  - `Ctrl+L` - Clear terminal
  - `↑/↓` - Navigate command history

#### Claude Code CLI Usage

Once in the terminal, you can use Claude for various tasks:

```bash
# Check Claude version
claude --version

# Start an interactive session with Claude
claude

# Ask Claude to help with code
claude "help me refactor this function"

# Get project assistance
claude "explain the project structure"
```

## Project Structure

```
/app
  /api/generate-prompt/route.ts    # OpenAI API integration
  /cli/page.tsx                     # Terminal page
  /page.tsx                         # Main Kanban page
  /layout.tsx                       # Root layout
  /globals.css                      # Global styles

/components
  /KanbanBoard.tsx                 # Main board component
  /Column.tsx                       # Column component
  /TaskCard.tsx                     # Task card with AI button
  /terminal
    /Terminal.tsx                   # Terminal component with XTerm.js
    /ContextPanel.tsx               # Context panel with session info

/lib
  /types.ts                         # TypeScript interfaces
  /storage.ts                       # localStorage utilities
  /api.ts                           # Client API utilities
  /terminal
    /socket.ts                      # Socket.IO client utility

/hooks
  /useLocalStorage.ts              # State management hook
  /terminal
    /useTerminal.ts                 # Terminal state and XTerm hook

/server.js                          # Custom Next.js server with Socket.IO
```

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **State**: React Hooks + localStorage
- **Terminal**: XTerm.js with Fit addon

### Backend
- **Server**: Custom Next.js server
- **WebSocket**: Socket.IO
- **Shell**: node-pty (PTY - pseudo-terminal)
- **API**: OpenAI Chat Completions

## Building for Production

```bash
npm run build
npm start
```

## Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key

Optional (Terminal):
- `CLI_WORKSPACE_PATH` - Working directory for terminal (defaults to current directory)
- `CLI_SHELL` - Shell to use (defaults to /bin/zsh on macOS, powershell on Windows)

## Troubleshooting

### "Failed to generate prompt" Error

1. Check that `.env.local` file exists in the project root
2. Verify your OpenAI API key is correct
3. Make sure you've restarted the dev server after adding `.env.local`
4. Check your OpenAI account has available API credits

### Tasks not persisting

- Make sure your browser allows localStorage
- Check browser DevTools > Application > Local Storage
- Clear cache and reload if experiencing issues

### Drag & drop not working

- Make sure JavaScript is enabled
- Try a different browser
- Clear browser cache

### Terminal not connecting

1. Make sure the development server is running (`npm run dev`)
2. Check browser console for WebSocket errors
3. Verify Socket.IO connection in DevTools > Network > WS
4. Try refreshing the page

### Claude CLI not available in terminal

1. Verify Claude Code CLI is installed: `which claude`
2. Check PATH includes `~/.local/bin`: `echo $PATH`
3. Make sure `.env.local` has correct `CLI_SHELL` setting
4. Restart the development server after installing Claude

## Important Notes

### Deployment Constraints

**This application CANNOT be deployed to Vercel or similar serverless platforms** due to the terminal feature requiring:
- Long-running WebSocket connections
- PTY (pseudo-terminal) processes
- Custom server with Socket.IO

**Suitable deployment platforms:**
- VPS (DigitalOcean, Linode, AWS EC2)
- Heroku with WebSocket support
- Any server with full Node.js support

### Security

**Important Security Considerations:**
- The terminal provides full shell access to your system
- Only run this application on localhost or in trusted environments
- Do NOT expose to the internet without proper authentication
- Consider implementing authentication and command restrictions for production use

### API Rate Limits

OpenAI has rate limits depending on your account. If you hit rate limits:
- Free tier: 3 requests per minute
- Paid tier: Higher limits based on your plan

Consider adding delays between requests if generating many prompts quickly.

## License

MIT

## Contributing

Feel free to fork and submit pull requests!

## Support

For issues with the app, check the GitHub repository.
For OpenAI API issues, visit https://platform.openai.com/docs
