// Client-side storage management for audit system

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'auditor';
  createdAt: string;
  isActive: boolean;
}

export interface Website {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface Module {
  id: string;
  websiteId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  websiteId: string;
  moduleId: string;
  userId: string;
  status: 'working' | 'not_working';
  remarks?: string;
  timestamp: string;
  auditDate: string; // YYYY-MM-DD format
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details?: string;
}

// Storage keys
const STORAGE_KEYS = {
  USERS: 'audit_users',
  WEBSITES: 'audit_websites',
  MODULES: 'audit_modules',
  AUDITS: 'audit_audits',
  ACTIVITY_LOGS: 'audit_activity_logs',
  CURRENT_USER: 'audit_current_user',
};

// Initialize with default admin user
export const initializeStorage = () => {
  const users = getUsers();
  if (users.length === 0) {
    const adminUser: User = {
      id: 'admin-1',
      username: 'admin',
      password: 'admin123', // In production, this should be hashed
      role: 'admin',
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    saveToStorage(STORAGE_KEYS.USERS, [adminUser]);
  }
};

// Generic storage functions
const getFromStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// User management
export const getUsers = (): User[] => getFromStorage<User>(STORAGE_KEYS.USERS);

export const saveUsers = (users: User[]) => saveToStorage(STORAGE_KEYS.USERS, users);

export const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
  const users = getUsers();
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

export const updateUser = (id: string, updates: Partial<User>) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    saveUsers(users);
  }
};

export const deleteUser = (id: string) => {
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
};

// Authentication
export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

export const login = (username: string, password: string): { success: boolean; user?: User; error?: string } => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.isActive);
  
  if (!user) {
    logActivity('', 'LOGIN_FAIL', `Failed login attempt for username: ${username}`);
    return { success: false, error: 'Invalid credentials' };
  }
  
  if (user.password !== password) {
    logActivity(user.id, 'LOGIN_FAIL', 'Incorrect password');
    return { success: false, error: 'Invalid credentials' };
  }
  
  setCurrentUser(user);
  logActivity(user.id, 'LOGIN_SUCCESS', `User ${username} logged in`);
  return { success: true, user };
};

export const logout = () => {
  const user = getCurrentUser();
  if (user) {
    logActivity(user.id, 'LOGOUT', `User ${user.username} logged out`);
  }
  setCurrentUser(null);
};

// Website management
export const getWebsites = (): Website[] => getFromStorage<Website>(STORAGE_KEYS.WEBSITES);

export const saveWebsites = (websites: Website[]) => saveToStorage(STORAGE_KEYS.WEBSITES, websites);

