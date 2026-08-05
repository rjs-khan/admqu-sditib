import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  SchoolSettings,
  Halaqoh,
  Santri,
  AttendanceRecord,
  JournalEntry,
  PrestasiRecord,
  GradeRecord,
  GradeStandard,
  User,
} from '../types';
import { syncDatabaseToSpreadsheet } from './spreadsheetService';

export interface FullDatabasePayload {
  settings?: SchoolSettings;
  halaqohs?: Halaqoh[];
  santris?: Santri[];
  attendanceRecords?: AttendanceRecord[];
  journalEntries?: JournalEntry[];
  prestasiRecords?: PrestasiRecord[];
  grades?: GradeRecord[];
  gradeStandards?: GradeStandard[];
  users?: User[];
}

export async function fetchDatabaseFromSupabase(): Promise<{
  success: boolean;
  message: string;
  data?: FullDatabasePayload;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi via environment variable VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    // Fetch all 9 tables concurrently
    const [
      { data: rawSettings, error: errSettings },
      { data: rawHalaqohs, error: errHalaqohs },
      { data: rawSantris, error: errSantris },
      { data: rawAttendance, error: errAttendance },
      { data: rawJournals, error: errJournals },
      { data: rawPrestasi, error: errPrestasi },
      { data: rawGrades, error: errGrades },
      { data: rawStandards, error: errStandards },
      { data: rawUsers, error: errUsers },
    ] = await Promise.all([
      supabase.from('school_settings').select('*').order('updated_at', { ascending: false }).limit(1),
      supabase.from('halaqohs').select('*'),
      supabase.from('santris').select('*'),
      supabase.from('attendance_records').select('*'),
      supabase.from('journal_records').select('*'),
      supabase.from('prestasi_records').select('*'),
      supabase.from('grade_records').select('*'),
      supabase.from('grade_standards').select('*'),
      supabase.from('users').select('*'),
    ]);

    if (errSettings || errHalaqohs || errSantris || errAttendance || errJournals || errPrestasi || errGrades || errStandards || errUsers) {
      console.warn('Supabase fetch query warning/error:', {
        errSettings, errHalaqohs, errSantris, errAttendance, errJournals, errPrestasi, errGrades, errStandards, errUsers
      });
    }

    // Map Settings
    let settings: SchoolSettings | undefined = undefined;
    if (rawSettings && rawSettings.length > 0) {
      const s = rawSettings[0];
      settings = {
        logoUrl: s.logo_url || '',
        foundationLogoUrl: s.foundation_logo_url || '',
        kopUrl: s.kop_url || '',
        foundation: s.foundation || '',
        schoolName: s.school_name || '',
        accreditation: s.accreditation || '',
        address: s.address || '',
        city: s.city || '',
        paperSize: s.paper_size || 'A4',
        paperOrientation: s.paper_orientation || 'portrait',
        academicYear: s.academic_year || '',
        headmasterName: s.headmaster_name || '',
        headmasterNip: s.headmaster_nip || '',
        headmasterTitle: s.headmaster_title || '',
        gradeMaxScale: s.grade_max_scale || 100,
        studentTerm: s.student_term || 'Murid',
        parentSalutationTerm: s.parent_salutation_term || 'Bapak/Ibu',
        spreadsheetUrl: s.spreadsheet_url || '',
        themeConfig:
          typeof s.theme_config === 'string'
            ? (() => {
                try {
                  return JSON.parse(s.theme_config);
                } catch (e) {
                  return undefined;
                }
              })()
            : s.theme_config || undefined,
      };
    }

    // Map Halaqohs
    const halaqohs: Halaqoh[] = (rawHalaqohs || []).map((h: any) => ({
      id: h.id,
      name: h.name,
      level: h.level,
      waGroupLink: h.wa_group_link || '',
      createdAt: h.created_at || '',
    }));

    // Map Santris
    const santris: Santri[] = (rawSantris || []).map((s: any) => ({
      id: s.id,
      halaqohId: s.halaqoh_id || '',
      fullName: s.full_name || '',
      nis: s.nis || '',
      gender: s.gender || 'L',
      birthPlace: s.birth_place || '',
      birthDate: s.birth_date || '',
      status: s.status || 'aktif',
      entryDate: s.entry_date || '',
      fatherName: s.father_name || '',
      motherName: s.mother_name || '',
      fatherJob: s.father_job || '',
      motherJob: s.mother_job || '',
      parentWa: s.parent_wa || '',
    }));

    // Map Attendance
    const attendanceRecords: AttendanceRecord[] = (rawAttendance || []).map((a: any) => ({
      id: a.id,
      date: a.date,
      halaqohId: a.halaqoh_id || '',
      santriId: a.santri_id || '',
      status: a.status || 'H',
      notes: a.notes || undefined,
    }));

    // Map Journals
    const journalEntries: JournalEntry[] = (rawJournals || []).map((j: any) => ({
      id: j.id,
      date: j.date,
      halaqohId: j.halaqoh_id || '',
      material: j.material || '',
      notesAndEvaluation: j.notes_and_evaluation || '',
      teacherName: j.teacher_name || '',
    }));

    // Map Prestasi
    const prestasiRecords: PrestasiRecord[] = (rawPrestasi || []).map((p: any) => ({
      id: p.id,
      date: p.date,
      halaqohId: p.halaqoh_id || '',
      santriId: p.santri_id || '',
      type: p.type || 'tahsin',
      notes: p.notes || undefined,
      status: p.status || 'lanjut',
      tahsinMaterial: p.tahsin_material || undefined,
      tahsinPageAyat: p.tahsin_page_ayat || undefined,
      tahsinGrade: p.tahsin_grade || undefined,
      ziyadahJuz: p.ziyadah_juz ? Number(p.ziyadah_juz) : undefined,
      ziyadahSurah: p.ziyadah_surah || undefined,
      ziyadahAyat: p.ziyadah_ayat || undefined,
      ziyadahQuality: p.ziyadah_quality || undefined,
      murojaahMaterial: p.murojaah_material || undefined,
      murojaahAyat: p.murojaah_ayat || undefined,
      murojaahQuality: p.murojaah_quality || undefined,
    }));

    // Map Grades
    const grades: GradeRecord[] = (rawGrades || []).map((g: any) => ({
      id: g.id,
      date: g.date,
      halaqohId: g.halaqoh_id || '',
      santriId: g.santri_id || '',
      score: Number(g.score) || 0,
      assessmentType: g.assessment_type || 'PTS',
      subjectArea: g.subject_area || '',
      methodKitab: g.method_kitab || '',
    }));

    // Map Standards
    const gradeStandards: GradeStandard[] = (rawStandards || []).map((st: any) => ({
      id: st.id,
      letter: st.letter || '',
      predicate: st.predicate || '',
      description: st.description || '',
      minScore: Number(st.min_score) || 0,
    }));

    // Map Users
    const users: User[] = (rawUsers || []).map((u: any) => ({
      id: u.id,
      username: u.username,
      password: u.password,
      name: u.name,
      nip: u.nip || '',
      role: u.role || 'guru',
      title: u.title || '',
    }));

    return {
      success: true,
      message: 'Data berhasil ditarik dari Supabase.',
      data: {
        settings,
        halaqohs,
        santris,
        attendanceRecords,
        journalEntries,
        prestasiRecords,
        grades,
        gradeStandards,
        users,
      },
    };
  } catch (err: any) {
    console.error('Failed fetching data from Supabase:', err);
    return {
      success: false,
      message: `Error Supabase: ${err.message || String(err)}`,
    };
  }
}

