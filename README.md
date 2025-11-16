# Full Stack App — React + Node.js + PostgreSQL

A modern full-stack application built with:

- **Client:** React + Vite (JavaScript)
- **Server:** Node.js + Express
- **Database:** PostgreSQL (via `pg` driver)

The project uses a simple monorepo structure with separate `client` and `server` workspaces.

---

## 📋 Table of Contents

- [System Requirements](#-system-requirements)
- [Project Installation](#-project-installation)
- [Running the Project](#️-running-the-project)
- [Environment Variables](#-environment-variables)
- [Git Workflow](#-git-workflow)
- [Available Scripts](#-available-scripts)

---

## 🛠 System Requirements

- **Node.js >= 18**
- **npm >= 9**
- **PostgreSQL >= 14**
- **Git**

---

## 🚀 Project Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Install dependencies

Install client dependencies:

```bash
cd client
npm install
```

Install server dependencies:

```bash
cd ../server
npm install
```

## 🏃‍♂️ Running the Project

### 🖥 Start the Server (backend)

```bash
cd server
npm run dev
```

Backend runs at:

```arduino
http://localhost:3000
```

### 🌐 Start the Client (frontend)

```bash
cd client
npm run dev
```

Frontend runs at:

```arduino
http://localhost:5173
```

## 🔑 Environment Variables

Inside /server/.env:

```ini
DATABASE_URL=postgres://username:password@localhost:5432/mydatabase
PORT=3000
```

Make sure your PostgreSQL server is running.

## 🔄 Git Workflow

This project follows a clean, structured Git workflow.

### Commit Message Convention (Conventional Commits)

```bash
<type>[optional scope]: <description>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Formatting changes that don't affect code logic
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding or fixing tests
- `chore`: Build tasks, package manager configs, etc.

**Examples:**

```bash
git commit -m "feat(items): add item creation route"
git commit -m "fix(api): correct database connection string"
```

### Branch Naming

- `main`: production

- `feature/name`: new features

- `bugfix/description`: bug fixes

- `hotfix/issue`: urgent fixes

### Standard Workflow

1. **Create a new branch**
   Always branch off from the latest version of `main`.

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Work on your feature**
   Make your code changes and commit them using the [Conventional Commits](https://www.conventionalcommits.org/) format:

   ```bash
   git add .
   git commit -m "feat(auth): add login functionality"
   ```

3. **Rebase with the latest main branch**
   Before pushing, make sure your branch is up to date with `main`:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

4. **Push your branch to remote**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request (PR)**
   Open a PR to merge your branch into `main` using the project’s PR template.
   Wait for review and approval before merging.

6. **After Merge — Sync and Clean Up**
   Once your PR is merged:

   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/your-feature-name     # delete local branch
   git push origin --delete feature/your-feature-name   # delete remote branch
   ```

## 📜 Available Scripts

### Client(React)

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview build
```

### Server(Express)

```bash
npm run dev        # Start development server
npm start          # Start production server
```
