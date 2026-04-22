export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

export type Task = {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  tags: string[];
  assignee: string;
};

export const COLUMNS: { id: Status; label: string }[] = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "IN_REVIEW", label: "In Review" },
  { id: "DONE", label: "Done" },
];

export const MOCK_TASKS: Task[] = [
  { id: "t1", title: "Set up CI/CD pipeline", status: "TODO", priority: "high", tags: ["DevOps"], assignee: "AK" },
  { id: "t2", title: "Design auth flow screens", status: "TODO", priority: "medium", tags: ["Design", "Auth"], assignee: "SR" },
  { id: "t3", title: "Write API documentation", status: "TODO", priority: "low", tags: ["Docs"], assignee: "MJ" },
  { id: "t4", title: "Implement JWT refresh logic", status: "IN_PROGRESS", priority: "urgent", tags: ["Auth", "Backend"], assignee: "AS" },
  { id: "t5", title: "Build kanban board UI", status: "IN_PROGRESS", priority: "high", tags: ["Frontend"], assignee: "AS" },
  { id: "t6", title: "Integrate Stripe billing", status: "IN_PROGRESS", priority: "medium", tags: ["Billing"], assignee: "AK" },
  { id: "t7", title: "Code review: workspace module", status: "IN_REVIEW", priority: "medium", tags: ["Backend"], assignee: "SR" },
  { id: "t8", title: "QA: signup & login flow", status: "IN_REVIEW", priority: "high", tags: ["QA", "Auth"], assignee: "MJ" },
  { id: "t9", title: "Deploy to staging", status: "DONE", priority: "high", tags: ["DevOps"], assignee: "AK" },
  { id: "t10", title: "Set up Postgres schema", status: "DONE", priority: "urgent", tags: ["Backend", "DB"], assignee: "AS" },
];