async function syncCollection<T extends { id: string }>(
  tableName: string,
  items: T[] | undefined,
  mapToRow: (item: T) => any
) {
  if (!supabase || items === undefined) return;

  try {
    if (items.length === 0) {
      // Purge: Delete all rows in table when empty array is passed
      await supabase.from(tableName).delete().neq('id', '___non_existent_id___');
    } else {
      // 1. Fetch existing IDs from Supabase
      const { data: existingRows } = await supabase.from(tableName).select('id');
      const existingIds = (existingRows || []).map((r: any) => r.id);

      const payloadIds = new Set(items.map((item) => item.id));
      const idsToDelete = existingIds.filter((id: string) => !payloadIds.has(id));

      // 2. Delete rows no longer present in payload
      if (idsToDelete.length > 0) {
        await supabase.from(tableName).delete().in('id', idsToDelete);
      }

      // 3. Upsert rows present in payload with missing column resilience
      const rows = items.map(mapToRow);
      let attempts = 0;
      let currentRows = [...rows];
      while (attempts < 5) {
        const { error } = await supabase.from(tableName).upsert(currentRows);
        if (!error) break;
        const msg = error.message || '';
        const match = msg.match(/column "(.*?)" of relation|Could not find the '(.*?)' column/i);
        const colName = match ? (match[1] || match[2]) : null;
        if (colName) {
          console.warn(`Supabase ${tableName} missing column '${colName}', stripping and retrying...`);
          currentRows = currentRows.map(r => {
            const copy = { ...r };
            delete copy[colName];
            return copy;
          });
          attempts++;
        } else {
          console.warn(`Supabase ${tableName} upsert error:`, error);
          break;
        }
      }
    }
  } catch (err) {
    console.error(`Error syncing table ${tableName}:`, err);
  }
}

