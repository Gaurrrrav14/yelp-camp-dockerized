# YelpCamp — Containerized Node.js Application with CI/CD

This project is a containerized Node.js/Express application built to explore production-oriented development practices, including Docker-based workflows, CI/CD automation, and stateless service design.

---

## Overview

The application is packaged using a multi-stage Docker build and deployed as a stateless service. CI/CD pipelines are implemented using GitHub Actions to validate changes and automate image delivery.

External services are used for persistence and storage, allowing the application container to remain ephemeral and horizontally scalable.

---

## Key Features

- Multi-stage Docker build using a minimal base image  
- Non-root container execution  
- Graceful shutdown handling (SIGTERM)  
- Health checks for container monitoring  
- CI pipeline for linting and Docker build validation on pull requests  
- CD pipeline for automated image builds and SHA-tagged pushes to Docker Hub  
- Stateless architecture with externalized sessions and media storage  

---

## Architecture

The application runs as a containerized service and integrates with external systems:

- MongoDB Atlas for data and session storage  
- Cloudinary for media uploads  
- GitHub Actions for CI/CD  
- Docker Hub as the image registry  

### Flow

User → Application Container → MongoDB Atlas  
              → Cloudinary  

CI/CD:

GitHub → Actions → Docker Build → Docker Hub  

---

## Tech Stack

- Node.js  
- Express  
- Docker  
- GitHub Actions  
- MongoDB Atlas  
- Cloudinary  

---

## Running Locally

Clone the repository and start the application using Docker Compose:

```bash
git clone https://github.com/your-username/yelpcamp.git
cd yelpcamp
docker compose up --build
