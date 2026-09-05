# Cloud IAM Security Lab - Educational Scenarios & Detection Guide

This document details the intentional security misconfigurations pre-populated into the Cloud IAM Security Lab sandbox and explains how to test and remediate them.

---

## Scenario 1: Wildcard Administrator Access (*:*)

### Misconfiguration
- **Policy**: `AdministratorAccess`
- **Effect**: `ALLOW`
- **Actions**: `["*"]`
- **Resources**: `["*"]`
- **Affected Group**: `Administrators`

### Risk Analysis
- **Severity**: `CRITICAL` (-25 score deduction)
- **Impact**: Full administrative takeover. Any user in the `Administrators` group has unrestricted rights to create, modify, or destroy all cloud assets and IAM policies.

### Simulator Test
1. Go to `/simulator`.
2. Select Identity: `admin`.
3. Action: `storage:DeleteObject`, Resource: `production-bucket`.
4. Result: `ALLOWED` via `AdministratorAccess`.

### Automated Remediation
Clicking "Execute Automated Remediation" on this finding in the frontend replaces `["*"]` with specific service ARNs (`compute:Describe*`, `storage:GetObject`, `storage:PutObject`, `iam:Get*`), reducing the risk rating to `MEDIUM` and boosting the Security Score by +25 points.

---

## Scenario 2: Developer Group Excessive Object Deletion

### Misconfiguration
- **Policy**: `DeveloperAccess`
- **Effect**: `ALLOW`
- **Actions**: `["storage:GetObject", "storage:PutObject", "storage:ListBucket", "storage:DeleteObject"]`
- **Affected Group**: `Developers` (Users: `alice-dev`, `david-developer`)

### Risk Analysis
- **Severity**: `HIGH` (-15 score deduction)
- **Impact**: Developers require write and read access for active feature testing, but object deletion in production S3 storage buckets poses severe data loss risks.

### Simulator Test
1. Go to `/simulator`.
2. Select Identity: `alice-dev`.
3. Action: `storage:DeleteObject`, Resource: `production-bucket`.
4. Result: `ALLOWED` via `DeveloperAccess`.

### Automated Remediation
Clicking "Mark as Remediated" strips `storage:DeleteObject` from `DeveloperAccess`, leaving only `GetObject`, `PutObject`, and `ListBucket`. Re-testing `alice-dev` with `storage:DeleteObject` now yields `DENIED` with an implicit deny explanation.

---

## Scenario 3: Sensitive Resource Exposed to Broad Access

### Misconfiguration
- **Resource**: `security-logs` (Sensitivity: `CONFIDENTIAL`)
- **Policy**: Broad storage/log policies attached across non-security roles.

### Risk Analysis
- **Severity**: `HIGH` (-15 score deduction)
- **Impact**: Exposure of audit logs or sensitive production data to non-authorized personnel violates compliance frameworks (SOC2, ISO 27001).
