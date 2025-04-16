# Punchly

![React](https://img.shields.io/badge/frontend-React-61DAFB.svg)
![Express](https://img.shields.io/badge/backend-Express.js-000000.svg)
![Prisma](https://img.shields.io/badge/ORM-Prisma-3982CE.svg)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-336791.svg)
![Made With TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-007acc.svg)
![Dockerized](https://img.shields.io/badge/docker-ready-blue)
![API Documentation](https://img.shields.io/badge/API%20Documentation-Swagger-85ea2d.svg)
![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

**Punchly** is a Danish, open-source employee time tracking and management system. It allows companies to self-host the platform, giving them full control over employee data.

## 🛠 Tech Stack

### Backend

- **Node.js** with **Express**, written in **TypeScript**
- Uses **Prisma** ORM
- Follows a **three-layered architecture** (Routes, Services, Repositories)
- **Dependency Injection** for modularity and testability
- Swagger docs can be found at `http://localhost:4000/api/docs`

### Frontend

- **React**, written in **TypeScript**
- Shared types in the `shared` folder
- Clean component structure using hooks and modern practices

---

### 🔐 Access Control

Punchly features **Role-Based Access Control (RBAC)** with three predefined roles:

- **Company**
- **Manager**
- **Admin**

Managers and admins have elevated privileges, enabling access to additional functionalities and data.

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### Running Punchly Locally

Clone the repository:

```bash
git clone https://github.com/mikkelklitlund/punchly.git
cd punchly
```

Then start everything with Docker Compose:

```bash
docker-compose up --build
```

This will:

- Start a PostgreSQL database
- Build and run the backend server on `http://localhost:4000`
- Build and run the frontend on `http://localhost:3000`

---

## ⚠️ Disclaimer

**Punchly** was built as a personal project for **educational purposes**.

- While it uses modern libraries and follows good architectural practices, it is **not production-ready**.
- **Authentication and authorization are custom-built** and have not been formally tested for security vulnerabilities.
- Do not use this system to handle sensitive or real employee data in its current state.
