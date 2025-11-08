// src/components/TaskManager.tsx
"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Download,
  Upload,
} from "lucide-react";
import { useTasks } from "./TaskContext";

export default function TaskManager() {
  const {
    tasks,
    addTask,
    toggleComplete,
    deleteTask,
    downloadBackup,
    uploadBackup,
  } = useTasks();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"daily" | "weekly">("daily");
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState("");

  // NO EARLY RETURN — tasks is guaranteed to be array from context

  const handleAddTask = () => {
    if (!title.trim()) return;
    addTask(title, type);
    setTitle("");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError("");
      await uploadBackup(file);
      alert("Backup restored!");
    } catch (err: any) {
      setError(err.message || "Failed");
    }
  };

  const getStreak = (): number => {
    const dates = tasks
      .filter((t) => t.completed && t.completed_at)
      .map((t) => new Date(t.completed_at!).toDateString());

    const unique = Array.from(new Set(dates)).sort().reverse();
    if (!unique.length) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < unique.length; i++) {
      const date = new Date(unique[i]);
      date.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (date.getTime() === expected.getTime()) streak++;
      else break;
    }
    return streak;
  };

  const currentStreak = getStreak();

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Streak */}
      <div className="bg-linear-to-r from-orange-400 to-pink-500 rounded-xl p-6 mb-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Current Streak</p>
            <p className="text-4xl font-bold">
              {currentStreak} {currentStreak === 1 ? "day" : "days"}
            </p>
          </div>
          <div className="text-6xl">Fire</div>
        </div>
      </div>

      {/* Backup Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={downloadBackup}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Download size={18} /> Download Backup
        </button>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Upload size={18} /> Restore Backup
        </button>

        <button
          onClick={() => {
            if (!tasks || tasks.length === 0) {
              alert("No tasks to share yet! Add some first.");
              return;
            }
            const encoded = btoa(JSON.stringify(tasks));
            const url = `${window.location.origin}/share?data=${encoded}`;
            navigator.clipboard.writeText(url).then(() => {
              alert("Share link copied! Send it to your parent.");
            });
          }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9 9a3 3 0 100-6 3 3 0 000 6zm-9-9a3 3 0 110-6 3 3 0 010 6z"
            />
          </svg>
          Share with Parent
        </button>
      </div>

      {showUpload && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <input
            type="file"
            accept=".json"
            onChange={handleUpload}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-indigo-600 file:text-white"
          />
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
      )}

      {/* Add Task */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="What do you need to study?"
            className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "daily" | "weekly")}
            className="px-3 py-2 border rounded-md"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <button
            onClick={handleAddTask}
            className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 flex items-center gap-1"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No tasks yet. Add one to start!
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-lg shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition ${
                task.completed ? "opacity-75" : ""
              }`}
            >
              <button onClick={() => toggleComplete(task.id)}>
                {task.completed ? (
                  <CheckCircle2 size={24} className="text-green-600" />
                ) : (
                  <Circle
                    size={24}
                    className="text-gray-400 hover:text-indigo-600"
                  />
                )}
              </button>
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    task.completed
                      ? "line-through text-gray-500"
                      : "text-gray-800"
                  }`}
                >
                  {task.title}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    task.type === "daily"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {task.type}
                </span>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
