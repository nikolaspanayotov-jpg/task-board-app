import { createLocalTaskBoardRepository } from "./task-board-local-repository";
import { createSupabaseTaskBoardRepository } from "./task-board-supabase-repository";

const DATA_SOURCE_LOCAL = "local";
const DATA_SOURCE_SUPABASE = "supabase";

export function getTaskBoardDataSource() {
  return import.meta.env.VITE_TASK_BOARD_DATA_SOURCE === DATA_SOURCE_SUPABASE
    ? DATA_SOURCE_SUPABASE
    : DATA_SOURCE_LOCAL;
}

export function createTaskBoardRepository() {
  return getTaskBoardDataSource() === DATA_SOURCE_SUPABASE
    ? createSupabaseTaskBoardRepository()
    : createLocalTaskBoardRepository();
}
