# TaskFlow UI

React front end for TaskFlow, a task manager with a Kanban board, password reset, and an admin view for managing any user's tasks.

- **Live app:** https://task-management-ui-80z2.onrender.com
- **API:** https://task-management-api-q0h7.onrender.com (see the API repo's README)

## Features

- Sign up and log in with an email address or mobile number
- Forgot password: a reset link is emailed, and the reset page sets a new password
- Kanban board with To Do, In Progress, and Done columns. Drag tasks between columns.
- Create, edit, and delete tasks. Search and filter by priority.
- Summary counts, including overdue tasks, and a button to roll overdue tasks over to today
- Profile editing
- Admin view: pick any user, then create, edit, move, or delete their tasks. Add one task to all users at once.

## Tech stack

React 19 · Vite 8 · plain CSS · Fetch API

## Running locally

Requirements: Node.js 22.

```bash
npm install
```

Create a file named `.env.local` in the project root with this line:

```
VITE_API_URL=http://localhost:8080/api/tasks
```

Then start the dev server:

```bash
npm run dev
```

The app runs at http://localhost:5173. Make sure the API is running and its `CORS_ALLOWED_ORIGINS` includes that address.

Build for production with:

```bash
npm run build
```

## Configuration

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Full URL of the API's `/api/tasks` endpoint. Vite reads this at build time, so rebuild after changing it. |

## Deployment

The UI is a static site on Render. Use `npm run build` as the build command and `dist` as the publish directory. Set `VITE_API_URL` to the live API's `/api/tasks` URL. Pull requests run the build in GitHub Actions.
