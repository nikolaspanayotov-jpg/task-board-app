import { columns, sortWithinColumns } from "./task-board-data";
import { getSupabaseClient } from "./task-board-supabase";

const EMPTY_BOARD_STATE = {
  currentUserId: null,
  household: null,
  isAuthenticated: false,
  needsOnboarding: false,
  tasks: [],
  userEmail: "",
};

function createShortName(displayName) {
  return (displayName || "?").trim().slice(0, 1).toUpperCase() || "?";
}

function sortTasksForBoard(tasks) {
  const columnOrder = new Map(columns.map((column, index) => [column.id, index]));

  return [...tasks]
    .sort((left, right) => {
      const leftColumnOrder = columnOrder.get(left.status) ?? 999;
      const rightColumnOrder = columnOrder.get(right.status) ?? 999;

      if (leftColumnOrder !== rightColumnOrder) {
        return leftColumnOrder - rightColumnOrder;
      }

      const leftPosition = left.position ?? 0;
      const rightPosition = right.position ?? 0;

      if (leftPosition !== rightPosition) {
        return leftPosition - rightPosition;
      }

      return left.title.localeCompare(right.title);
    })
    .map(({ position, ...task }) => task);
}

function mapMembers(memberRows) {
  return memberRows.map((member) => ({
    id: member.user_id,
    name: member.display_name,
    role: member.role,
    shortName: createShortName(member.display_name),
  }));
}

function mapTasks(taskRows, subtasks, comments, attachments) {
  const subtasksByTaskId = new Map();
  const commentsByTaskId = new Map();
  const attachmentsByTaskId = new Map();

  subtasks.forEach((subtask) => {
    if (!subtasksByTaskId.has(subtask.task_id)) {
      subtasksByTaskId.set(subtask.task_id, []);
    }

    subtasksByTaskId.get(subtask.task_id).push({
      createdAt: subtask.created_at,
      done: subtask.done,
      id: subtask.id,
      text: subtask.text,
    });
  });

  comments.forEach((comment) => {
    if (!commentsByTaskId.has(comment.task_id)) {
      commentsByTaskId.set(comment.task_id, []);
    }

    commentsByTaskId.get(comment.task_id).push({
      createdAt: comment.created_at,
      id: comment.id,
      text: comment.text,
      userId: comment.user_id,
    });
  });

  attachments.forEach((attachment) => {
    if (!attachmentsByTaskId.has(attachment.task_id)) {
      attachmentsByTaskId.set(attachment.task_id, []);
    }

    attachmentsByTaskId.get(attachment.task_id).push({
      createdAt: attachment.created_at,
      id: attachment.id,
      name: attachment.name,
      url: attachment.url,
      userId: attachment.user_id,
    });
  });

  const mappedTasks = taskRows.map((task) => ({
    assignedToUserId: task.assigned_to_user_id,
    attachments: attachmentsByTaskId.get(task.id) || [],
    comments: commentsByTaskId.get(task.id) || [],
    completedAt: task.completed_at,
    completedByUserId: task.completed_by_user_id,
    createdByUserId: task.created_by_user_id,
    description: task.description || "",
    dueDate: task.due_date || "",
    householdId: task.household_id,
    id: task.id,
    labels: task.labels || [],
    position: task.position,
    priority: task.priority,
    recurringWeekly: task.recurring_weekly,
    status: task.status,
    subtasks: subtasksByTaskId.get(task.id) || [],
    title: task.title,
  }));

  return sortTasksForBoard(mappedTasks);
}

