![1776836785023](image/react-feature/1776836785023.png)![1776836789069](image/react-feature/1776836789069.png)# Skill: Build a Frontend React Feature

**Load this skill when:** building something in `client/` — a new page, a form, a feature slice like task board, workspace switcher, login screen.

## Stack reminder

- Vite + React 18+ + TypeScript strict
- TanStack Query for **server state** (data from the API — workspaces, tasks, user)
- Zustand for **UI state** (modals, active workspace, filter selections)
- React Router for navigation
- React Hook Form + zod for forms
- Tailwind for styling
- axios for HTTP, configured with `withCredentials: true` so cookies are sent

## Folder layout for a feature

```
client/src/features/<feature>/
├── api.ts                    axios calls + TanStack Query hooks
├── schemas.ts                zod schemas for forms (mirror server schemas)
├── <Feature>Page.tsx         route-level component
├── components/
│   ├── <Feature>List.tsx
│   ├── <Feature>Form.tsx
│   └── ...
└── store.ts                  Zustand slice (only if feature has UI state)
```

## State rules — do not blur these

- **Server state** (anything that came from the API) lives in TanStack Query. Never copy it into Zustand or `useState`.
- **UI state** (is modal open, selected filters, active workspace id) lives in Zustand if it's shared, `useState` if it's local to one component.
- **Form state** lives in React Hook Form. Never mix form state with Zustand.

## Pattern: API hook

```ts
// features/tasks/api.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/axios"; // preconfigured axios instance

export function useTasks(projectId: string, filters: TaskFilters) {
  return useQuery({
    queryKey: ["tasks", projectId, filters],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/tasks`, { params: filters });
      return data;
    },
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data } = await api.post(`/projects/${projectId}/tasks`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", projectId] }),
  });
}
```

## Pattern: form

```tsx
const { register, handleSubmit, formState: { errors } } = useForm<CreateTaskInput>({
  resolver: zodResolver(CreateTaskSchema),
});
const createTask = useCreateTask(projectId);

const onSubmit = (data: CreateTaskInput) => createTask.mutate(data);
```

## Pattern: protected route

Wrap protected routes in an `AuthGuard` that calls `useMe()` (hits `/api/auth/me`). On 401, redirect to `/login`. Don't gate on localStorage — we use cookies, so "am I logged in" is answered by hitting the server.

## axios setup (`client/src/lib/axios.ts`)

```ts
import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // REQUIRED for cookies
});
```

And the backend must send `Access-Control-Allow-Credentials: true` (it does, via `cors({ credentials: true })`).

## Anti-patterns to avoid

- ❌ Storing the user object in Zustand — it's server state, use TanStack Query
- ❌ useEffect with fetch for data loading — use useQuery
- ❌ Prop-drilling workspace id five levels deep — put it in a Zustand slice or a React context
- ❌ Reimplementing pagination state — use TanStack Query's `useInfiniteQuery`
- ❌ Building a global loading spinner by tracking a `loading` boolean in Zustand — use `isLoading` from the query hook per-component

## Verification

- `npm run dev` in `client/` — Vite starts, page renders
- Open browser devtools → Network. Hit the page. Requests should:
  - Go to `http://localhost:5000/api/...`
  - Include `cookie:` header (after login)
  - Receive 2xx responses
- React Query devtools (add `@tanstack/react-query-devtools`) is very helpful during development
