# AI Engineering Guide
## Project: Structra (Working Name)
### Version 1.0

---

# Purpose

This document defines the engineering standards, architecture, coding conventions, and responsibilities that every AI agent must follow while contributing to this project.

The goal is to produce a maintainable, scalable, production-quality software system rather than isolated pieces of code.

Every generated output must comply with this document.

---

# Project Overview

Structra is a collaborative knowledge management platform inspired by Notion.

It allows users to:

- Create workspaces
- Organize pages
- Store information using block-based documents
- Collaborate with teams
- Search knowledge efficiently
- Share documents
- Manage permissions

The objective is NOT to clone Notion feature-by-feature.

The objective is to build a simplified but professionally engineered collaborative workspace.

---

# Engineering Principles

Always prioritize:

1. Simplicity
2. Maintainability
3. Scalability
4. Readability
5. Security
6. Performance

Never sacrifice code quality for short-term speed.

---

# Architecture

Use Clean Architecture.

Presentation Layer

↓

Application Layer

↓

Domain Layer

↓

Infrastructure Layer

Dependencies always point inward.

Business logic must never depend on UI.

Database must never contain business rules.

---

# Technology Stack

Backend

- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- ASP.NET Identity
- JWT Authentication
- SignalR

Frontend

- React or Angular
- TypeScript
- TailwindCSS
- Axios

Database

- SQL Server

Version Control

- Git
- GitHub

Project Management

- Jira

Documentation

- Markdown

---

# Core Modules

Authentication

Workspace Management

Page Management

Block Management

Collaboration

Search

Comments

Notifications

Activity Log

---

# MVP Scope

Must include

✓ Authentication

✓ Workspace CRUD

✓ Nested Pages

✓ Block Editor

✓ Search

✓ Comments

✓ Sharing

✓ Responsive UI

Optional

- AI assistance

- Templates

- Dark Mode

- Offline mode

- File uploads

---

# Block System

Everything inside a page is stored as blocks.

Supported blocks:

- Paragraph
- Heading
- Checklist
- Bullet List
- Numbered List
- Code Block
- Divider

Every block has

Id

PageId

Type

Content

Order

ParentBlockId (nullable)

CreatedAt

UpdatedAt

Never store the whole page as one text field.

---

# API Standards

Use REST principles.

Example

GET /api/pages/{id}

POST /api/pages

PUT /api/pages/{id}

DELETE /api/pages/{id}

Plural resource names only.

Use nouns.

Do not use verbs.

Incorrect

/createPage

Correct

POST /pages

---

# API Responses

Always return consistent JSON.

Success

{
    "success": true,
    "data": ...
}

Failure

{
    "success": false,
    "message": "...",
    "errors": [...]
}

Never return inconsistent formats.

---

# HTTP Status Codes

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

500 Internal Server Error

Use proper status codes.

---

# Authentication

Use JWT.

Passwords must never be stored.

Use ASP.NET Identity.

Authorization must use roles.

Guest

Member

Admin

---

# Database Rules

Every table must

- Have Primary Key

- Use Foreign Keys

- Define Constraints

- Use proper indexes

Never duplicate data unnecessarily.

Normalize where appropriate.

---

# Coding Standards

Meaningful variable names.

Meaningful method names.

Single Responsibility Principle.

No magic numbers.

No duplicated code.

Prefer dependency injection.

Avoid static classes unless justified.

Keep methods small.

Keep controllers thin.

Business logic belongs in services.

---

# Error Handling

Never swallow exceptions.

Log unexpected failures.

Return meaningful error messages.

Never expose stack traces.

---

# Validation

Validate

Request DTOs

Business rules

Database constraints

Never trust client input.

---

# Security

Prevent

SQL Injection

XSS

CSRF

Broken Authentication

Privilege Escalation

Validate every request.

---

# Logging

Log

Authentication events

Errors

Critical operations

Do not log passwords.

Do not log secrets.

---

# Documentation

Every public API must include

Purpose

Parameters

Response

Possible errors

Every module should contain

README.md

---

# Git Workflow

main

develop

feature/*

bugfix/*

Never commit directly to main.

Use Pull Requests.

---

# Commit Messages

Use Conventional Commits.

Examples

feat(auth): implement JWT login

fix(editor): preserve block order

docs(api): update page endpoints

refactor(search): improve query performance

---

# Agile Workflow

Backlog

↓

Sprint Planning

↓

Development

↓

Code Review

↓

Testing

↓

Sprint Review

↓

Retrospective

---

# Task Format

Each task should include

Objective

Acceptance Criteria

Dependencies

Estimated Effort

Deliverables

Definition of Done

---

# Definition of Done

A feature is complete only if

✓ Code implemented

✓ Unit tested

✓ API documented

✓ Reviewed

✓ Builds successfully

✓ No compiler warnings

✓ No known critical bugs

---

# AI Agent Rules

Never invent requirements.

If requirements are missing:

State assumptions clearly.

Ask for clarification whenever possible.

Never fabricate APIs.

Never invent database tables.

Never reference libraries that are not part of the project.

Never generate pseudo-working code.

Never ignore project architecture.

If uncertain,

state uncertainty explicitly.

---

# Hallucination Prevention

AI must distinguish between

FACT

ASSUMPTION

SUGGESTION

Example

FACT

Authentication uses JWT.

ASSUMPTION

Email verification may be added later.

SUGGESTION

Redis could improve caching.

Never present assumptions as facts.

---

# Output Requirements

Every response should include

1. Reasoning

2. Design decisions

3. Advantages

4. Trade-offs

5. Risks

6. Future improvements

---

# Code Generation Rules

Generated code must

Compile

Follow project architecture

Be modular

Avoid duplication

Use dependency injection

Follow SOLID principles

Never generate placeholder implementations unless explicitly requested.

---

# Review Checklist

Before producing any output verify

✓ Requirements understood

✓ Architecture respected

✓ Naming consistent

✓ Security considered

✓ Validation included

✓ Error handling included

✓ Documentation updated

✓ No unnecessary complexity

---

# Priority Order

When trade-offs occur always prioritize

Correctness

↓

Maintainability

↓

Security

↓

Readability

↓

Performance

↓

Convenience

---

# Final Objective

The project should resemble a real-world enterprise application built by a professional software engineering team rather than a classroom CRUD application.

Every contribution should improve the long-term quality of the system.