export async function saveDatabaseToSupabase(payload: FullDatabasePayload): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi via environment variable.',
    };
  }

  try {
    const promises: Promise<any>[] = [];

    // 1. Settings (Single default row or update existing row)
    if (payload.settings) {
      const s = payload.settings;
      promises.push(
        (async () => {
          let existingId = 'default';
          try {
            let res = await supabase
              .from('school_settings')
              .select('id')
              .order('updated_at', { ascending: false })
              .limit(1);
            if (res.error) {
              res = await supabase.from('school_settings').select('id').limit(1);
            }
            if (res.data && res.data.length > 0 && res.data[0].id) {
              existingId = res.data[0].id;
            }
          } catch (e) {
            // ignore
          }

          const settingsRow: any = {
            id: existingId,
            logo_url: s.logoUrl,
            foundation_logo_url: s.foundationLogoUrl,
            kop_url: s.kopUrl,
            foundation: s.foundation,
            school_name: s.schoolName,
            accreditation: s.accreditation,
            address: s.address,
            city: s.city,
            paper_size: s.paperSize,
            paper_orientation: s.paperOrientation,
            academic_year: s.academicYear,
            headmaster_name: s.headmasterName,
            headmaster_nip: s.headmasterNip,
            headmaster_title: s.headmasterTitle,
            grade_max_scale: s.gradeMaxScale,
            student_term: s.studentTerm,
            parent_salutation_term: s.parentSalutationTerm,
            spreadsheet_url: s.spreadsheetUrl,
            theme_config: s.themeConfig || null,
            updated_at: new Date().toISOString(),
          };

          let currentRow = { ...settingsRow };
          let attempts = 0;
          while (attempts < 5) {
            const { error } = await supabase.from('school_settings').upsert(currentRow);
            if (!error) break;
            const msg = error.message || '';
            const match = msg.match(/column "(.*?)" of relation|Could not find the '(.*?)' column/i);
            const colName = match ? (match[1] || match[2]) : null;
            if (colName && colName in currentRow && colName !== 'id') {
              console.warn(`Supabase school_settings missing column '${colName}', stripping and retrying...`);
              delete currentRow[colName];
              attempts++;
            } else if (msg.includes('theme_config') && 'theme_config' in currentRow) {
              delete currentRow.theme_config;
              attempts++;
            } else {
              let foundCol = false;
              for (const key of Object.keys(currentRow)) {
                if (key !== 'id' && msg.includes(key)) {
                  console.warn(`Supabase school_settings schema warning for column '${key}', retrying without it...`);
                  delete currentRow[key];
                  foundCol = true;
                  break;
                }
              }
              if (!foundCol) {
                console.warn('Supabase school_settings upsert error:', error);
                break;
              }
            }
          }
        })()
      );
    }

    // 2. Halaqohs
    if (payload.halaqohs !== undefined) {
      promises.push(
        syncCollection('halaqohs', payload.halaqohs, (h) => ({
          id: h.id,
          name: h.name,
          level: h.level,
          wa_group_link: h.waGroupLink || null,
          created_at: h.createdAt || null,
        }))
      );
    }

    // 3. Santris
    if (payload.santris !== undefined) {
      promises.push(
        syncCollection('santris', payload.santris, (s) => ({
          id: s.id,
          halaqoh_id: s.halaqohId,
          full_name: s.fullName,
          nis: s.nis,
          gender: s.gender,
          birth_place: s.birthPlace,
          birth_date: s.birthDate,
          status: s.status,
          entry_date: s.entryDate,
          father_name: s.fatherName,
          mother_name: s.motherName,
          father_job: s.fatherJob,
          mother_job: s.motherJob,
          parent_wa: s.parentWa,
        }))
      );
    }

    // 4. Attendance
    if (payload.attendanceRecords !== undefined) {
      promises.push(
        syncCollection('attendance_records', payload.attendanceRecords, (a) => ({
          id: a.id,
          date: a.date,
          halaqoh_id: a.halaqohId,
          santri_id: a.santriId,
          status: a.status,
          notes: a.notes || null,
        }))
      );
    }

    // 5. Journals
    if (payload.journalEntries !== undefined) {
      promises.push(
        syncCollection('journal_records', payload.journalEntries, (j) => ({
          id: j.id,
          date: j.date,
          halaqoh_id: j.halaqohId,
          material: j.material,
          notes_and_evaluation: j.notesAndEvaluation,
          teacher_name: j.teacherName,
        }))
      );
    }

    // 6. Prestasi
    if (payload.prestasiRecords !== undefined) {
      promises.push(
        syncCollection('prestasi_records', payload.prestasiRecords, (p) => ({
          id: p.id,
          date: p.date,
          halaqoh_id: p.halaqohId,
          santri_id: p.santriId,
          type: p.type,
          notes: p.notes || null,
          status: p.status,
          tahsin_material: p.tahsinMaterial || null,
          tahsin_page_ayat: p.tahsinPageAyat || null,
          tahsin_grade: p.tahsinGrade || null,
          ziyadah_juz: p.ziyadahJuz || null,
          ziyadah_surah: p.ziyadahSurah || null,
          ziyadah_ayat: p.ziyadahAyat || null,
          ziyadah_quality: p.ziyadahQuality || null,
          murojaah_material: p.murojaahMaterial || null,
          murojaah_ayat: p.murojaahAyat || null,
          murojaah_quality: p.murojaahQuality || null,
        }))
      );
    }

    // 7. Grades
    if (payload.grades !== undefined) {
      promises.push(
        syncCollection('grade_records', payload.grades, (g) => ({
          id: g.id,
          date: g.date,
          halaqoh_id: g.halaqohId,
          santri_id: g.santriId,
          score: g.score,
          assessment_type: g.assessmentType,
          subject_area: g.subjectArea,
          method_kitab: g.methodKitab,
        }))
      );
    }

    // 8. Grade Standards
    if (payload.gradeStandards !== undefined) {
      promises.push(
        syncCollection('grade_standards', payload.gradeStandards, (st) => ({
          id: st.id,
          letter: st.letter,
          predicate: st.predicate,
          description: st.description,
          min_score: st.minScore,
        }))
      );
    }

    // 9. Users
    if (payload.users !== undefined && payload.users.length > 0) {
      promises.push(
        syncCollection('users', payload.users, (u) => ({
          id: u.id,
          username: u.username,
          password: u.password,
          name: u.name,
          nip: u.nip || null,
          role: u.role,
          title: u.title || null,
        }))
      );
    }

    await Promise.all(promises);

    return {
      success: true,
      message: 'Data berhasil disinkronkan ke Supabase.',
    };
  } catch (err: any) {
    console.error('Error saving data to Supabase:', err);
    return {
      success: false,
      message: `Error simpan Supabase: ${err.message || String(err)}`,
    };
  }
}

