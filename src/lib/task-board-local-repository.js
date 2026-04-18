import { household, loadCurrentUserId, loadTasks, saveTasks, subscribeToTaskBoardStorage } from "./task-board-data";

export function createLocalTaskBoardRepository() {
  return {
    supportsAuth: false,
    type: "local",
    getInitialState() {
      const currentUserId = loadCurrentUserId();

      return {
        currentUserId,
        household,
        isAuthenticated: true,
        needsOnboarding: false,
        tasks: loadTasks(),
        userEmail: "",
      };
    },
    async getState() {
      const currentUserId = loadCurrentUserId();

      return {
        currentUserId,
        household,
        isAuthenticated: true,
        needsOnboarding: false,
        tasks: loadTasks(),
        userEmail: "",
      };
    },
    async getTasks() {
      return this.getState();
    },
    async saveTasks(tasks) {
      saveTasks(tasks);
    },
    subscribe({ onTasksChange, onUserChange }) {
      return subscribeToTaskBoardStorage({
        onTasksChange,
        onUserChange,
      });
    },
    subscribeAuth() {
      return () => {};
    },
    async signIn() {
      throw new Error("Auth is not enabled when using the local repository.");
    },
    async signOut() {},
    async bootstrapHousehold() {
      throw new Error("Household onboarding is only available when using the Supabase repository.");
    },
    async joinHousehold() {
      throw new Error("Household onboarding is only available when using the Supabase repository.");
    },
  };
}
