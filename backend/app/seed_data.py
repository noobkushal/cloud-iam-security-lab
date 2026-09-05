from datetime import datetime
from sqlalchemy.orm import Session
from app.models import User, Group, Policy, Resource, AuditLog, SecurityFinding
from app.services.security_engine import run_security_analysis

def seed_database(db: Session):
    """Populates SQLite database with realistic initial cloud IAM scenario data."""
    # Clear existing tables safely
    db.query(SecurityFinding).delete()
    db.query(AuditLog).delete()

    # Clear user-group-policy associations through clear
    users = db.query(User).all()
    for u in users:
        u.groups.clear()
        u.direct_policies.clear()
    
    groups = db.query(Group).all()
    for g in groups:
        g.policies.clear()

    db.query(User).delete()
    db.query(Group).delete()
    db.query(Policy).delete()
    db.query(Resource).delete()
    db.commit()

    # 1. Policies
    pol_admin = Policy(
        id="pol_admin_access",
        name="AdministratorAccess",
        description="Provides full wildcard access to all cloud resources and IAM actions.",
        effect="ALLOW",
        actions=["*"],
        resources=["*"],
        risk_level="CRITICAL"
    )

    pol_dev = Policy(
        id="pol_developer_access",
        name="DeveloperAccess",
        description="Grants development object access including read, write, and object deletion.",
        effect="ALLOW",
        actions=["storage:GetObject", "storage:PutObject", "storage:ListBucket", "storage:DeleteObject"],
        resources=["*"],
        risk_level="HIGH"
    )

    pol_sec_auditor = Policy(
        id="pol_security_auditor",
        name="SecurityAuditor",
        description="Grants read-only access for security assessment and policy inspection.",
        effect="ALLOW",
        actions=["iam:Get*", "iam:List*", "storage:GetObject", "logs:Get*"],
        resources=["*"],
        risk_level="LOW"
    )

    pol_storage_readonly = Policy(
        id="pol_storage_readonly",
        name="StorageReadOnly",
        description="Allows read-only access to storage buckets.",
        effect="ALLOW",
        actions=["storage:GetObject", "storage:ListBucket"],
        resources=["arn:aws:s3:::*"],
        risk_level="LOW"
    )

    pol_storage_admin = Policy(
        id="pol_storage_admin",
        name="StorageAdmin",
        description="Provides full administrative rights over storage buckets.",
        effect="ALLOW",
        actions=["storage:*"],
        resources=["*"],
        risk_level="HIGH"
    )

    db.add_all([pol_admin, pol_dev, pol_sec_auditor, pol_storage_readonly, pol_storage_admin])
    db.commit()

    # 2. Groups
    grp_admin = Group(
        id="grp_administrators",
        name="Administrators",
        description="Full cloud infrastructure administrators group."
    )
    grp_admin.policies.append(pol_admin)

    grp_devs = Group(
        id="grp_developers",
        name="Developers",
        description="Software development engineering team."
    )
    grp_devs.policies.append(pol_dev)

    grp_sec = Group(
        id="grp_security",
        name="SecurityTeam",
        description="Security operations and incident response team."
    )
    grp_sec.policies.extend([pol_sec_auditor, pol_storage_readonly])

    grp_auditors = Group(
        id="grp_auditors",
        name="Auditors",
        description="External and internal compliance auditors."
    )
    grp_auditors.policies.append(pol_sec_auditor)

    db.add_all([grp_admin, grp_devs, grp_sec, grp_auditors])
    db.commit()

    # 3. Users
    usr_admin = User(
        id="usr_admin",
        username="admin",
        email="admin@cloudlab.local",
        status="ACTIVE",
        created_at=datetime(2026, 1, 10, 8, 0, 0),
        last_login=datetime.utcnow()
    )
    usr_admin.groups.append(grp_admin)

    usr_alice = User(
        id="usr_alice_dev",
        username="alice-dev",
        email="alice@cloudlab.local",
        status="ACTIVE",
        created_at=datetime(2026, 2, 1, 9, 30, 0),
        last_login=datetime.utcnow()
    )
    usr_alice.groups.append(grp_devs)

    usr_bob = User(
        id="usr_bob_sec",
        username="bob-security",
        email="bob@cloudlab.local",
        status="ACTIVE",
        created_at=datetime(2026, 1, 15, 10, 0, 0),
        last_login=datetime.utcnow()
    )
    usr_bob.groups.append(grp_sec)

    usr_charlie = User(
        id="usr_charlie_auditor",
        username="charlie-auditor",
        email="charlie@cloudlab.local",
        status="ACTIVE",
        created_at=datetime(2026, 3, 5, 11, 15, 0),
        last_login=datetime.utcnow()
    )
    usr_charlie.groups.append(grp_auditors)

    usr_david = User(
        id="usr_david_dev",
        username="david-developer",
        email="david@cloudlab.local",
        status="ACTIVE",
        created_at=datetime(2026, 3, 12, 14, 0, 0),
        last_login=datetime.utcnow()
    )
    usr_david.groups.append(grp_devs)

    db.add_all([usr_admin, usr_alice, usr_bob, usr_charlie, usr_david])
    db.commit()

    # 4. Resources
    res_prod_server = Resource(
        id="res_prod_server",
        name="production-server",
        resource_type="COMPUTE_INSTANCE",
        environment="PRODUCTION",
        sensitivity="RESTRICTED"
    )

    res_dev_server = Resource(
        id="res_dev_server",
        name="development-server",
        resource_type="COMPUTE_INSTANCE",
        environment="DEVELOPMENT",
        sensitivity="INTERNAL"
    )

    res_prod_bucket = Resource(
        id="res_prod_bucket",
        name="production-bucket",
        resource_type="S3_BUCKET",
        environment="PRODUCTION",
        sensitivity="RESTRICTED"
    )

    res_dev_bucket = Resource(
        id="res_dev_bucket",
        name="development-bucket",
        resource_type="S3_BUCKET",
        environment="DEVELOPMENT",
        sensitivity="INTERNAL"
    )

    res_sec_logs = Resource(
        id="res_sec_logs",
        name="security-logs",
        resource_type="LOG_GROUP",
        environment="PRODUCTION",
        sensitivity="CONFIDENTIAL"
    )

    db.add_all([res_prod_server, res_dev_server, res_prod_bucket, res_dev_bucket, res_sec_logs])
    db.commit()

    # 5. Seed Audit Logs
    logs = [
        AuditLog(
            actor="admin",
            action="iam:Login",
            resource="Console",
            result="SUCCESS",
            ip_address="192.168.1.100",
            risk_level="INFO"
        ),
        AuditLog(
            actor="alice-dev",
            action="storage:GetObject",
            resource="development-bucket",
            result="ALLOWED",
            ip_address="192.168.1.105",
            risk_level="INFO"
        ),
        AuditLog(
            actor="admin",
            action="iam:PolicyCreated",
            resource="DeveloperAccess",
            result="SUCCESS",
            ip_address="192.168.1.100",
            risk_level="MEDIUM"
        ),
        AuditLog(
            actor="david-developer",
            action="storage:DeleteObject",
            resource="production-bucket",
            result="ALLOWED",
            ip_address="192.168.1.112",
            risk_level="HIGH"
        )
    ]
    db.add_all(logs)
    db.commit()

    # 6. Run Security Engine Analysis to populate findings & initial score
    run_security_analysis(db)
