import React, { createContext, useContext, useState } from 'react';

export type RoleType = 'ADMINISTRATOR' | 'SECURITY_ANALYST' | 'AUDITOR' | 'DEVELOPER';

export type PermissionKey = 'MANAGE_USERS' | 'MANAGE_GROUPS' | 'MANAGE_POLICIES' | 'REMEDIATE_FINDINGS' | 'RESEED_DB';

interface RoleContextType {
  currentActor: string;
  setCurrentActor: (actor: string) => void;
  roleType: RoleType;
  roleBadgeColor: string;
  hasPermission: (permission: PermissionKey) => boolean;
  executeProtectedAction: (permission: PermissionKey, actionFn: () => Promise<void> | void, deniedMessage?: string) => Promise<boolean>;
  authWarning: string | null;
  clearAuthWarning: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentActor, setCurrentActor] = useState<string>('admin');
  const [authWarning, setAuthWarning] = useState<string | null>(null);

  const getRoleType = (actor: string): RoleType => {
    switch (actor.toLowerCase()) {
      case 'admin':
        return 'ADMINISTRATOR';
      case 'bob-security':
        return 'SECURITY_ANALYST';
      case 'charlie-auditor':
        return 'AUDITOR';
      case 'alice-dev':
      case 'david-developer':
      default:
        return 'DEVELOPER';
    }
  };

  const roleType = getRoleType(currentActor);

  const getBadgeColor = (type: RoleType) => {
    switch (type) {
      case 'ADMINISTRATOR':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'SECURITY_ANALYST':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'AUDITOR':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'DEVELOPER':
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    switch (permission) {
      case 'MANAGE_USERS':
      case 'MANAGE_GROUPS':
      case 'MANAGE_POLICIES':
      case 'RESEED_DB':
        return roleType === 'ADMINISTRATOR';
      case 'REMEDIATE_FINDINGS':
        return roleType === 'ADMINISTRATOR' || roleType === 'SECURITY_ANALYST';
      default:
        return false;
    }
  };

  const executeProtectedAction = async (
    permission: PermissionKey,
    actionFn: () => Promise<void> | void,
    deniedMessage?: string
  ): Promise<boolean> => {
    if (hasPermission(permission)) {
      await actionFn();
      return true;
    } else {
      const msg = deniedMessage || `Access Denied: Identity '${currentActor}' (${roleType}) lacks '${permission}' authorization.`;
      setAuthWarning(msg);
      setTimeout(() => setAuthWarning(null), 4500);
      return false;
    }
  };

  return (
    <RoleContext.Provider
      value={{
        currentActor,
        setCurrentActor,
        roleType,
        roleBadgeColor: getBadgeColor(roleType),
        hasPermission,
        executeProtectedAction,
        authWarning,
        clearAuthWarning: () => setAuthWarning(null)
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
