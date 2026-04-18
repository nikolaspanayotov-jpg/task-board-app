import {
  buildSearchText,
  cloneTask,
  columns,
  countCompletedSubtasks,
  createDraftTask,
  household,
  sortWithinColumns,
  uid,
} from "./task-board-data";

export { createDraftTask, cloneTask };

export function filterTasks(tasks, search, assigneeFilter, currentUserId, members) {
  const query = search.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesSearch = !query || buildSearchText(task, members).includes(query);
    const matchesAssignee =
      assigneeFilter === "all" ||
      (assigneeFilter === "mine" && task.assignedToUserId === currentUserId) ||
      (assigneeFilter === "unassigned" && !task.assignedToUserId) ||
      task.assignedToUserId === assigneeFilter;

    return matchesSearch && matchesAssignee;
  });
}

export function groupTasksByColumn(tasks) {
  return columns.reduce((accumulator, column) => {
    accumulator[column.id] = tasks.filter((task) => task.status === column.id);
    return accumulator;
  }, {});
}

export function getBoardStats(tasks) {
  const taskCount = tasks.length;
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const progress = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;
  const totalSubtasks = tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
  const completedSubtasks = tasks.reduce((sum, task) => sum + countCompletedSubtasks(task), 0);
  const weeklyRecurringCount = tasks.filter((task) => task.recurringWeekly).length;

  return {
    completedSubtasks,
    doneCount,
    progress,
    taskCount,
    totalSubtasks,
    weeklyRecurringCount,
  };
}

export function saveTask(tasks, draftTask, editingId, currentUserId, householdId = household.id) {
  const cleanedTask = {
    ...draftTask,
    title: draftTask.title.trim(),
    description: draftTask.description.trim(),
    createdByUserId: draftTask.createdByUserId || currentUserId,
    householdId,
    completedByUserId: draftTask.status === "done" ? draftTask.completedByUserId || currentUserId : null,
    completedAt: draftTask.status === "done" ? draftTask.completedAt || new Date().toISOString() : null,
  };

  if (editingId) {
    return sortWithinColumns(tasks.map((task) => (task.id === editingId ? cleanedTask : task)));
  }

  return sortWithinColumns([{ ...cleanedTask, id: uid("task") }, ...tasks]);
}

export function deleteTask(tasks, taskId) {
  return tasks.filter((task) => task.id !== taskId);
}

export function toggleTaskSubtask(tasks, taskId, subtaskId, currentUserId) {
  return tasks.map((task) => {
    if (task.id !== taskId) return task;

    const updatedSubtasks = task.subtasks.map((item) =>
      item.id === subtaskId ? { ...item, done: !item.done } : item
    );
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((item) => item.done);

    return {
      ...task,
      subtasks: updatedSubtasks,
      status: allDone ? "done" : task.status === "done" ? "doing" : task.status,
      completedByUserId: allDone ? currentUserId : null,
      completedAt: allDone ? new Date().toISOString() : null,
    };
  });
}

export function moveTask(tasks, activeId, overId, currentUserId) {
  const activeTask = tasks.find((task) => task.id === activeId);
  if (!activeTask) return tasks;

  const overTask = tasks.find((task) => task.id === overId);
  const targetStatus = overTask?.status || columns.find((column) => column.id === overId)?.id;
  if (!targetStatus) return tasks;

  const activeColumnTasks = tasks.filter((task) => task.status === activeTask.status);
  const oldIndex = activeColumnTasks.findIndex((task) => task.id === activeId);

  if (activeTask.status === targetStatus) {
    const newIndex = overTask ? activeColumnTasks.findIndex((task) => task.id === overId) : activeColumnTasks.length - 1;

    if (newIndex < 0 || newIndex === oldIndex) {
      return tasks;
    }

    const reorderedColumn = [...activeColumnTasks];
    const [moved] = reorderedColumn.splice(oldIndex, 1);
    reorderedColumn.splice(newIndex, 0, moved);

    const otherTasks = tasks.filter((task) => task.status !== activeTask.status);
    return sortWithinColumns([...otherTasks, ...reorderedColumn]);
  }

  const sourceWithoutActive = tasks.filter((task) => task.id !== activeId);
  const destinationColumnTasks = sourceWithoutActive.filter((task) => task.status === targetStatus);
  const destinationIndex = overTask
    ? destinationColumnTasks.findIndex((task) => task.id === overId)
    : destinationColumnTasks.length;

  const movedTask = {
    ...activeTask,
    status: targetStatus,
    completedByUserId: targetStatus === "done" ? currentUserId : null,
    completedAt: targetStatus === "done" ? new Date().toISOString() : null,
  };

  const newDestination = [...destinationColumnTasks];
  newDestination.splice(destinationIndex, 0, movedTask);

  const remaining = sourceWithoutActive.filter((task) => task.status !== targetStatus);
  return sortWithinColumns([...remaining, ...newDestination]);
}