export const createWebsite = (data: Omit<Website, 'id' | 'createdAt'>): Website => {
  const websites = getWebsites();
  const newWebsite: Website = {
    ...data,
    id: `website-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  websites.push(newWebsite);
  saveWebsites(websites);
  logActivity(getCurrentUser()?.id || '', 'CREATE_WEBSITE', `Created website: ${data.name}`);
  return newWebsite;
};

export const updateWebsite = (id: string, updates: Partial<Website>) => {
  const websites = getWebsites();
  const index = websites.findIndex(w => w.id === id);
  if (index !== -1) {
    websites[index] = { ...websites[index], ...updates };
    saveWebsites(websites);
    logActivity(getCurrentUser()?.id || '', 'UPDATE_WEBSITE', `Updated website: ${websites[index].name}`);
  }
};

export const deleteWebsite = (id: string) => {
  const websites = getWebsites();
  const website = websites.find(w => w.id === id);
  const filtered = websites.filter(w => w.id !== id);
  saveWebsites(filtered);
  
  // Also delete associated modules and audits
  const modules = getModules().filter(m => m.websiteId !== id);
  saveModules(modules);
  const audits = getAudits().filter(a => a.websiteId !== id);
  saveAudits(audits);
  
  if (website) {
    logActivity(getCurrentUser()?.id || '', 'DELETE_WEBSITE', `Deleted website: ${website.name}`);
  }
};

// Module management
export const getModules = (): Module[] => getFromStorage<Module>(STORAGE_KEYS.MODULES);

export const saveModules = (modules: Module[]) => saveToStorage(STORAGE_KEYS.MODULES, modules);

export const createModule = (data: Omit<Module, 'id' | 'createdAt'>): Module => {
  const modules = getModules();
  const newModule: Module = {
    ...data,
    id: `module-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  modules.push(newModule);
  saveModules(modules);
  logActivity(getCurrentUser()?.id || '', 'CREATE_MODULE', `Created module: ${data.name}`);
  return newModule;
};

export const updateModule = (id: string, updates: Partial<Module>) => {
  const modules = getModules();
  const index = modules.findIndex(m => m.id === id);
  if (index !== -1) {
    modules[index] = { ...modules[index], ...updates };
    saveModules(modules);
    logActivity(getCurrentUser()?.id || '', 'UPDATE_MODULE', `Updated module: ${modules[index].name}`);
  }
};

export const deleteModule = (id: string) => {
  const modules = getModules();
  const module = modules.find(m => m.id === id);
  const filtered = modules.filter(m => m.id !== id);
  saveModules(filtered);
  
  // Also delete associated audits
  const audits = getAudits().filter(a => a.moduleId !== id);
  saveAudits(audits);
  
  if (module) {
    logActivity(getCurrentUser()?.id || '', 'DELETE_MODULE', `Deleted module: ${module.name}`);
  }
};

export const getModulesByWebsite = (websiteId: string): Module[] => {
  return getModules().filter(m => m.websiteId === websiteId);
};

// Audit management
export const getAudits = (): AuditEntry[] => getFromStorage<AuditEntry>(STORAGE_KEYS.AUDITS);

export const saveAudits = (audits: AuditEntry[]) => saveToStorage(STORAGE_KEYS.AUDITS, audits);

export const createAudit = (data: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry => {
  const audits = getAudits();
  const newAudit: AuditEntry = {
    ...data,
    id: `audit-${Date.now()}-${Math.random()}`,
    timestamp: new Date().toISOString(),
  };
  audits.push(newAudit);
  saveAudits(audits);
  logActivity(data.userId, 'SUBMIT_AUDIT', `Submitted audit for module ID: ${data.moduleId}`);
  return newAudit;
};

export const updateAudit = (id: string, updates: Partial<AuditEntry>) => {
  const audits = getAudits();
  const index = audits.findIndex(a => a.id === id);
  if (index !== -1) {
    audits[index] = { ...audits[index], ...updates };
    saveAudits(audits);
    logActivity(getCurrentUser()?.id || '', 'UPDATE_AUDIT', `Updated audit ID: ${id}`);
  }
};

export const deleteAudit = (id: string) => {
  const audits = getAudits().filter(a => a.id !== id);
  saveAudits(audits);
  logActivity(getCurrentUser()?.id || '', 'DELETE_AUDIT', `Deleted audit ID: ${id}`);
};

export const getAuditsByDate = (date: string): AuditEntry[] => {
  return getAudits().filter(a => a.auditDate === date);
};

export const getAuditsByWebsite = (websiteId: string): AuditEntry[] => {
  return getAudits().filter(a => a.websiteId === websiteId);
};

export const getTodayAuditsByWebsite = (websiteId: string): AuditEntry[] => {
  const today = new Date().toISOString().split('T')[0];
  return getAudits().filter(a => a.websiteId === websiteId && a.auditDate === today);
};

// Activity log management
export const getActivityLogs = (): ActivityLog[] => getFromStorage<ActivityLog>(STORAGE_KEYS.ACTIVITY_LOGS);

export const saveActivityLogs = (logs: ActivityLog[]) => saveToStorage(STORAGE_KEYS.ACTIVITY_LOGS, logs);

export const logActivity = (userId: string, action: string, details?: string) => {
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    id: `log-${Date.now()}`,
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  logs.push(newLog);
  saveActivityLogs(logs);
};

// Initialize storage on load
initializeStorage();
