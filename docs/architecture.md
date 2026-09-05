# Cloud IAM Security Lab - System Architecture & Engineering Specifications

The **Cloud IAM Security Lab** is designed as a full-stack educational cloud security platform that models cloud IAM governance, permission evaluation, security analysis, least privilege enforcement, and audit trail logging.

---

## High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                          REACT VITE FRONTEND                            |
|  Dark Cybersecurity Stitch Design System (Cyan / Emerald Glow Theme)     |
|                                                                         |
|  +--------------+  +--------------+  +---------------+  +------------+  |
|  | Dashboard    |  | Identities   |  | Findings      |  | Simulator  |  |
|  | Score Gauge  |  | RBAC Groups  |  | Remediation   |  | Workbench  |  |
|  +--------------+  +--------------+  +---------------+  +------------+  |
|         ^                 ^                  ^                 ^        |
+---------|-----------------|------------------|-----------------|--------+
          |                 | REST APIs        |                 |
          v                 v (JSON)           v                 v
+-------------------------------------------------------------------------+
|                          FASTAPI BACKEND                                |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                      REST API ROUTERS                           |   |
|   | /api/dashboard | /api/users | /api/policies | /api/simulator    |   |
|   +-----------------------------------------------------------------+   |
|                                |                                        |
|   +----------------------------+---------------------------------+      |
|   |                                                              |      |
|   v                                                              v      |
|  +------------------------------+     +------------------------------+  |
|  | SECURITY ENGINE SERVICE      |     | IAM PERMISSION EVALUATOR     |  |
|  | - Wildcard Scan (*:*)        |     | - Collects Group & Direct    |  |
|  | - Excessive Dev Delete Scan  |     |   Policies                   |  |
|  | - Unrestricted Sensitive Res |     | - Evaluates Deny > Allow     |  |
|  | - Dynamic Score Calculation  |     | - Wildcard & Scope Matching  |  |
|  |   (100 Base, -25/-15/-8/-3)   |     | - Detailed Evaluation Trace  |  |
|  +------------------------------+     +------------------------------+  |
|                                |                                        |
|                                v                                        |
|   +-----------------------------------------------------------------+   |
|   |                     SQLALCHEMY ORM LAYER                        |   |
|   +-----------------------------------------------------------------+   |
|                                |                                        |
+--------------------------------|----------------------------------------+
                                 v
               +-----------------------------------+
               |       SQLITE DATABASE             |
               |       (iam_lab.db)                |
               +-----------------------------------+
```

---

## Component Deep Dive

### 1. Data Layer (`backend/app/models.py`)
- **User**: Represents IAM principal identities with unique usernames, status, and relationships to Groups and direct Policies.
- **Group**: Represents Role-Based Access Control (RBAC) containers that group users and attach reusable IAM policies.
- **Policy**: Declarative document defining `effect` (`ALLOW`/`DENY`), `actions` array, `resources` array, and `risk_level`.
- **Resource**: Simulated cloud assets (`S3_BUCKET`, `COMPUTE_INSTANCE`, `LOG_GROUP`, `DATABASE`) with sensitivity classifications (`RESTRICTED`, `CONFIDENTIAL`, `INTERNAL`, `PUBLIC`).
- **SecurityFinding**: System-generated audit findings with detailed problem statements, security impact analysis, current vs. recommended permissions, and remediation status (`OPEN`/`REMEDIATED`).
- **AuditLog**: Immutable event log tracking every login, policy change, simulation execution, and finding remediation.

### 2. IAM Permission Evaluation Simulator (`backend/app/services/simulator.py`)
The permission engine resolves access decisions using a two-pass algorithm:
1. **Policy Collection**: Gathers all policies attached to the user (via direct inline attachment + all assigned RBAC groups).
2. **Explicit Deny Evaluation**: Scans all collected policies for `effect="DENY"`. If an action and resource match a DENY rule, access is immediately **DENIED** (explicit DENY takes precedence).
3. **Allow Evaluation**: Scans policies for `effect="ALLOW"`. Checks for exact or wildcard pattern matches (`*`, `storage:*`, `arn:aws:s3:::*`).
4. **Decision Output**: Returns `ALLOWED` or `DENIED` alongside the matching policy name, step-by-step trace, and audit log generation.

### 3. Security Analysis Engine (`backend/app/services/security_engine.py`)
Continuously audits policies and assignments to flag dangerous anti-patterns:
- **Critical Wildcards**: Policies with `actions=["*"]` and `resources=["*"]` trigger a `CRITICAL` finding (-25 points).
- **Excessive Dev Delete Rights**: Non-admin groups (e.g. `Developers`) with `storage:DeleteObject` trigger a `HIGH` finding (-15 points).
- **Sensitive Resource Exposure**: Unrestricted access to restricted resources triggers a `HIGH` finding (-15 points).
- **Dynamic Security Score Formula**:
  $$ \text{Security Score} = \max\left(0, 100 - \sum \text{Deductions for OPEN Findings}\right) $$

---

## Educational Value
Designed for computer science and cybersecurity students to understand:
- Difference between **Authentication** (who you are) and **Authorization** (what you are allowed to do).
- How **RBAC** prevents privilege drift compared to direct policy attachments.
- Practical implementation of the **Principle of Least Privilege (PoLP)**.
