"use client";

import { Task } from "@/lib/types";
import { motion } from "framer-motion";
import { useState } from "react";
import { Trash2, Edit2, Sparkles } from "lucide-react";
import { generatePromptFromTitle } from "@/lib/api";

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export const TaskCard = ({ task, onDelete, onUpdate }: TaskCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);

  const handleSave = () => {
    if (title.trim()) {
      onUpdate(task.id, { title, description });
      setIsEditing(false);
    }
  };

  const handleGeneratePrompt = async () => {
    try {
      setIsGenerating(true);
      const prompt = await generatePromptFromTitle(task.title);
      onUpdate(task.id, { aiPrompt: prompt });
      setShowAIPrompt(true);
    } catch (error) {
      console.error("Failed to generate prompt:", error);
      alert("Failed to generate prompt. Please make sure your Abacus AI API key is configured.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="glass-dark p-4 rounded-lg cursor-grab active:cursor-grabbing group hover:glass hover:border-cyan/40 transition-all"
    >
      {!isEditing ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-100 flex-1">
              {task.title}
            </h3>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={handleGeneratePrompt}
                disabled={isGenerating}
                className="p-1.5 hover:bg-yellow-500/20 rounded transition-colors disabled:opacity-50"
                title="Generate AI prompt"
              >
                <Sparkles
                  size={14}
                  className={`${
                    isGenerating ? "animate-spin text-yellow-400" : "text-yellow-400"
                  }`}
                />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-slate-700/50 rounded transition-colors"
              >
                <Edit2 size={14} className="text-slate-400" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
              >
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-slate-400 leading-relaxed">
              {task.description}
            </p>
          )}

          {(showAIPrompt || task.aiPrompt) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-100 leading-relaxed"
            >
              <div className="flex items-center gap-1 mb-1">
                <Sparkles size={12} className="text-yellow-400" />
                <span className="font-semibold text-yellow-300">AI Prompt:</span>
              </div>
              <p className="text-yellow-100/90">{task.aiPrompt}</p>
              {task.aiPrompt && (
                <button
                  onClick={handleGeneratePrompt}
                  disabled={isGenerating}
                  className="mt-2 text-xs px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded border border-yellow-500/50 text-yellow-300 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? "Regenerating..." : "Regenerate"}
                </button>
              )}
            </motion.div>
          )}

          <div className="text-xs text-slate-500">
            {new Date(task.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-600 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-cyan/50"
            placeholder="Task title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan/50 resize-none h-20"
            placeholder="Add notes..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-cyan/20 hover:bg-cyan/30 border border-cyan/50 rounded px-2 py-1 text-xs font-medium text-cyan transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setTitle(task.title);
                setDescription(task.description);
                setIsEditing(false);
              }}
              className="flex-1 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-xs font-medium text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
