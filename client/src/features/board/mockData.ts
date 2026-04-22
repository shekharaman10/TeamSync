export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type Role = "OWNER" | "ADMIN" | "MEMBER";

export type Task = {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  tags: string[];
  assignee: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  color: string;
  joinedAt: string;
};

export const COLUMNS: { id: Status; label: string }[] = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "IN_REVIEW", label: "In Review" },
  { id: "DONE", label: "Done" },
];

export const MOCK_TASKS: Task[] = [
  { id: "t1",  title: "Set up CI/CD pipeline",           status: "TODO",        priority: "high",   tags: ["DevOps"],           assignee: "AK" },
  { id: "t2",  title: "Design auth flow screens",         status: "TODO",        priority: "medium", tags: ["Design", "Auth"],   assignee: "SR" },
  { id: "t3",  title: "Write API documentation",          status: "TODO",        priority: "low",    tags: ["Docs"],             assignee: "MJ" },
  { id: "t4",  title: "Implement JWT refresh logic",      status: "IN_PROGRESS", priority: "urgent", tags: ["Auth", "Backend"],  assignee: "AS" },
  { id: "t5",  title: "Build kanban board UI",            status: "IN_PROGRESS", priority: "high",   tags: ["Frontend"],         assignee: "AS" },
  { id: "t6",  title: "Integrate Stripe billing",         status: "IN_PROGRESS", priority: "medium", tags: ["Billing"],          assignee: "AK" },
  { id: "t7",  title: "Code review: workspace module",    status: "IN_REVIEW",   priority: "medium", tags: ["Backend"],          assignee: "SR" },
  { id: "t8",  title: "QA: signup & login flow",          status: "IN_REVIEW",   priority: "high",   tags: ["QA", "Auth"],       assignee: "MJ" },
  { id: "t9",  title: "Deploy to staging",                status: "DONE",        priority: "high",   tags: ["DevOps"],           assignee: "AK" },
  { id: "t10", title: "Set up Postgres schema",           status: "DONE",        priority: "urgent", tags: ["Backend", "DB"],    assignee: "AS" },
  { id: "t11", title: "Add workspace invite flow",        status: "TODO",        priority: "medium", tags: ["Backend", "Auth"],  assignee: "AK" },
  { id: "t12", title: "Mobile responsive layout",         status: "TODO",        priority: "low",    tags: ["Frontend"],         assignee: "SR" },
  { id: "t13", title: "Email notification templates",     status: "IN_PROGRESS", priority: "low",    tags: ["Backend"],          assignee: "MJ" },
  { id: "t14", title: "Performance audit",                status: "DONE",        priority: "medium", tags: ["DevOps", "Frontend"],assignee: "SR" },
];

export const MOCK_MEMBERS: Member[] = [
  { id: "m1", name: "Aman Shekhar",  email: "aman@teamsync.com",  role: "OWNER",  initials: "AS", color: "bg-teal-500/20 text-teal-300",   joinedAt: "Jan 2026" },
  { id: "m2", name: "Arjun Kumar",   email: "arjun@teamsync.com", role: "ADMIN",  initials: "AK", color: "bg-sky-500/20 text-sky-300",      joinedAt: "Jan 2026" },
  { id: "m3", name: "Sara Reddy",    email: "sara@teamsync.com",  role: "MEMBER", initials: "SR", color: "bg-violet-500/20 text-violet-300", joinedAt: "Feb 2026" },
  { id: "m4", name: "Mihail Joiner", email: "mj@teamsync.com",    role: "MEMBER", initials: "MJ", color: "bg-amber-500/20 text-amber-300",  joinedAt: "Feb 2026" },
];
