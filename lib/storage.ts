import { BoardState, Column, Task } from "./types";

const STORAGE_KEY = "kanban-board-state";

const DEFAULT_COLUMNS: Column[] = [
  { id: "todo", title: "TODO", order: 0 },
  { id: "in-progress", title: "In Progress", order: 1 },
  { id: "completed", title: "Completed", order: 2 },
];

const DEFAULT_STATE: BoardState = {
  columns: DEFAULT_COLUMNS,
  tasks: [],
};

export const loadBoardState = (): BoardState => {
  if (typeof window === "undefined") return DEFAULT_STATE;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load board state:", error);
  }

  return DEFAULT_STATE;
};

export const saveBoardState = (state: BoardState): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save board state:", error);
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
