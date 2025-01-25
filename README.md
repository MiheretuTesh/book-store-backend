# Book Library Application

This project is a simple book library application built with NestJS. It utilizes MongoDB as the database and is containerized using Docker.

## Project Setup

1. **Clone the repository:**

```bash
git clone <repository_url>
cd book-library
```

2. **Install dependencies:**

```bash
npm install
```

3. \**Create .env file:*s\*
   Create a `.env` file in the project root with the following environment variable:

```
MONGODB_URI=mongodb://<username>:<password>@<host>:<port>/<database_name>
```

Example:

```
MONGODB_URI=mongodb://user:password@localhost:27017/book-library
```

## Docker Setup

1. **Build Docker Image:**

```bash
docker build -t book-library-app .
```

2. **Run Container:**

```bash
docker run -p 5000:5000 book-library-app
```

## Docker Compose (Optional)

1. **Create `docker-compose.yml`:**

```yaml
version: '3.9'
services:
  book-library:
    build: .
    ports:
      - '${PORT}:${PORT}'
    environment:
      - MONGODB_URI
      - PORT
    depends_on:
      - mongo
  mongo:
    image: mongo
    ports:
      - '27017:27017'
```

2. **Start Services:**

```bash
docker-compose up -d
```

## Updating Environment Variables

1. **Modify `.env`:**
   Make changes to the `MONGODB_URI` or other environment variables in the `.env` file.

2. **Restart Container/Services:**

   **Docker Compose:**

```bash
docker-compose down
docker-compose up -d
```

**Docker CLI:**

```bash
docker stop <container_name>
docker rm <container_name>
docker run -p 3000:3000 book-library-app
```

**Docker Info:**

```bash
docker ps -a
```