async function fetchHouseholdMembership(supabase, userId) {
  const { data, error } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load household membership: ${error.message}`);
  }

  return data;
}

async function fetchBoardState(supabase, session) {
  if (!session?.user) {
    return EMPTY_BOARD_STATE;
  }

  const currentUserId = session.user.id;
  const membership = await fetchHouseholdMembership(supabase, currentUserId);

  if (!membership) {
    return {
      currentUserId,
      household: null,
      isAuthenticated: true,
      needsOnboarding: true,
      tasks: [],
      userEmail: session.user.email || "",
    };
  }

  const householdId = membership.household_id;

  const [
    { data: householdRow, error: householdError },
    { data: memberRows, error: membersError },
    { data: taskRows, error: tasksError },
  ] = await Promise.all([
    supabase.from("households").select("id, name").eq("id", householdId).single(),
    supabase
      .from("household_members")
      .select("user_id, display_name, role, created_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select(
        "id, household_id, title, description, priority, due_date, status, assigned_to_user_id, created_by_user_id, completed_by_user_id, completed_at, recurring_weekly, labels, position"
      )
      .eq("household_id", householdId),
  ]);

  if (householdError) {
    throw new Error(`Unable to load household: ${householdError.message}`);
  }

  if (membersError) {
    throw new Error(`Unable to load household members: ${membersError.message}`);
  }

  if (tasksError) {
    throw new Error(`Unable to load tasks: ${tasksError.message}`);
  }

  const taskIds = (taskRows || []).map((task) => task.id);

  const [
    { data: subtaskRows, error: subtasksError },
    { data: commentRows, error: commentsError },
    { data: attachmentRows, error: attachmentsError },
  ] = taskIds.length
    ? await Promise.all([
        supabase.from("subtasks").select("id, task_id, text, done, position, created_at").in("task_id", taskIds).order("position"),
        supabase.from("comments").select("id, task_id, user_id, text, created_at").in("task_id", taskIds).order("created_at"),
        supabase.from("attachments").select("id, task_id, user_id, name, url, created_at").in("task_id", taskIds).order("created_at"),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];

  if (subtasksError) {
    throw new Error(`Unable to load subtasks: ${subtasksError.message}`);
  }

  if (commentsError) {
    throw new Error(`Unable to load comments: ${commentsError.message}`);
  }

  if (attachmentsError) {
    throw new Error(`Unable to load attachments: ${attachmentsError.message}`);
  }

  return {
    currentUserId,
    household: {
      id: householdRow.id,
      members: mapMembers(memberRows || []),
      name: householdRow.name,
    },
    isAuthenticated: true,
    needsOnboarding: false,
    tasks: mapTasks(taskRows || [], subtaskRows || [], commentRows || [], attachmentRows || []),
    userEmail: session.user.email || "",
  };
}

function buildTaskPayloads(tasks, householdId, currentUserId) {
  const positionsByColumn = new Map(columns.map((column) => [column.id, 0]));

  return tasks.map((task) => {
    const position = positionsByColumn.get(task.status) ?? 0;
    positionsByColumn.set(task.status, position + 1);

    return {
      assigned_to_user_id: task.assignedToUserId || null,
      completed_at: task.status === "done" ? task.completedAt || new Date().toISOString() : null,
      completed_by_user_id: task.status === "done" ? task.completedByUserId || currentUserId : null,
      created_by_user_id: task.createdByUserId || currentUserId,
      description: task.description || "",
      due_date: task.dueDate || null,
      household_id: householdId,
      id: task.id,
      labels: task.labels || [],
      position,
      priority: task.priority,
      recurring_weekly: Boolean(task.recurringWeekly),
      status: task.status,
      title: task.title.trim(),
    };
  });
}

function buildSubtaskPayloads(tasks) {
  return tasks.flatMap((task) =>
    task.subtasks.map((subtask, index) => ({
      done: Boolean(subtask.done),
      id: subtask.id,
      position: index,
      task_id: task.id,
      text: subtask.text,
    }))
  );
}

function buildCommentPayloads(tasks, currentUserId) {
  return tasks.flatMap((task) =>
    task.comments.map((comment) => ({
      id: comment.id,
      task_id: task.id,
      text: comment.text,
      user_id: comment.userId || currentUserId,
    }))
  );
}

function buildAttachmentPayloads(tasks, currentUserId) {
  return tasks.flatMap((task) =>
    task.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      task_id: task.id,
      url: attachment.url,
      user_id: attachment.userId || currentUserId,
    }))
  );
}

async function deleteRemovedRows(supabase, table, existingIds, nextIds) {
  const idsToDelete = existingIds.filter((id) => !nextIds.includes(id));

  if (!idsToDelete.length) {
    return;
  }

  const { error } = await supabase.from(table).delete().in("id", idsToDelete);

  if (error) {
    throw new Error(`Unable to remove deleted ${table}: ${error.message}`);
  }
}

async function upsertTaskGraph(supabase, tasks, householdId, currentUserId) {
  if (!householdId) {
    throw new Error("Cannot save tasks without a household.");
  }

  const taskPayloads = buildTaskPayloads(tasks, householdId, currentUserId);
  const nextTaskIds = taskPayloads.map((task) => task.id);

  if (!taskPayloads.length) {
    const { error } = await supabase.from("tasks").delete().eq("household_id", householdId);

    if (error) {
      throw new Error(`Unable to clear tasks: ${error.message}`);
    }

    return;
  }

  const { data: existingTaskRows, error: existingTasksError } = await supabase
    .from("tasks")
    .select("id")
    .eq("household_id", householdId);

  if (existingTasksError) {
    throw new Error(`Unable to inspect existing tasks: ${existingTasksError.message}`);
  }

  const { error: upsertTasksError } = await supabase.from("tasks").upsert(taskPayloads, { onConflict: "id" });

  if (upsertTasksError) {
    throw new Error(`Unable to save tasks: ${upsertTasksError.message}`);
  }

  await deleteRemovedRows(
    supabase,
    "tasks",
    (existingTaskRows || []).map((row) => row.id),
    nextTaskIds
  );

  const [
    { data: existingSubtaskRows, error: existingSubtasksError },
    { data: existingCommentRows, error: existingCommentsError },
    { data: existingAttachmentRows, error: existingAttachmentsError },
  ] = await Promise.all([
    supabase.from("subtasks").select("id").in("task_id", nextTaskIds),
    supabase.from("comments").select("id").in("task_id", nextTaskIds),
    supabase.from("attachments").select("id").in("task_id", nextTaskIds),
  ]);

  if (existingSubtasksError) {
    throw new Error(`Unable to inspect existing subtasks: ${existingSubtasksError.message}`);
  }

  if (existingCommentsError) {
    throw new Error(`Unable to inspect existing comments: ${existingCommentsError.message}`);
  }

  if (existingAttachmentsError) {
    throw new Error(`Unable to inspect existing attachments: ${existingAttachmentsError.message}`);
  }

  const subtaskPayloads = buildSubtaskPayloads(tasks);
  const commentPayloads = buildCommentPayloads(tasks, currentUserId);
  const attachmentPayloads = buildAttachmentPayloads(tasks, currentUserId);

  if (subtaskPayloads.length) {
    const { error } = await supabase.from("subtasks").upsert(subtaskPayloads, { onConflict: "id" });

    if (error) {
      throw new Error(`Unable to save subtasks: ${error.message}`);
    }
  }

  if (commentPayloads.length) {
    const { error } = await supabase.from("comments").upsert(commentPayloads, { onConflict: "id" });

    if (error) {
      throw new Error(`Unable to save comments: ${error.message}`);
    }
  }

  if (attachmentPayloads.length) {
    const { error } = await supabase.from("attachments").upsert(attachmentPayloads, { onConflict: "id" });

    if (error) {
      throw new Error(`Unable to save attachments: ${error.message}`);
    }
  }

  await deleteRemovedRows(
    supabase,
    "subtasks",
    (existingSubtaskRows || []).map((row) => row.id),
    subtaskPayloads.map((row) => row.id)
  );
  await deleteRemovedRows(
    supabase,
    "comments",
    (existingCommentRows || []).map((row) => row.id),
    commentPayloads.map((row) => row.id)
  );
  await deleteRemovedRows(
    supabase,
    "attachments",
    (existingAttachmentRows || []).map((row) => row.id),
    attachmentPayloads.map((row) => row.id)
  );
}

async function callHouseholdRpc(name, payload) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc(name, payload);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function createSupabaseTaskBoardRepository() {
  return {
    supportsAuth: true,
    type: "supabase",
    getInitialState() {
      return EMPTY_BOARD_STATE;
    },
    async getState() {
      const supabase = getSupabaseClient();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw new Error(`Unable to read auth session: ${error.message}`);
      }

      return fetchBoardState(supabase, session);
    },
    async getTasks() {
      return this.getState();
    },
    async saveTasks(tasks, context) {
      const supabase = getSupabaseClient();
      await upsertTaskGraph(supabase, sortWithinColumns(tasks), context.householdId, context.currentUserId);
    },
    subscribe({ householdId, onError, onStateChange, onTasksChange, onUserChange }) {
      const supabase = getSupabaseClient();

      if (!householdId) {
        return () => {};
      }

      const refresh = async () => {
        try {
          const state = await this.getState();
          onTasksChange(state.tasks);
          onUserChange(state.currentUserId);
          onStateChange(state);
        } catch (error) {
          onError(error);
        }
      };

      const channel = supabase
        .channel(`task-board-${householdId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `household_id=eq.${householdId}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "household_members", filter: `household_id=eq.${householdId}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "subtasks" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "attachments" }, refresh)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    subscribeAuth({ onAuthChange, onError }) {
      const supabase = getSupabaseClient();
      const { data } = supabase.auth.onAuthStateChange(async () => {
        try {
          const state = await this.getState();
          onAuthChange(state);
        } catch (error) {
          onError(error);
        }
      });

      return () => {
        data.subscription.unsubscribe();
      };
    },
    async signIn({ email, password }) {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw new Error(error.message);
      }
    },
    async signOut() {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }
    },
    async bootstrapHousehold({ displayName, householdName }) {
      await callHouseholdRpc("bootstrap_household", {
        p_display_name: displayName,
        p_household_name: householdName,
      });
    },
    async joinHousehold({ displayName, householdId }) {
      await callHouseholdRpc("join_household", {
        p_display_name: displayName,
        p_household_id: householdId,
      });
    },
  };
}
