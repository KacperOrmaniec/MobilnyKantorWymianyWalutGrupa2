# Graph Report - Kantor  (2026-10-04)

## Corpus Check
- Corpus is ~4,828 words - fits in a single context window. You may not need a graph.

## Summary
- 74 nodes · 160 edges · 10 communities (7 shown, 3 thin omitted)
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.9)
- Token cost: 72,586 input · 0 output

## Community Hubs (Navigation)
- Core Features & Delivery
- Requirements & Exchange Integrity
- Stack & Infrastructure Setup
- Stage 1 Design Docs
- NBP Rates Integration
- Backlog Agent Config
- Extras & UX Polish
- Empty Backlog Sources
- Empty Backlog Subtasks
- Empty Backlog Users

## God Nodes (most connected - your core abstractions)
1. `Backlog Tasks (tasks.yaml)` - 40 edges
2. `Backlog Readable Copy (docs/BACKLOG.md)` - 39 edges
3. `Project Requirements (requirements.md)` - 15 edges
4. `Kantor README` - 9 edges
5. `task_007: Stage 1 PDF report` - 8 edges
6. `Stage 1: Conceptual Design` - 6 edges
7. `Extra Functionality (alerts, charts, i18n, offline)` - 6 edges
8. `task_001: Decision: NBP rate policy for buy/sell` - 6 edges
9. `task_014: NBP API integration: current rates` - 6 edges
10. `task_018: Atomic buy/sell currency transaction` - 6 edges

## Surprising Connections (you probably didn't know these)
- `backlog CLI` --references--> `Backlog Tasks (tasks.yaml)`  [INFERRED]
  README.md → .backlog/tasks.yaml
- `Diagrams README` --references--> `task_003: UML use case diagram`  [INFERRED]
  docs/diagrams/README.md → .backlog/tasks.yaml
- `task_016: Account top-up via simulated transfer` --implements--> `Server-side Balance & Transaction Logic`  [INFERRED]
  .backlog/tasks.yaml → requirements.md
- `task_012: Registration & login (password hash, JWT)` --implements--> `No Plaintext Credentials`  [INFERRED]
  .backlog/tasks.yaml → requirements.md
- `task_034: Extra: historical rate chart` --implements--> `Extra Functionality (alerts, charts, i18n, offline)`  [INFERRED]
  .backlog/tasks.yaml → requirements.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Stage 1 conceptual design deliverables feeding the PDF report** — _backlog_tasks_task_002, _backlog_tasks_task_003, _backlog_tasks_task_004, _backlog_tasks_task_005, _backlog_tasks_task_006, _backlog_tasks_task_001, _backlog_tasks_task_007 [EXTRACTED 1.00]
- **Server-authoritative currency exchange flow** — _backlog_tasks_task_001, _backlog_tasks_task_014, _backlog_tasks_task_018, _backlog_tasks_task_026, requirements_transaction_rate_snapshot, requirements_data_consistency [INFERRED 0.85]
- **Kantor system stack (mobile -> REST -> .NET API -> PostgreSQL, API -> NBP)** — readme_react_native_expo, readme_dotnet_web_api, readme_postgresql, readme_nbp_api, _backlog_tasks_task_006 [EXTRACTED 1.00]

## Communities (10 total, 3 thin omitted)

### Community 0 - "Core Features & Delivery"
Cohesion: 0.26
Nodes (18): Backlog Tasks (tasks.yaml), task_012: Registration & login (password hash, JWT), task_013: Endpoint authorization, validation, error handling, task_015: Historical rates, task_016: Account top-up via simulated transfer, task_017: Wallet: balances, task_020: Backend tests, task_022: Registration & login screens (+10 more)

### Community 1 - "Requirements & Exchange Integrity"
Cohesion: 0.19
Nodes (10): task_011: Secrets & configuration management, task_018: Atomic buy/sell currency transaction, task_019: Transaction history, task_026: Buy/sell currency screen, task_028: Transaction history screen, Project Requirements (requirements.md), Database Scope (section 2C), Mobile App Scope (section 2A) (+2 more)

### Community 2 - "Stack & Infrastructure Setup"
Cohesion: 0.15
Nodes (13): task_008: .NET Web API backend skeleton, task_009: EF Core + PostgreSQL + migrations, task_010: Mobile app skeleton (Expo), task_021: API Dockerfile + API in docker-compose, Backend README, db service (postgres:17, kantor-db), db-data volume, Mobile README (+5 more)

### Community 3 - "Stage 1 Design Docs"
Cohesion: 0.39
Nodes (8): task_002: Functional & non-functional requirements, task_003: UML use case diagram, task_004: Class diagram, task_005: Database model & ERD, task_006: Architecture & component communication description, task_007: Stage 1 PDF report, Diagrams README, Stage 1: Conceptual Design

### Community 4 - "NBP Rates Integration"
Cohesion: 0.40
Nodes (6): task_001: Decision: NBP rate policy for buy/sell, task_014: NBP API integration: current rates, task_023: Current rates screen, task_037: Extra: offline mode for rates, NBP API (Narodowy Bank Polski exchange rates), NBP Rate Usage Policy Requirement

### Community 5 - "Backlog Agent Config"
Cohesion: 0.40
Nodes (5): Backlog Agents Config, claude-code agent (Sonnet), claude-haiku agent (Haiku), claude-opus agent (Opus, high risk allowed), codex agent (GPT-5.5, disabled)

### Community 6 - "Extras & UX Polish"
Cohesion: 0.40
Nodes (5): task_029: UX: loading, error, empty states, task_035: Extra: rate alerts, task_036: Extra: multi-language (PL/EN), Extra Functionality (alerts, charts, i18n, offline), Grading Criteria

## Knowledge Gaps
- **12 isolated node(s):** `Backend README`, `Mobile README`, `Diagrams README`, `Backlog Sources (empty)`, `Backlog Subtasks (empty)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 12 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Backlog Tasks (tasks.yaml)` connect `Core Features & Delivery` to `Requirements & Exchange Integrity`, `Stack & Infrastructure Setup`, `Stage 1 Design Docs`, `NBP Rates Integration`, `Extras & UX Polish`?**
  _High betweenness centrality (0.288) - this node is a cross-community bridge._
- **Why does `Backlog Readable Copy (docs/BACKLOG.md)` connect `Core Features & Delivery` to `Requirements & Exchange Integrity`, `Stack & Infrastructure Setup`, `Stage 1 Design Docs`, `NBP Rates Integration`, `Extras & UX Polish`?**
  _High betweenness centrality (0.270) - this node is a cross-community bridge._
- **Why does `Project Requirements (requirements.md)` connect `Requirements & Exchange Integrity` to `Core Features & Delivery`, `Stack & Infrastructure Setup`, `Stage 1 Design Docs`, `NBP Rates Integration`, `Extras & UX Polish`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `task_007: Stage 1 PDF report` (e.g. with `task_002: Functional & non-functional requirements` and `task_003: UML use case diagram`) actually correct?**
  _`task_007: Stage 1 PDF report` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Backend README`, `Mobile README`, `Diagrams README` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._