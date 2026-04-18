import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Pencil,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Square,
  GripVertical,
  Repeat,
  Users,
  User,
  Home,
  Filter,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import {
  columns,
  countCompletedSubtasks,
  createEmptyTask,
  formatCompletedLabel,
  getMember,
  household,
  loadCurrentUserId,
  persistCurrentUserId,
} from "../lib/task-board-data";
import {
  cloneTask,
  createDraftTask,
  deleteTask as removeTask,
  filterTasks,
  getBoardStats,
  groupTasksByColumn,
  moveTask as moveBoardTask,
  saveTask as persistTaskDraft,
  toggleTaskSubtask as toggleBoardSubtask,
} from "../lib/task-board-service";
import { createTaskBoardRepository, getTaskBoardDataSource } from "../lib/task-board-repository";

const priorityClasses = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const columnIcons = {
  todo: CircleDashed,
  doing: Clock3,
  done: CheckCircle2,
};

function SortableTaskCard({ task, currentUserId, members, onDelete, onEdit, onToggleSubtask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignedMember = getMember(task.assignedToUserId, members);
  const completedSubtasks = countCompletedSubtasks(task);
  const completedLabel = formatCompletedLabel(task, members);
  const isMine = task.assignedToUserId === currentUserId;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isDragging ? "rotate-1 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="mt-0.5 rounded-lg p-1 text-slate-400 touch-none hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Move ${task.title}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900">{task.title}</h3>
              {task.recurringWeekly && (
                <Badge variant="secondary" className="rounded-full bg-sky-100 text-sky-700">
                  <Repeat className="mr-1 h-3 w-3" /> Weekly
                </Badge>
              )}
              {isMine && (
                <Badge variant="secondary" className="rounded-full bg-violet-100 text-violet-700">
                  Mine
                </Badge>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{task.description || "No description yet"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onEdit(task)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Edit ${task.title}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
          <User className="mr-1 h-3 w-3" />
          {assignedMember?.name || "Unassigned"}
        </Badge>
        {task.labels.map((label) => (
          <Badge key={label} variant="secondary" className="rounded-full bg-slate-100 text-slate-700">
            {label}
          </Badge>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{task.dueDate || "No date"}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <CheckSquare className="h-3.5 w-3.5" />
          <span>{completedSubtasks}/{task.subtasks.length || 0} subtasks</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{task.comments.length} comments</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-2.5 py-2">
          <Paperclip className="h-3.5 w-3.5" />
          <span>{task.attachments.length} attachments</span>
        </div>
      </div>

      {task.subtasks.length > 0 && (
        <div className="mt-3 space-y-2">
          {task.subtasks.slice(0, 2).map((subtask) => (
            <button
              key={subtask.id}
              onClick={() => onToggleSubtask(task.id, subtask.id)}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1 text-left text-xs text-slate-600 transition hover:bg-slate-50"
            >
              {subtask.done ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
              <span className={subtask.done ? "line-through text-slate-400" : ""}>{subtask.text}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <Badge variant="outline" className={`rounded-full ${priorityClasses[task.priority]}`}>
          {task.priority}
        </Badge>
        <Button variant="ghost" size="sm" className="h-8 rounded-xl px-3 text-xs" onClick={() => onEdit(task)}>
          Open details
        </Button>
      </div>

      {completedLabel && <p className="mt-2 text-xs text-slate-500">{completedLabel}</p>}
    </motion.div>
  );
}

function Column({ column, tasks, currentUserId, members, onEdit, onDelete, onToggleSubtask }) {
  const Icon = columnIcons[column.id];
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
    data: { type: "column", status: column.id },
  });

  return (
    <div className="flex min-h-[460px] flex-col rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <Icon className="h-4 w-4 text-slate-700" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{column.title}</h2>
            <p className="text-xs text-slate-500">{column.subtitle}</p>
          </div>
        </div>
        <Badge className="rounded-full bg-slate-900 text-white hover:bg-slate-900">{tasks.length}</Badge>
      </div>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`min-h-[140px] space-y-3 rounded-2xl transition ${
            isOver ? "bg-white/70 ring-2 ring-slate-200" : ""
          }`}
        >
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                members={members}
                onDelete={onDelete}
                onEdit={onEdit}
                onToggleSubtask={onToggleSubtask}
              />
            ))
          ) : (
            <div className="flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-400">
              Drop a chore here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function TaskDialog({ open, onOpenChange, task, setTask, onSave, isEditing, members }) {
  const labelsText = task.labels.join(", ");
  const [commentText, setCommentText] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [subtaskText, setSubtaskText] = useState("");

  useEffect(() => {
    if (!open) {
      setCommentText("");
      setAttachmentName("");
      setAttachmentUrl("");
      setSubtaskText("");
    }
  }, [open]);

  const updateTask = (patch) => setTask((prev) => ({ ...prev, ...patch }));

  const addComment = () => {
    const text = commentText.trim();
    if (!text) return;
    updateTask({ comments: [...task.comments, { id: uid("comment"), text }] });
    setCommentText("");
  };

  const addAttachment = () => {
    const name = attachmentName.trim();
    const url = attachmentUrl.trim();
    if (!name || !url) return;
    updateTask({ attachments: [...task.attachments, { id: uid("attachment"), name, url }] });
    setAttachmentName("");
    setAttachmentUrl("");
  };

  const addSubtask = () => {
    const text = subtaskText.trim();
    if (!text) return;
    updateTask({ subtasks: [...task.subtasks, { id: uid("subtask"), text, done: false }] });
    setSubtaskText("");
  };

  const toggleSubtask = (subtaskId) => {
    updateTask({
      subtasks: task.subtasks.map((item) => (item.id === subtaskId ? { ...item, done: !item.done } : item)),
    });
  };

  const removeComment = (commentId) => {
    updateTask({ comments: task.comments.filter((item) => item.id !== commentId) });
  };

  const removeAttachment = (attachmentId) => {
    updateTask({ attachments: task.attachments.filter((item) => item.id !== attachmentId) });
  };

  const removeSubtask = (subtaskId) => {
    updateTask({ subtasks: task.subtasks.filter((item) => item.id !== subtaskId) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit household chore" : "Create a new household chore"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 pt-2 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Input
              placeholder="Task title"
              value={task.title}
              onChange={(e) => updateTask({ title: e.target.value })}
              className="rounded-2xl"
            />
            <Textarea
              placeholder="Task description"
              value={task.description}
              onChange={(e) => updateTask({ description: e.target.value })}
              className="min-h-[120px] rounded-2xl"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Select value={task.priority} onValueChange={(value) => updateTask({ priority: value })}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={task.status} onValueChange={(value) => updateTask({ status: value })}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="doing">This Week</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                type="date"
                value={task.dueDate}
                onChange={(e) => updateTask({ dueDate: e.target.value })}
                className="rounded-2xl"
              />

              <Select
                value={task.assignedToUserId || "unassigned"}
                onValueChange={(value) => updateTask({ assignedToUserId: value === "unassigned" ? null : value })}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Assigned to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Labels</label>
              <Input
                placeholder="Cleaning, Kitchen, Weekly"
                value={labelsText}
                onChange={(e) =>
                  updateTask({
                    labels: e.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                  })
                }
                className="rounded-2xl"
              />
              <p className="text-xs text-slate-500">Separate labels with commas.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">Repeat every week</p>
                  <p className="text-xs text-slate-500">Useful for household chores that come back each week.</p>
                </div>
                <Button
                  type="button"
                  variant={task.recurringWeekly ? "default" : "outline"}
                  className="rounded-2xl"
                  onClick={() => updateTask({ recurringWeekly: !task.recurringWeekly })}
                >
                  {task.recurringWeekly ? "Weekly" : "One-off"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="rounded-3xl border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckSquare className="h-4 w-4" />
                  Subtasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Add a subtask" value={subtaskText} onChange={(e) => setSubtaskText(e.target.value)} className="rounded-2xl" />
                  <Button className="rounded-2xl" onClick={addSubtask}>Add</Button>
                </div>
                <div className="space-y-2">
                  {task.subtasks.length > 0 ? task.subtasks.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                      <button onClick={() => toggleSubtask(item.id)} className="flex min-w-0 items-center gap-2 text-left text-sm text-slate-700">
                        {item.done ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        <span className={item.done ? "line-through text-slate-400" : ""}>{item.text}</span>
                      </button>
                      <button onClick={() => removeSubtask(item.id)} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )) : <p className="text-sm text-slate-500">No subtasks yet.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Add a comment" value={commentText} onChange={(e) => setCommentText(e.target.value)} className="rounded-2xl" />
                  <Button className="rounded-2xl" onClick={addComment}>Add</Button>
                </div>
                <div className="space-y-2">
                  {task.comments.length > 0 ? task.comments.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <p>{item.text}</p>
                      <button onClick={() => removeComment(item.id)} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )) : <p className="text-sm text-slate-500">No comments yet.</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  <Input placeholder="Attachment name" value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} className="rounded-2xl" />
                  <div className="flex gap-2">
                    <Input placeholder="https://..." value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} className="rounded-2xl" />
                    <Button className="rounded-2xl" onClick={addAttachment}>Add</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {task.attachments.length > 0 ? task.attachments.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                      <a href={item.url} target="_blank" rel="noreferrer" className="truncate text-slate-700 hover:underline">{item.name}</a>
                      <button onClick={() => removeAttachment(item.id)} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )) : <p className="text-sm text-slate-500">No attachments yet.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-2xl" onClick={onSave}>
            {isEditing ? "Save changes" : "Save chore"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AuthCard({ authError, authPending, credentials, onChange, onSubmit }) {
  return (
    <Card className="mx-auto max-w-lg rounded-[28px] border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-slate-900">Sign In To Your Household Board</CardTitle>
        <p className="text-sm text-slate-600">
          Supabase mode is enabled. Sign in with an email/password account from your Supabase project.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {authError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{authError}</div>
        ) : null}
        <Input
          type="email"
          value={credentials.email}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="Email"
          className="rounded-2xl"
        />
        <Input
          type="password"
          value={credentials.password}
          onChange={(event) => onChange("password", event.target.value)}
          placeholder="Password"
          className="rounded-2xl"
        />
        <Button className="w-full rounded-2xl" onClick={onSubmit} disabled={authPending}>
          {authPending ? "Signing In..." : "Sign In"}
        </Button>
      </CardContent>
    </Card>
  );
}

function HouseholdSetupCard({
  authPending,
  householdForm,
  onboardingError,
  onChange,
  onCreateHousehold,
  onJoinHousehold,
  userEmail,
}) {
  return (
    <Card className="mx-auto max-w-2xl rounded-[28px] border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-slate-900">Connect Your Household</CardTitle>
        <p className="text-sm text-slate-600">
          Signed in as {userEmail || "your account"}. Create the first household or join an existing one.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {onboardingError ? (
          <div className="md:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {onboardingError}
          </div>
        ) : null}
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-semibold text-slate-900">Create Household</h3>
          <Input
            value={householdForm.displayName}
            onChange={(event) => onChange("displayName", event.target.value)}
            placeholder="Your display name"
            className="rounded-2xl bg-white"
          />
          <Input
            value={householdForm.householdName}
            onChange={(event) => onChange("householdName", event.target.value)}
            placeholder="Household name"
            className="rounded-2xl bg-white"
          />
          <Button className="w-full rounded-2xl" onClick={onCreateHousehold} disabled={authPending}>
            {authPending ? "Saving..." : "Create Household"}
          </Button>
        </div>
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-semibold text-slate-900">Join Household</h3>
          <Input
            value={householdForm.displayName}
            onChange={(event) => onChange("displayName", event.target.value)}
            placeholder="Your display name"
            className="rounded-2xl bg-white"
          />
          <Input
            value={householdForm.householdId}
            onChange={(event) => onChange("householdId", event.target.value)}
            placeholder="Household ID"
            className="rounded-2xl bg-white"
          />
          <Button variant="outline" className="w-full rounded-2xl" onClick={onJoinHousehold} disabled={authPending}>
            {authPending ? "Joining..." : "Join Household"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TaskBoardWebsite() {
  const repository = useMemo(() => createTaskBoardRepository(), []);
  const initialState = useMemo(() => repository.getInitialState(), [repository]);
  const initialCurrentUserId = initialState.currentUserId ?? (repository.type === "local" ? loadCurrentUserId() : null);
  const [tasks, setTasks] = useState(initialState.tasks);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [boardHousehold, setBoardHousehold] = useState(initialState.household || household);
  const [draftTask, setDraftTask] = useState(() =>
    createDraftTask(initialCurrentUserId, {
      defaultMemberId: initialCurrentUserId,
      householdId: initialState.household?.id || household.id,
    })
  );
  const [editingId, setEditingId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(initialCurrentUserId);
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [boardError, setBoardError] = useState("");
  const [authError, setAuthError] = useState("");
  const [householdForm, setHouseholdForm] = useState({
    displayName: "",
    householdId: "",
    householdName: "",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [isBusy, setIsBusy] = useState(false);
  const [isRepositoryReady, setIsRepositoryReady] = useState(repository.type === "local" || initialState.isAuthenticated);
  const [needsOnboarding, setNeedsOnboarding] = useState(initialState.needsOnboarding);
  const [userEmail, setUserEmail] = useState(initialState.userEmail || "");
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const members = boardHousehold?.members || household.members;

  useEffect(() => {
    let isCancelled = false;

    async function hydrateTasks() {
      try {
        const loadedTasks = await repository.getState();

        if (isCancelled) return;

        setTasks(loadedTasks.tasks);
        setBoardHousehold(loadedTasks.household || household);
        setCurrentUserId(loadedTasks.currentUserId ?? (repository.type === "local" ? loadCurrentUserId() : null));
        setIsAuthenticated(loadedTasks.isAuthenticated);
        setNeedsOnboarding(loadedTasks.needsOnboarding);
        setUserEmail(loadedTasks.userEmail || "");
        setBoardError("");
        setIsRepositoryReady(repository.type === "local" || loadedTasks.isAuthenticated);
      } catch (error) {
        if (isCancelled) return;

        setBoardError(error instanceof Error ? error.message : "Unable to load task board data.");
        setIsRepositoryReady(repository.type === "local");
      }
    }

    hydrateTasks();

    return () => {
      isCancelled = true;
    };
  }, [repository]);

  useEffect(() => {
    if (!isRepositoryReady) return;

    repository.saveTasks(tasks, {
      currentUserId,
      householdId: boardHousehold?.id,
    }).catch((error) => {
      setBoardError(error instanceof Error ? error.message : "Unable to save task board data.");
    });
  }, [boardHousehold?.id, currentUserId, isRepositoryReady, repository, tasks]);

  useEffect(() => {
    if (repository.type === "local") {
      persistCurrentUserId(currentUserId);
    }
  }, [currentUserId, repository.type]);

  useEffect(() => {
    return repository.subscribe({
      householdId: boardHousehold?.id,
      onStateChange: (nextState) => {
        setBoardHousehold(nextState.household || household);
        setCurrentUserId(nextState.currentUserId ?? (repository.type === "local" ? loadCurrentUserId() : null));
        setIsAuthenticated(nextState.isAuthenticated);
        setNeedsOnboarding(nextState.needsOnboarding);
        setUserEmail(nextState.userEmail || "");
      },
      onTasksChange: (nextTasks) => {
        setTasks(nextTasks);
        setBoardError("");
      },
      onUserChange: (nextUserId) => {
        if (nextUserId) {
          setCurrentUserId(nextUserId);
        }
      },
      onError: (error) => {
        setBoardError(error instanceof Error ? error.message : "Unable to subscribe to task updates.");
      },
    });
  }, [boardHousehold?.id, repository]);

  useEffect(() => {
    return repository.subscribeAuth({
      onAuthChange: (nextState) => {
        setTasks(nextState.tasks);
        setBoardHousehold(nextState.household || household);
        setCurrentUserId(nextState.currentUserId ?? (repository.type === "local" ? loadCurrentUserId() : null));
        setIsAuthenticated(nextState.isAuthenticated);
        setNeedsOnboarding(nextState.needsOnboarding);
        setUserEmail(nextState.userEmail || "");
        setBoardError("");
        setAuthError("");
        setIsRepositoryReady(repository.type === "local" || nextState.isAuthenticated);
      },
      onError: (error) => {
        setAuthError(error instanceof Error ? error.message : "Unable to sync auth state.");
      },
    });
  }, [repository]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredTasks = useMemo(() => {
    return filterTasks(tasks, search, assigneeFilter, currentUserId, members);
  }, [currentUserId, members, search, tasks, assigneeFilter]);

  const { taskCount, doneCount, progress, totalSubtasks, completedSubtasks, weeklyRecurringCount } = useMemo(
    () => getBoardStats(tasks),
    [tasks]
  );

  const groupedTasks = useMemo(() => {
    return groupTasksByColumn(filteredTasks);
  }, [filteredTasks]);

  const openNewTask = () => {
    setEditingId(null);
    setDraftTask(
      createDraftTask(currentUserId, {
        defaultMemberId: currentUserId,
        householdId: boardHousehold?.id || household.id,
      })
    );
    setOpen(true);
  };

  const openEditTask = (task) => {
    setEditingId(task.id);
    setDraftTask(cloneTask(task));
    setOpen(true);
  };

  const handleSaveTask = () => {
    if (!draftTask.title.trim()) return;

    setTasks((prev) => persistTaskDraft(prev, draftTask, editingId, currentUserId, boardHousehold?.id || household.id));
    setOpen(false);
    setEditingId(null);
    setDraftTask(
      createEmptyTask("todo", {
        defaultMemberId: currentUserId,
        householdId: boardHousehold?.id || household.id,
      })
    );
  };

  const handleDeleteTask = (taskId) => {
    setTasks((prev) => removeTask(prev, taskId));
    if (editingId === taskId) {
      setOpen(false);
      setEditingId(null);
      setDraftTask(
        createEmptyTask("todo", {
          defaultMemberId: currentUserId,
          householdId: boardHousehold?.id || household.id,
        })
      );
    }
  };

  const handleToggleSubtask = (taskId, subtaskId) => {
    setTasks((prev) => toggleBoardSubtask(prev, taskId, subtaskId, currentUserId));
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    setTasks((prev) => moveBoardTask(prev, active.id, over.id, currentUserId));
  };

  const currentUser = getMember(currentUserId, members);

  const updateCredential = (field, value) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  const updateHouseholdForm = (field, value) => {
    setHouseholdForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async () => {
    setIsBusy(true);
    setAuthError("");

    try {
      await repository.signIn(credentials);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSignOut = async () => {
    setIsBusy(true);
    setAuthError("");

    try {
      await repository.signOut();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign out.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateHousehold = async () => {
    setIsBusy(true);
    setAuthError("");

    try {
      await repository.bootstrapHousehold({
        displayName: householdForm.displayName,
        householdName: householdForm.householdName,
      });
      const nextState = await repository.getState();
      setTasks(nextState.tasks);
      setBoardHousehold(nextState.household || household);
      setCurrentUserId(nextState.currentUserId ?? currentUserId);
      setNeedsOnboarding(nextState.needsOnboarding);
      setIsRepositoryReady(true);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to create household.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoinHousehold = async () => {
    setIsBusy(true);
    setAuthError("");

    try {
      await repository.joinHousehold({
        displayName: householdForm.displayName,
        householdId: householdForm.householdId,
      });
      const nextState = await repository.getState();
      setTasks(nextState.tasks);
      setBoardHousehold(nextState.household || household);
      setCurrentUserId(nextState.currentUserId ?? currentUserId);
      setNeedsOnboarding(nextState.needsOnboarding);
      setIsRepositoryReady(true);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to join household.");
    } finally {
      setIsBusy(false);
    }
  };

  if (repository.supportsAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-4 md:p-8">
        <div className="mx-auto max-w-7xl pt-10">
          <AuthCard
            authError={authError || boardError}
            authPending={isBusy}
            credentials={credentials}
            onChange={updateCredential}
            onSubmit={handleSignIn}
          />
        </div>
      </div>
    );
  }

  if (repository.supportsAuth && needsOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-4 md:p-8">
        <div className="mx-auto max-w-7xl pt-10">
          <HouseholdSetupCard
            authPending={isBusy}
            householdForm={householdForm}
            onboardingError={authError || boardError}
            onChange={updateHouseholdForm}
            onCreateHousehold={handleCreateHousehold}
            onJoinHousehold={handleJoinHousehold}
            userEmail={userEmail}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 grid gap-4 lg:grid-cols-[1.8fr_1fr]">
          <Card className="rounded-[28px] border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-slate-900 md:text-3xl">
                    <Home className="h-7 w-7" />
                    {boardHousehold?.name || household.name}
                  </CardTitle>
                  <p className="mt-2 text-sm text-slate-600">
                    A shared weekly chore board for your household. This version is structured for two people, with assignment, recurring chores, completed-by tracking, and cross-tab syncing.
                  </p>
                </div>
                {repository.type === "local" ? (
                  <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Viewing as</p>
                    <Select value={currentUserId} onValueChange={setCurrentUserId}>
                      <SelectTrigger className="rounded-2xl bg-white">
                        <SelectValue placeholder="Choose person" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Signed in as</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm text-slate-700">{userEmail || currentUser?.name || "Unknown user"}</p>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={handleSignOut} disabled={isBusy}>
                        Sign Out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full">
                  Data source: {getTaskBoardDataSource()}
                </Badge>
                {boardError ? (
                  <Badge variant="outline" className="rounded-full border-rose-200 bg-rose-50 text-rose-700">
                    {boardError}
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative w-full md:max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search chores, labels, comments, or assignee"
                      className="h-11 rounded-2xl border-slate-200 bg-white pl-9"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-500">
                      <Filter className="h-4 w-4" />
                    </div>
                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                      <SelectTrigger className="h-11 w-[190px] rounded-2xl bg-white">
                        <SelectValue placeholder="Filter tasks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="mine">Mine</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button className="h-11 rounded-2xl px-5 text-sm font-medium shadow-sm" onClick={openNewTask}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Chore
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Household progress</p>
                  <h3 className="mt-1 text-3xl font-semibold text-slate-900">{progress}%</h3>
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right">
                  <p className="text-xs text-slate-500">Completed</p>
                  <p className="text-lg font-semibold text-slate-900">{doneCount} / {taskCount}</p>
                </div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full bg-slate-900" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    <span>{weeklyRecurringCount} weekly</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    <span>{completedSubtasks}/{totalSubtasks} subtasks</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{members.length} members</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{currentUser?.name || "Unknown"}</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                This demo now behaves like a household board. It syncs between browser tabs on the same device. To make it truly shared across your and your wife’s devices, swap the storage layer to Supabase or Firebase next.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 lg:grid-cols-3">
            {columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                tasks={groupedTasks[column.id] || []}
                currentUserId={currentUserId}
                members={members}
                onEdit={openEditTask}
                onDelete={handleDeleteTask}
                onToggleSubtask={handleToggleSubtask}
              />
            ))}
          </div>
        </DndContext>

        <TaskDialog
          open={open}
          onOpenChange={setOpen}
          task={draftTask}
          setTask={setDraftTask}
          onSave={handleSaveTask}
          isEditing={Boolean(editingId)}
          members={members}
        />

        <Card className="mt-6 rounded-[28px] border-slate-200 shadow-sm">
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Added for shared household use</h3>
              <p className="mt-2 text-sm text-slate-600">
                Household members, task assignment, recurring weekly chores, completed-by tracking, and filters for mine or unassigned tasks.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">What this simulates now</h3>
              <p className="mt-2 text-sm text-slate-600">
                Two-person usage with cross-tab updates on one device, which helps you test the shared workflow before connecting a real backend.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Next production change</h3>
              <p className="mt-2 text-sm text-slate-600">
                Replace localStorage with Supabase tables for tasks, subtasks, comments, auth, and realtime so both of you can use it on separate devices.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
