import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getTaskStatus } from "../services/taskService";

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      isTrackerOpen: true,

      setTrackerOpen: (open) => set({ isTrackerOpen: open }),

      addTask: ({ taskId, type, title, metadata = {} }) => {
        const newTask = {
          taskId,
          type, // 'invoice' | 'csv_import'
          title: title || "Background Task",
          state: "PENDING",
          progress: 5,
          status: "Task queued for worker...",
          result: null,
          error: null,
          metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          tasks: [newTask, ...state.tasks.filter((t) => t.taskId !== taskId)],
          isTrackerOpen: true,
        }));

        // Begin polling immediately for this task
        get().pollTask(taskId);
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.taskId === taskId
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        }));
      },

      removeTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.taskId !== taskId),
        }));
      },

      clearCompleted: () => {
        set((state) => ({
          tasks: state.tasks.filter(
            (t) => t.state !== "SUCCESS" && t.state !== "FAILURE"
          ),
        }));
      },

      pollTask: async (taskId) => {
        const pollInterval = 1200; // 1.2s

        const poll = async () => {
          const currentTask = get().tasks.find((t) => t.taskId === taskId);
          if (!currentTask) return; // Task was removed

          try {
            const data = await getTaskStatus(taskId);

            get().updateTask(taskId, {
              state: data.state,
              progress: data.progress ?? (data.state === "SUCCESS" ? 100 : 10),
              status: data.status || `Status: ${data.state}`,
              result: data.result,
              error: data.error,
            });

            // Continue polling if still active
            if (data.state === "PENDING" || data.state === "PROGRESS") {
              setTimeout(poll, pollInterval);
            }
          } catch (err) {
            console.error(`Error polling task ${taskId}:`, err);
            // Continue retry on transient errors up to reasonable limit
            const task = get().tasks.find((t) => t.taskId === taskId);
            if (task && task.state !== "SUCCESS" && task.state !== "FAILURE") {
              setTimeout(poll, pollInterval * 2);
            }
          }
        };

        setTimeout(poll, 300);
      },

      resumeActivePolls: () => {
        const active = get().tasks.filter(
          (t) => t.state === "PENDING" || t.state === "PROGRESS"
        );
        active.forEach((t) => get().pollTask(t.taskId));
      },
    }),
    {
      name: "shopstore_background_tasks",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.resumeActivePolls();
        }
      },
    }
  )
);

