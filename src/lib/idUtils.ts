/**
 * Utility for generating neat, formatted sequential IDs across the application.
 * e.g., 'snt-1', 'snt-2', 'hlq-1', 'hlq-2', 'usr-1', 'usr-2', etc.
 */

export function generateCleanId(prefix: string, list: { id?: string }[] = [], indexOffset = 0): string {
  let maxNum = 0;
  const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');

  list.forEach((item) => {
    if (item && typeof item.id === 'string') {
      const match = item.id.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        // Exclude huge numbers (like timestamps > 1,000,000)
        if (!isNaN(num) && num < 1000000) {
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
  });

  return `${prefix}-${maxNum + 1 + indexOffset}`;
}

/**
 * Checks if an ID is messy (contains timestamp, snt-imp, or long random string)
 */
export function isMessyId(id: string, prefix: string): boolean {
  if (!id) return true;
  if (id === 'user-admin') return false; // keep default admin ID
  const cleanRegex = new RegExp(`^${prefix}-\\d{1,5}$`, 'i');
  return !cleanRegex.test(id);
}

/**
 * Clean and normalize all IDs in state if messy timestamp-based IDs are detected.
 * Automatically updates references across relational arrays.
 */
export function normalizeAllDataIds(data: {
  santris?: any[];
  halaqohs?: any[];
  users?: any[];
  attendanceRecords?: any[];
  journalEntries?: any[];
  prestasiRecords?: any[];
  grades?: any[];
  gradeStandards?: any[];
}) {
  const santris = data.santris ? [...data.santris] : [];
  const halaqohs = data.halaqohs ? [...data.halaqohs] : [];
  const users = data.users ? [...data.users] : [];
  const attendance = data.attendanceRecords ? [...data.attendanceRecords] : [];
  const journals = data.journalEntries ? [...data.journalEntries] : [];
  const prestasi = data.prestasiRecords ? [...data.prestasiRecords] : [];
  const grades = data.grades ? [...data.grades] : [];
  const standards = data.gradeStandards ? [...data.gradeStandards] : [];

  let modified = false;

  // 1. Normalize Halaqoh IDs
  const hlqMap: Record<string, string> = {};
  let hlqCount = 1;
  halaqohs.forEach((h) => {
    if (isMessyId(h.id, 'hlq')) {
      const newId = `hlq-${hlqCount}`;
      hlqMap[h.id] = newId;
      h.id = newId;
      modified = true;
    }
    hlqCount++;
  });

  // Update halaqohId references
  if (Object.keys(hlqMap).length > 0) {
    santris.forEach((s) => {
      if (hlqMap[s.halaqohId]) s.halaqohId = hlqMap[s.halaqohId];
    });
    attendance.forEach((a) => {
      if (hlqMap[a.halaqohId]) a.halaqohId = hlqMap[a.halaqohId];
    });
    journals.forEach((j) => {
      if (hlqMap[j.halaqohId]) j.halaqohId = hlqMap[j.halaqohId];
    });
    prestasi.forEach((p) => {
      if (hlqMap[p.halaqohId]) p.halaqohId = hlqMap[p.halaqohId];
    });
    grades.forEach((g) => {
      if (hlqMap[g.halaqohId]) g.halaqohId = hlqMap[g.halaqohId];
    });
  }

  // 2. Normalize Santri IDs
  const santriMap: Record<string, string> = {};
  let santriCount = 1;
  santris.forEach((s) => {
    if (isMessyId(s.id, 'snt')) {
      const newId = `snt-${santriCount}`;
      santriMap[s.id] = newId;
      s.id = newId;
      modified = true;
    }
    santriCount++;
  });

  // Update santriId references
  if (Object.keys(santriMap).length > 0) {
    attendance.forEach((a) => {
      if (santriMap[a.santriId]) a.santriId = santriMap[a.santriId];
    });
    prestasi.forEach((p) => {
      if (santriMap[p.santriId]) p.santriId = santriMap[p.santriId];
    });
    grades.forEach((g) => {
      if (santriMap[g.santriId]) g.santriId = santriMap[g.santriId];
    });
  }

  // 3. Normalize User IDs
  let userCount = 1;
  users.forEach((u) => {
    if (u.id !== 'user-admin' && isMessyId(u.id, 'usr')) {
      u.id = `usr-${userCount}`;
      modified = true;
    }
    if (u.id !== 'user-admin') userCount++;
  });

  // 4. Normalize Standards
  let stdCount = 1;
  standards.forEach((st) => {
    if (isMessyId(st.id, 'std')) {
      st.id = `std-${stdCount}`;
      modified = true;
    }
    stdCount++;
  });

  return {
    modified,
    santris,
    halaqohs,
    users,
    attendanceRecords: attendance,
    journalEntries: journals,
    prestasiRecords: prestasi,
    grades,
    gradeStandards: standards,
  };
}
