# Punchly

---

The Employee Management System is a full-stack application designed to manage employee information, departments, and company data. This project is structured with separate directories for the frontend, backend, and shared models.

## Table of Contents

- [Punchly](#punchly)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Frontend](#frontend)
    - [Running the Frontend](#running-the-frontend)
  - [Backend](#backend)
    - [Running the Backend](#running-the-backend)
  - [Shared](#shared)
    - [Compile types](#compile-types)
  - [Useful Commands](#useful-commands)

## Prerequisites

- **Node.js** (14 or later)
- **npm** (comes with node)
- **A supported database**

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/mikkelklitlund/Punchly.git
   cd Punchly
   ```
2. Install dependencies for both frontend, backend and shared
   ```bash
   npm install
   ```

## Frontend

### Running the Frontend

1. Running the frontend
   ```bash
   cd frontend
   npm run dev
   ```

## Backend

1. Navigate to backend
   ```bash
   cd backend
   ```
2. Set up env variables in backend

   - Create a `.env` file in `/backend` based on the `.env.example`

3. Run the Prisma migration to set up your database schema
   ```bash
   npx prisma migrate dev --name init
   ```
4. Generate Prisma models
   ```bash
   npx prisma generate
   ```

### Running the Backend

1.  Running the backend

```bash
cd backend
npm run dev
```

## Shared

The shared directory contains data models and interfaces that are used across both the frontend and backend.

### Compile types

To be able to use the types in `frontend` and `backend` run

```bash
cd shared
npm run build
```

## Useful Commands
