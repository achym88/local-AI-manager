"use client";

import { useEffect, useState } from "react";
import { BoardState, Task, Column } from "@/lib/types";
import { loadBoardState, saveBoardState, generateId } from "@/lib/storage";

export const useKanban = () => {
  const [state, setState] = useState<BoardState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const loaded = loadBoardState();
    setState(loaded);
    setIsLoaded(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (state && isLoaded) {
      saveBoardState(state);
    }
  }, [state, isLoaded]);

  const addTask = (columnId: string, title: string, description: string) => {
    if (!state) return;

    const newTask: Task = {
      id: generateId(),
      title,
      description,
      columnId,
      createdAt: Date.now(),
    };

    setState({
      ...state,
      tasks: [...state.tasks, newTask],
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (!state) return;

    setState({
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    });
  };

  const deleteTask = (taskId: string) => {
    if (!state) return;

    setState({
      ...state,
      tasks: state.tasks.filter((task) => task.id !== taskId),
    });
  };

  const moveTask = (taskId: string, columnId: string) => {
    if (!state) return;

    setState({
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, columnId } : task
      ),
    });
  };

  const addColumn = (title: string) => {
    if (!state) return;

    const newColumn: Column = {
      id: generateId(),
      title,
      order: Math.max(...state.columns.map((c) => c.order), -1) + 1,
    };

    setState({
      ...state,
      columns: [...state.columns, newColumn],
    });
  };

  const deleteColumn = (columnId: string) => {
    if (!state) return;

    // Remove column and any tasks in it
    setState({
      ...state,
      columns: state.columns.filter((col) => col.id !== columnId),
      tasks: state.tasks.filter((task) => task.columnId !== columnId),
    });
  };

  return {
    state,
    isLoaded,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addColumn,
    deleteColumn,
  };
};
