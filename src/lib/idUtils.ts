/**
 * Utility for generating neat, formatted sequential IDs across the application.
 * e.g., 'snt-0001', 'snt-0002', 'hlq-0001', 'hlq-0002', 'usr-0001', 'usr-0002', etc.
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

  const nextNum = maxNum + 1 + indexOffset;
  const padded = String(nextNum).padStart(4, '0');
  return `${prefix}-${padded}`;
}

/**
 * Checks if an ID is messy (contains timestamp, unpadded digits, or non-standard format)
 */
export function isMessyId(id: string, prefix: string): boolean {
  if (!id) return true;
  if (id === 'user-admin' || id === 'u-admin' || id === 'default') return false; // keep default special IDs
  // Must be prefix followed by at least 4 digits (e.g. snt-0001)
  const cleanRegex = new RegExp(`^${prefix}-\\d{4,}$`, 'i');
  return !cleanRegex.test(id);
}

/**
 * Helper to convert an ID with number suffix to 4-digit padded format if possible
 */
function formatToPaddedId(id: string, defaultPrefix: string, fallbackCount: number): string {
  if (!id) return `${defaultPrefix}-${String(fallbackCount).padStart(4, '0')}`;
  if (id === 'user-admin' || id === 'u-admin' || id === 'default') return id;

  const match = id.match(/^([a-z]+)-(\d+)$/i);
  if (match) {
    const pref = match[1];
    const num = parseInt(match[2], 10);
    return `${pref}-${String(num).padStart(4, '0')}`;
  }

  return `${defaultPrefix}-${String(fallbackCount).padStart(4, '0')}`;
}

/**
 * Clean and normalize all IDs in state if messy timestamp-based or unpadded IDs are detected.
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
    const cleanRegex = /^(hlq|kls)-\d{4,}$/i;
    if (!h.id || !cleanRegex.test(h.id)) {
      const newId = formatToPaddedId(h.id, 'hlq', hlqCount);
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
    const cleanRegex = /^(snt|str)-\d{4,}$/i;
    if (!s.id || !cleanRegex.test(s.id)) {
      const newId = formatToPaddedId(s.id, 'snt', santriCount);
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
    if (u.id !== 'user-admin' && u.id !== 'u-admin') {
      const cleanRegex = /^usr-\d{4,}$/i;
      if (!u.id || !cleanRegex.test(u.id)) {
        u.id = formatToPaddedId(u.id, 'usr', userCount);
        modified = true;
      }
      userCount++;
    }
  });

  // 4. Normalize Standards
  let stdCount = 1;
  standards.forEach((st) => {
    const cleanRegex = /^std-\d{4,}$/i;
    if (!st.id || !cleanRegex.test(st.id)) {
      st.id = formatToPaddedId(st.id, 'std', stdCount);
      modified = true;
    }
    stdCount++;
  });

  // 5. Normalize Journals
  let jrnCount = 1;
  journals.forEach((j) => {
    const cleanRegex = /^jrn-\d{4,}$/i;
    if (!j.id || !cleanRegex.test(j.id)) {
      j.id = formatToPaddedId(j.id, 'jrn', jrnCount);
      modified = true;
    }
    jrnCount++;
  });

  // 6. Normalize Prestasi
  let prsCount = 1;
  prestasi.forEach((p) => {
    const cleanRegex = /^prs-\d{4,}$/i;
    if (!p.id || !cleanRegex.test(p.id)) {
      p.id = formatToPaddedId(p.id, 'prs', prsCount);
      modified = true;
    }
    prsCount++;
  });

  // 7. Normalize Grades
  let grdCount = 1;
  grades.forEach((g) => {
    const cleanRegex = /^grd-\d{4,}$/i;
    if (!g.id || !cleanRegex.test(g.id)) {
      g.id = formatToPaddedId(g.id, 'grd', grdCount);
      modified = true;
    }
    grdCount++;
  });

  // 8. Normalize Attendance IDs (format ending suffix to match 4-digit santri ID or 4-digit seq)
  let attCount = 1;
  attendance.forEach((a) => {
    if (!a.id) {
      a.id = `att-${String(attCount).padStart(4, '0')}`;
      modified = true;
    } else {
      // Check composite format: att-YYYY-MM-DD-santriId
      const dateMatch = a.id.match(/^(att-\d{4}-\d{2}-\d{2})-(.+)$/i);
      if (dateMatch) {
        const prefixDate = dateMatch[1];
        // Suffix was old santri ID or index. Use updated 4-digit santriId as suffix!
        const targetSuffix = a.santriId || dateMatch[2];
        const newAttId = `${prefixDate}-${targetSuffix}`;
        if (newAttId !== a.id) {
          a.id = newAttId;
          modified = true;
        }
      } else {
        // Simple att-1 or att-001
        const cleanRegex = /^att-\d{4,}$/i;
        if (!cleanRegex.test(a.id)) {
          a.id = formatToPaddedId(a.id, 'att', attCount);
          modified = true;
        }
      }
    }
    attCount++;
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
