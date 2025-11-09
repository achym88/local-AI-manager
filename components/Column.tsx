"use client";

import { Column as ColumnType, Task } from "@/lib/types";
import { motion } from "framer-motion";
import { TaskCard } from "./TaskCard";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onAddTask: (columnId: string, title: string, description: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const Column = ({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  onUpdateTask,
  onDeleteColumn,
}: ColumnProps) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const handleAddTask = () => {
    if (title.trim()) {
      onAddTask(column.id, title, description);
      setTitle("");
      setDescription("");
      setIsAddingTask(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-shrink-0 w-96 h-fit"
    >
      <div className="glass rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-cyan to-cyan/40 rounded-full" />
            <h2 className="text-lg font-bold text-slate-100">{column.title}</h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
              {tasks.length}
            </span>
          </div>
          {column.id !== "todo" &&
            column.id !== "in-progress" &&
            column.id !== "completed" && (
              <button
                onClick={() => onDeleteColumn(column.id)}
                className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            )}
        </div>

        <div
          ref={setNodeRef}
          className="space-y-3 min-h-96 bg-slate-900/20 rounded-lg p-3"
        >
          <SortableContext items={tasks.map((t) => t.id)}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={onDeleteTask}
                onUpdate={onUpdateTask}
              />
            ))}
          </SortableContext>

          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 text-slate-500">
              <p className="text-sm">No tasks yet</p>
            </div>
          )}
        </div>

        {!isAddingTask ? (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-cyan/30 text-slate-300 hover:text-cyan transition-colors group"
          >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Add Task</span>
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 p-3 bg-slate-800/30 rounded-lg border border-cyan/30"
          >
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
              className="w-full bg-slate-900/50 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan/50 placeholder-slate-500"
              placeholder="Task title"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && e.ctrlKey && handleAddTask()
              }
              className="w-full bg-slate-900/50 border border-slate-600 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan/50 placeholder-slate-500 resize-none h-20"
              placeholder="Add notes (optional)"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddTask}
                className="flex-1 bg-cyan/20 hover:bg-cyan/30 border border-cyan/50 rounded px-3 py-2 text-sm font-medium text-cyan transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setTitle("");
                  setDescription("");
                  setIsAddingTask(false);
                }}
                className="flex-1 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm font-medium text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
