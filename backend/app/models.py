import uuid
from datetime import datetime
from sqlalchemy import Table, Column, String, Text, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from app.database import Base

# Association Tables
user_groups = Table(
    'user_groups',
    Base.metadata,
    Column('user_id', String(36), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('group_id', String(36), ForeignKey('groups.id', ondelete='CASCADE'), primary_key=True)
)

group_policies = Table(
    'group_policies',
    Base.metadata,
    Column('group_id', String(36), ForeignKey('groups.id', ondelete='CASCADE'), primary_key=True),
    Column('policy_id', String(36), ForeignKey('policies.id', ondelete='CASCADE'), primary_key=True)
)

user_policies = Table(
    'user_policies',
    Base.metadata,
    Column('user_id', String(36), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('policy_id', String(36), ForeignKey('policies.id', ondelete='CASCADE'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=False)
    status = Column(String(20), default='ACTIVE') # ACTIVE, SUSPENDED
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)

    groups = relationship('Group', secondary=user_groups, back_populates='users')
    direct_policies = relationship('Policy', secondary=user_policies, back_populates='users')

class Group(Base):
    __tablename__ = 'groups'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    users = relationship('User', secondary=user_groups, back_populates='groups')
    policies = relationship('Policy', secondary=group_policies, back_populates='groups')

class Policy(Base):
    __tablename__ = 'policies'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    effect = Column(String(10), default='ALLOW') # ALLOW, DENY
    actions = Column(JSON, nullable=False, default=list) # e.g. ["storage:*"]
    resources = Column(JSON, nullable=False, default=list) # e.g. ["*"]
    risk_level = Column(String(20), default='LOW') # CRITICAL, HIGH, MEDIUM, LOW

    groups = relationship('Group', secondary=group_policies, back_populates='policies')
    users = relationship('User', secondary=user_policies, back_populates='direct_policies')

class Resource(Base):
    __tablename__ = 'resources'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    resource_type = Column(String(50), nullable=False) # S3_BUCKET, COMPUTE_INSTANCE, LOG_GROUP, DATABASE
    environment = Column(String(50), default='PRODUCTION') # PRODUCTION, STAGING, DEVELOPMENT
    sensitivity = Column(String(50), default='CONFIDENTIAL') # CONFIDENTIAL, RESTRICTED, INTERNAL, PUBLIC

class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    actor = Column(String(100), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource = Column(String(255), nullable=False)
    result = Column(String(50), nullable=False) # SUCCESS, FAILURE, ALLOWED, DENIED
    ip_address = Column(String(45), default='127.0.0.1')
    risk_level = Column(String(20), default='INFO') # CRITICAL, HIGH, MEDIUM, LOW, INFO

class SecurityFinding(Base):
    __tablename__ = 'security_findings'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    severity = Column(String(20), nullable=False, index=True) # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    affected_entity = Column(String(255), nullable=False)
    problem = Column(Text, nullable=True)
    why_it_matters = Column(Text, nullable=True)
    current_permission = Column(Text, nullable=True)
    recommended_permission = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    status = Column(String(20), default='OPEN', index=True) # OPEN, REMEDIATED
    created_at = Column(DateTime, default=datetime.utcnow)
