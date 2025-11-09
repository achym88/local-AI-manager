"use client";

import { useKanban } from "@/hooks/useLocalStorage";
import { motion, AnimatePresence } from "framer-motion";
import { Column } from "./Column";
import { Plus, Terminal as TerminalIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

export const KanbanBoard = () => {
  const {
    state,
    isLoaded,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    addColumn,
    deleteColumn,
  } = useKanban();

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId !== overId) {
      // Find the task and the target column
      const task = state?.tasks.find((t) => t.id === activeId);
      if (task) {
        moveTask(activeId as string, overId as string);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Tasks are moved in dragOver, this just ends the drag operation
  };

  const handleAddColumn = () => {
    if (columnTitle.trim()) {
      addColumn(columnTitle);
      setColumnTitle("");
      setIsAddingColumn(false);
    }
  };

  if (!isLoaded || !state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const sortedColumns = [...state.columns].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="max-w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold text-slate-100 mb-2">
                Project Board
              </h1>
              <p className="text-slate-400">
                Organize your tasks and track progress
              </p>
            </div>
            <Link
              href="/cli"
              className="flex items-center gap-2 px-4 py-2 bg-cyan/20 hover:bg-cyan/30 border border-cyan/50 rounded-lg text-cyan transition-colors"
            >
              <TerminalIcon size={20} />
              <span className="font-medium">Open Terminal</span>
            </Link>
          </motion.div>

          {/* Kanban Columns */}
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
            <AnimatePresence mode="popLayout">
              {sortedColumns.map((column) => {
                const columnTasks = state.tasks
                  .filter((task) => task.columnId === column.id)
                  .sort((a, b) => a.createdAt - b.createdAt);

                return (
                  <Column
                    key={column.id}
                    column={column}
                    tasks={columnTasks}
                    onAddTask={addTask}
                    onDeleteTask={deleteTask}
                    onUpdateTask={updateTask}
                    onDeleteColumn={deleteColumn}
                  />
                );
              })}
            </AnimatePresence>

            {/* Add Column Button */}
            {!isAddingColumn ? (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setIsAddingColumn(true)}
                className="flex-shrink-0 w-96 h-fit"
              >
                <div className="glass rounded-xl p-4 flex items-center justify-center h-32 hover:border-cyan/50 transition-colors group cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Plus
                      size={24}
                      className="text-slate-400 group-hover:text-cyan transition-colors group-hover:scale-110 transform"
                    />
                    <span className="text-slate-400 group-hover:text-cyan transition-colors text-sm font-medium">
                      Add Column
                    </span>
                  </div>
                </div>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-shrink-0 w-96 h-fit"
              >
                <div className="glass rounded-xl p-4 space-y-3">
                  <input
                    autoFocus
                    type="text"
                    value={columnTitle}
                    onChange={(e) => setColumnTitle(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleAddColumn()
                    }
                    className="w-full bg-slate-800/50 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan/50 placeholder-slate-500"
                    placeholder="Column name"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddColumn}
                      className="flex-1 bg-cyan/20 hover:bg-cyan/30 border border-cyan/50 rounded px-3 py-2 text-sm font-medium text-cyan transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setColumnTitle("");
                        setIsAddingColumn(false);
                      }}
                      className="flex-1 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm font-medium text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
};
