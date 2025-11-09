export interface Task {
  id: string;
  title: string;
  description: string;
  columnId: string;
  createdAt: number;
  aiPrompt?: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
}

export interface BoardState {
  columns: Column[];
  tasks: Task[];
}
