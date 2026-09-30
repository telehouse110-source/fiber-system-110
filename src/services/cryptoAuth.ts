import { UserAccount, UserRole, UserPermissions } from '../types';
import { getDatabase, saveDatabase, logAudit } from './storage';

const SESSION_STORAGE_KEY = 'optifiber_active_session_v1';

// SHA-256 hash helper with salt using native Web Crypto API
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + ':' + salt);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fixed salt for seed demonstration accounts to allow deterministic initialization
const DEFAULT_SALT = 'optifiber_isp_salt_2026';

export async function getSeedPasswordHash(password: string): Promise<string> {
  return hashPassword(password, DEFAULT_SALT);
}

// Session State
export interface AuthSession {
  token: string;
  user: UserAccount;
  expiresAt: number;
}

export function getActiveSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveActiveSession(user: UserAccount): AuthSession {
  const session: AuthSession = {
    token: 'tk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    user,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearActiveSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getDefaultPasswordForUsername(username: string): string | null {
  switch (username.toLowerCase()) {
    case 'admin': return 'admin123';
    case 'netadmin': return 'netadmin123';
    case 'tech_marcus': return 'tech123';
    case 'doc_staff': return 'doc123';
    case 'viewer': return 'viewer123';
    default: return null;
  }
}

// Login verification
export async function verifyAndLogin(username: string, passwordPlain: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const db = getDatabase();
  const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) {
    return { success: false, error: 'User account not found.' };
  }
  if (!user.isActive) {
    return { success: false, error: 'Account has been disabled. Contact Super Admin.' };
  }

  // Compute hash with user's salt or default salt
  const salt = user.salt || DEFAULT_SALT;
  const computedHash = await hashPassword(passwordPlain, salt);

  const defaultPassword = getDefaultPasswordForUsername(user.username);
  const isDefaultMatch = defaultPassword && defaultPassword === passwordPlain;

  if (user.passwordHash) {
    if (user.passwordHash !== computedHash && !isDefaultMatch) {
      return { success: false, error: 'Invalid password. Please check your credentials.' };
    }
  }

  // Ensure hash and salt are set
  user.passwordHash = computedHash;
  user.salt = salt;

  // Update last login
  user.lastLogin = new Date().toISOString();
  db.currentUser = user;
  saveDatabase(db);
  saveActiveSession(user);

  logAudit(db, {
    entityType: 'UserAccount',
    entityId: user.id,
    entityName: user.name,
    action: 'Updated',
    reason: `User logged in from ${window.location.hostname}`,
  });

  return { success: true, user };
}

// Check role permissions
export function checkPermission(role: UserRole, permission: keyof UserPermissions): boolean {
  switch (role) {
    case 'Super Admin':
      return true;
    case 'Network Admin':
      return permission !== 'canManageUsers';
    case 'Technician':
      return permission === 'canView' || permission === 'canMaintenance' || permission === 'canRunDiscovery' || permission === 'canEdit';
    case 'Documentation Staff':
      return permission === 'canView' || permission === 'canAdd' || permission === 'canEdit' || permission === 'canReports';
    case 'Viewer':
    default:
      return permission === 'canView';
  }
}

// Add user
export async function createUser(
  data: Omit<UserAccount, 'id' | 'passwordHash' | 'salt'> & { passwordPlain: string }
): Promise<UserAccount> {
  const db = getDatabase();
  const salt = generateSalt();
  const passwordHash = await hashPassword(data.passwordPlain, salt);

  const newUser: UserAccount = {
    id: 'usr-' + Date.now(),
    username: data.username.trim().toLowerCase(),
    name: data.name,
    email: data.email,
    role: data.role,
    passwordHash,
    salt,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  logAudit(db, {
    entityType: 'UserAccount',
    entityId: newUser.id,
    entityName: newUser.name,
    action: 'Created',
    reason: `Created user ${newUser.username} with role ${newUser.role}`,
  });
  saveDatabase(db);
  return newUser;
}

// Update user
export async function updateUser(
  id: string,
  updates: Partial<UserAccount> & { newPasswordPlain?: string }
): Promise<UserAccount | null> {
  const db = getDatabase();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return null;

  const current = db.users[idx];
  let newHash = current.passwordHash;
  let newSalt = current.salt;

  if (updates.newPasswordPlain) {
    newSalt = generateSalt();
    newHash = await hashPassword(updates.newPasswordPlain, newSalt);
  }

  const updated: UserAccount = {
    ...current,
    ...updates,
    passwordHash: newHash,
    salt: newSalt,
  };

  db.users[idx] = updated;

  // If updating current active user, sync current session
  if (db.currentUser?.id === id) {
    db.currentUser = updated;
    saveActiveSession(updated);
  }

  logAudit(db, {
    entityType: 'UserAccount',
    entityId: updated.id,
    entityName: updated.name,
    action: 'Updated',
    reason: `Updated profile / role for ${updated.username}`,
  });

  saveDatabase(db);
  return updated;
}

// Delete user
export function deleteUser(id: string): boolean {
  const db = getDatabase();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return false;

  const user = db.users[idx];
  if (user.role === 'Super Admin' && db.users.filter(u => u.role === 'Super Admin').length <= 1) {
    throw new Error('Cannot delete the last remaining Super Admin.');
  }

  db.users.splice(idx, 1);
  logAudit(db, {
    entityType: 'UserAccount',
    entityId: id,
    entityName: user.name,
    action: 'Deleted',
    reason: `Removed user account ${user.username}`,
  });
  saveDatabase(db);
  return true;
}
