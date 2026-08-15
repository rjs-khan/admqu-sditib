import {
  User,
  SchoolSettings,
  GradeStandard,
  Halaqoh,
  Santri,
  AttendanceRecord,
  JournalRecord,
  PrestasiRecord,
  GradeRecord,
  PurgeOptions,
} from '../types';
import {
  initialUsers,
  initialSchoolSettings,
  initialGradeStandards,
  initialHalaqohs,
  initialSantris,
  initialAttendance,
  initialJournals,
  initialPrestasi,
  initialGrades,
} from '../data/initialData';

const KEYS = {
  USERS: 'aqu_users',
  ACTIVE_USER: 'aqu_active_user',
  SETTINGS: 'aqu_settings',
  GRADE_STANDARDS: 'aqu_grade_standards',
  HALAQOHS: 'aqu_halaqohs',
  SANTRIS: 'aqu_santris',
  ATTENDANCE: 'aqu_attendance',
  JOURNALS: 'aqu_journals',
  PRESTASI: 'aqu_prestasi',
  GRADES: 'aqu_grades',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

// Users
export function getUsers(): User[] {
  const users = getItem<User[] | null>(KEYS.USERS, null);
  if (!users || users.length === 0) {
    saveUsers(initialUsers);
    return initialUsers;
  }

  // If saved users array contains old initial demo users (e.g. ustadz_ahmad), reset to single admin account
  const hasOldDemoUsers = users.some(u => u.username === 'ustadz_ahmad' || u.username === 'ustadzah_fatimah');
  if (hasOldDemoUsers) {
    saveUsers(initialUsers);
    return initialUsers;
  }

  // Ensure admin user password is updated to 'bismillah123' if it was 'admin123'
  let modified = false;
  const updatedUsers = users.map((u) => {
    if (u.username === 'admin' && (u.password === 'admin123' || !u.password)) {
      modified = true;
      return { ...u, password: 'bismillah123' };
    }
    return u;
  });

  if (modified) {
    saveUsers(updatedUsers);
    return updatedUsers;
  }

  return users;
}

export function saveUsers(users: User[]): void {
  setItem(KEYS.USERS, users);
}

export function getActiveUser(): User | null {
  try {
    const data = sessionStorage.getItem(KEYS.ACTIVE_USER);
    if (!data) return null;
    return JSON.parse(data) as User;
  } catch (err) {
    console.error(`Error reading ${KEYS.ACTIVE_USER} from sessionStorage:`, err);
    return null;
  }
}

export function setActiveUser(user: User | null): void {
  try {
    if (user) {
      sessionStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(KEYS.ACTIVE_USER);
    }
    // Clean up any old localStorage session data
    localStorage.removeItem(KEYS.ACTIVE_USER);
  } catch (err) {
    console.error(`Error writing ${KEYS.ACTIVE_USER} to sessionStorage:`, err);
  }
}

// Settings
export function getSchoolSettings(): SchoolSettings {
  const settings = getItem<SchoolSettings>(KEYS.SETTINGS, initialSchoolSettings);
  let globalTheme: any = undefined;
  try {
    const stored = localStorage.getItem('aqu_global_theme_config');
    if (stored) globalTheme = JSON.parse(stored);
  } catch (e) {
    // ignore
  }
  return {
    ...initialSchoolSettings,
    ...settings,
    spreadsheetUrl: settings?.spreadsheetUrl || '',
    studentTerm: settings?.studentTerm || 'Murid',
    themeConfig: settings?.themeConfig || globalTheme || initialSchoolSettings.themeConfig,
  };
}

export function saveSchoolSettings(settings: SchoolSettings): void {
  setItem(KEYS.SETTINGS, settings);
  if (settings?.themeConfig) {
    try {
      localStorage.setItem('aqu_global_theme_config', JSON.stringify(settings.themeConfig));
    } catch (e) {
      // ignore
    }
  }
}

// Grade Standards
export function getGradeStandards(): GradeStandard[] {
  return getItem<GradeStandard[]>(KEYS.GRADE_STANDARDS, initialGradeStandards);
}

export function saveGradeStandards(standards: GradeStandard[]): void {
  setItem(KEYS.GRADE_STANDARDS, standards);
}

// Halaqohs
export function getHalaqohs(): Halaqoh[] {
  return getItem<Halaqoh[]>(KEYS.HALAQOHS, initialHalaqohs);
}

export function saveHalaqohs(halaqohs: Halaqoh[]): void {
  setItem(KEYS.HALAQOHS, halaqohs);
}

// Santris
export function getSantris(): Santri[] {
  return getItem<Santri[]>(KEYS.SANTRIS, initialSantris);
}

export function saveSantris(santris: Santri[]): void {
  setItem(KEYS.SANTRIS, santris);
}

// Attendance
export function getAttendance(): AttendanceRecord[] {
  return getItem<AttendanceRecord[]>(KEYS.ATTENDANCE, initialAttendance);
}

export function saveAttendance(records: AttendanceRecord[]): void {
  setItem(KEYS.ATTENDANCE, records);
}

// Journals
export function getJournals(): JournalRecord[] {
  return getItem<JournalRecord[]>(KEYS.JOURNALS, initialJournals);
}

export function saveJournals(journals: JournalRecord[]): void {
  setItem(KEYS.JOURNALS, journals);
}

// Prestasi
export function getPrestasi(): PrestasiRecord[] {
  return getItem<PrestasiRecord[]>(KEYS.PRESTASI, initialPrestasi);
}

export function savePrestasi(prestasi: PrestasiRecord[]): void {
  setItem(KEYS.PRESTASI, prestasi);
}

// Grades
export function getGrades(): GradeRecord[] {
  const grades = getItem<GradeRecord[] | null>(KEYS.GRADES, null);
  if (!grades || grades.length === 0) {
    saveGrades(initialGrades);
    return initialGrades;
  }
  // If stored grades is old 1-item initial data (from prior app version), merge or reset with initialGrades
  if (grades.length === 1 && grades[0].id === 'grd-0001' && grades[0].subjectArea === 'Hafalan' && grades[0].assessmentType === 'PTS') {
    saveGrades(initialGrades);
    return initialGrades;
  }
  return grades;
}

export function saveGrades(grades: GradeRecord[]): void {
  setItem(KEYS.GRADES, grades);
}

// Purge Data (Admin Only)
export function purgeData(options: PurgeOptions): void {
  if (options.classes) saveHalaqohs([]);
  if (options.students) saveSantris([]);
  if (options.attendance) saveAttendance([]);
  if (options.journals) saveJournals([]);
  if (options.prestasi) savePrestasi([]);
  if (options.grades) saveGrades([]);
  if (options.settings) {
    saveSchoolSettings(initialSchoolSettings);
    saveGradeStandards(initialGradeStandards);
  }
}

// Reset All to Default Initial Data
export function resetAllDataToDefault(): void {
  saveUsers(initialUsers);
  saveSchoolSettings(initialSchoolSettings);
  saveGradeStandards(initialGradeStandards);
  saveHalaqohs(initialHalaqohs);
  saveSantris(initialSantris);
  saveAttendance(initialAttendance);
  saveJournals(initialJournals);
  savePrestasi(initialPrestasi);
  saveGrades(initialGrades);
}

// Storage Export Object
export const storage = {
  getUsers,
  saveUsers,
  getActiveUser,
  saveActiveUser: setActiveUser,
  getSettings: getSchoolSettings,
  saveSettings: saveSchoolSettings,
  getGradeStandards,
  saveGradeStandards,
  getHalaqohs,
  saveHalaqohs,
  getSantris,
  saveSantris,
  getAttendanceRecords: getAttendance,
  saveAttendanceRecords: saveAttendance,
  getJournalEntries: getJournals,
  saveJournalEntries: saveJournals,
  getPrestasiRecords: getPrestasi,
  savePrestasiRecords: savePrestasi,
  getGrades,
  saveGrades,
  purgeData,
  resetAllDataToDefault,
};
