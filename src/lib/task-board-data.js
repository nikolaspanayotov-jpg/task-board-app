export const STORAGE_KEY = "household-task-board-v3";
export const SESSION_USER_KEY = "household-task-board-session-user";

export const household = {
  id: "household-1",
  name: "Home Chores",
  members: [
    { id: "nikola", name: "Nikola", shortName: "N", role: "Adult" },
    { id: "wife", name: "Wife", shortName: "W", role: "Adult" },
  ],
};

export const initialTasks = [
  {
    id: "t1",
    householdId: household.id,
    title: "Take bins out",
    description: "Put general waste and recycling out on Monday evening.",
    priority: "High",
    dueDate: "2026-04-20",
    status: "todo",
    assignedToUserId: "nikola",
    createdByUserId: "nikola",
    completedByUserId: null,
    completedAt: null,
    recurringWeekly: true,
    labels: ["Outside", "Weekly"],
    comments: [{ id: "c1", text: "Check food waste too." }],
    attachments: [],
    subtasks: [
      { id: "s1", text: "General waste", done: false },
      { id: "s2", text: "Recycling", done: false },
    ],
  },
  {
    id: "t2",
    householdId: household.id,
    title: "Vacuum downstairs",
    description: "Living room, hallway, and kitchen floor.",
    priority: "Medium",
    dueDate: "2026-04-22",
    status: "doing",
    assignedToUserId: "wife",
    createdByUserId: "nikola",
    completedByUserId: null,
    completedAt: null,
    recurringWeekly: true,
    labels: ["Cleaning"],
    comments: [],
    attachments: [],
    subtasks: [
      { id: "s3", text: "Living room", done: true },
      { id: "s4", text: "Kitchen", done: false },
    ],
  },
  {
    id: "t3",
    householdId: household.id,
    title: "Online grocery order",
    description: "Place the weekly supermarket order for delivery.",
    priority: "High",
    dueDate: "2026-04-19",
    status: "done",
    assignedToUserId: "nikola",
    createdByUserId: "wife",
    completedByUserId: "nikola",
    completedAt: "2026-04-18T10:30:00.000Z",
    recurringWeekly: true,
    labels: ["Shopping"],
    comments: [{ id: "c2", text: "Milk and nappies added." }],
    attachments: [],
    subtasks: [
      { id: "s5", text: "Check fridge", done: true },
      { id: "s6", text: "Submit order", done: true },
    ],
  },
  {
    id: "t4",
    householdId: household.id,
    title: "Clean bathroom sink",
    description: "Quick bathroom tidy before the weekend.",
    priority: "Low",
    dueDate: "2026-04-19",
    status: "todo",
    assignedToUserId: null,
    createdByUserId: "wife",
    completedByUserId: null,
    completedAt: null,
    recurringWeekly: false,
    labels: ["Cleaning"],
    comments: [],
    attachments: [],
    subtasks: [{ id: "s7", text: "Wipe sink and mirror", done: false }],
  },
];

export const columns = [
  { id: "todo", title: "To Do", subtitle: "Needs doing" },
  { id: "doing", title: "This Week", subtitle: "In progress now" },
  { id: "done", title: "Done", subtitle: "Finished chores" },
];

export function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyTask(status = "todo", options = {}) {
  const defaultMemberId = options.defaultMemberId || household.members[0]?.id || null;
  const householdId = options.householdId || household.id;

  return {
    id: uid("task"),
    householdId,
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    status,
    assignedToUserId: null,
    createdByUserId: defaultMemberId,
    completedByUserId: null,
    completedAt: null,
    recurringWeekly: false,
    labels: [],
    comments: [],
    attachments: [],
    subtasks: [],
  };
}

export function createDraftTask(currentUserId, options = {}) {
  return {
    ...createEmptyTask("todo", options),
    assignedToUserId: currentUserId,
    createdByUserId: currentUserId,
  };
}

export function cloneTask(task) {
  return JSON.parse(JSON.stringify(task));
}

export function loadTasks() {
  if (typeof window === "undefined") return initialTasks;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialTasks;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : initialTasks;
  } catch {
    return initialTasks;
  }
}

export function saveTasks(tasks) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
}

export function loadCurrentUserId(defaultUserId = household.members[0]?.id || null) {
  if (typeof window === "undefined") return defaultUserId;
  return window.localStorage.getItem(SESSION_USER_KEY) || defaultUserId;
}

export function persistCurrentUserId(userId) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_USER_KEY, userId);
  }
}

export function subscribeToTaskBoardStorage({ onTasksChange, onUserChange }) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed)) onTasksChange(parsed);
      } catch {
        // Ignore malformed storage events.
      }
    }

    if (event.key === SESSION_USER_KEY && event.newValue) {
      onUserChange(event.newValue);
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export function countCompletedSubtasks(task) {
  return task.subtasks.filter((item) => item.done).length;
}

export function getMember(userId, members = household.members) {
  return members.find((member) => member.id === userId) || null;
}

export function formatCompletedLabel(task, members = household.members) {
  if (!task.completedByUserId || !task.completedAt) return null;

  const member = getMember(task.completedByUserId, members);
  const date = new Date(task.completedAt);
  return `Done by ${member?.name || "Someone"} on ${date.toLocaleDateString()}`;
}

export function buildSearchText(task, members = household.members) {
  const labels = task.labels.join(" ");
  const comments = task.comments.map((item) => item.text).join(" ");
  const assignedName = getMember(task.assignedToUserId, members)?.name || "Unassigned";
  return `${task.title} ${task.description} ${task.priority} ${labels} ${comments} ${assignedName}`.toLowerCase();
}

export function sortWithinColumns(taskList) {
  return columns.flatMap((column) => taskList.filter((task) => task.status === column.id));
}