/**
 * MEKANISME DUAL-WRITE (SIMPAN GANDA):
 * 1. Simpan ke Supabase jika terkonfigurasi (Wajib).
 * 2. Cek apakah ada Link Google Apps Script yang terisi di menu Pengaturan / Local Storage.
 * 3. Jika ADA: Kirimkan juga salinan data ke Apps Script via fetch POST.
 * 4. Jika KOSONG: Lewati Google Sheets dan pastikan proses simpan ke Supabase & Local tetap sukses.
 * 5. Error handling: Jika Google Sheets gagal/timeout, Supabase & local save tetap berjalan lancar.
 */
export async function executeDualWriteSync(
  payload: FullDatabasePayload,
  googleScriptUrl?: string
): Promise<{
  supabaseSuccess: boolean;
  sheetsSuccess?: boolean;
  message: string;
}> {
  let supabaseSuccess = true;
  let sheetsSuccess: boolean | undefined = undefined;
  const logMessages: string[] = [];

  // Step 1: Write to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const sbResult = await saveDatabaseToSupabase(payload);
      if (sbResult.success) {
        logMessages.push('Disimpan ke Supabase');
      } else {
        supabaseSuccess = false;
        logMessages.push(`Supabase warning: ${sbResult.message}`);
      }
    } catch (err: any) {
      supabaseSuccess = false;
      console.error('DualWrite - Supabase exception:', err);
      logMessages.push('Koneksi Supabase gagal');
    }
  }

  // Step 2: Dual write to Google Sheets if URL exists
  const cleanUrl = googleScriptUrl?.trim() || payload.settings?.spreadsheetUrl?.trim() || '';
  if (cleanUrl && (cleanUrl.includes('script.google.com') || cleanUrl.includes('docs.google.com'))) {
    try {
      const gasResult = await syncDatabaseToSpreadsheet(cleanUrl, {
        type: 'dual_write_sync',
        ...payload,
      });
      sheetsSuccess = gasResult.success;
      if (gasResult.success) {
        logMessages.push('Disalin ke Google Sheets');
      } else {
        logMessages.push(`Google Sheets notice: ${gasResult.message}`);
      }
    } catch (err: any) {
      sheetsSuccess = false;
      console.warn('DualWrite - Google Sheets exception (bypassed smoothly):', err);
      logMessages.push('Google Sheets timeout/bypass');
    }
  }

  return {
    supabaseSuccess,
    sheetsSuccess,
    message: logMessages.length > 0 ? logMessages.join(' | ') : 'Tersimpan lokal',
  };
}
