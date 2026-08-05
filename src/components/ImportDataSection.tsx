import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  ShieldAlert,
  Info,
  Check,
  FileCheck,
} from 'lucide-react';
import {
  IMPORT_CATEGORIES,
  parseImportFile,
  FileParseResult,
  ImportSummary,
  CategoryImportResult,
} from '../lib/dataImportService';
import { downloadDatabaseTemplateXlsx } from '../lib/spreadsheetService';
import { FullDatabasePayload } from '../lib/supabaseService';

interface ImportDataSectionProps {
  onImportData: (data: Partial<FullDatabasePayload>) => void;
}

export const ImportDataSection: React.FC<ImportDataSectionProps> = ({ onImportData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<FileParseResult | null>(null);

  // Selected categories checkboxes
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Import Progress State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStepText, setImportStepText] = useState('');

  // Import Summary State
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // Handle File Selection or Drop
  const handleFileChange = async (file: File) => {
    if (!file) return;

    setIsParsing(true);
    try {
      const res = await parseImportFile(file);
      setParseResult(res);

      // Initialize default checkboxes
      // Operational categories checked by default if present in file
      // Administrative categories unchecked by default
      const defaultState: Record<string, boolean> = {};
      IMPORT_CATEGORIES.forEach((cat) => {
        const isPresent = Boolean(res.parsedCategories[cat.key]?.rowCount);
        defaultState[cat.key] = cat.isOperational && isPresent;
      });
      setSelectedCategories(defaultState);
    } catch (err) {
      console.error('Error parsing import file:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Toggle Checkbox
  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setAllCategories = (val: boolean) => {
    if (!parseResult) return;
    const newState: Record<string, boolean> = {};
    IMPORT_CATEGORIES.forEach((cat) => {
      const isPresent = Boolean(parseResult.parsedCategories[cat.key]?.rowCount);
      if (isPresent || !val) {
        newState[cat.key] = val;
      } else {
        newState[cat.key] = false;
      }
    });
    setSelectedCategories(newState);
  };

  const setOnlyOperationalCategories = () => {
    if (!parseResult) return;
    const newState: Record<string, boolean> = {};
    IMPORT_CATEGORIES.forEach((cat) => {
      const isPresent = Boolean(parseResult.parsedCategories[cat.key]?.rowCount);
      newState[cat.key] = cat.isOperational && isPresent;
    });
    setSelectedCategories(newState);
  };

  // Get active selected list
  const activeSelectedKeys = Object.keys(selectedCategories).filter(
    (key) => selectedCategories[key] && parseResult?.parsedCategories[key]?.rowCount
  );

  // Trigger Confirmation
  const handleStartImportClick = () => {
    if (activeSelectedKeys.length === 0) return;
    setShowConfirmModal(true);
  };

  // Execute Import
  const handleConfirmImport = async () => {
    setShowConfirmModal(false);
    setIsImporting(true);
    setImportProgress(10);
    setImportStepText('Membaca dan memvalidasi file import...');

    await new Promise((r) => setTimeout(r, 400));

    setImportProgress(35);
    setImportStepText('Memproses relasi data dan mencegah duplikasi ID...');

    const payloadToImport: Partial<FullDatabasePayload> = {};
    const results: CategoryImportResult[] = [];
    let totalProcessed = 0;
    const errors: string[] = [];

    await new Promise((r) => setTimeout(r, 400));

    // Process categories
    IMPORT_CATEGORIES.forEach((cat) => {
      const isChecked = selectedCategories[cat.key];
      const categoryData = parseResult?.parsedCategories[cat.key];

      if (isChecked && categoryData && categoryData.rowCount > 0) {
        if (categoryData.error) {
          results.push({
            categoryKey: cat.key,
            categoryLabel: cat.label,
            status: 'error',
            count: 0,
            message: categoryData.error,
          });
          errors.push(categoryData.error);
        } else {
          // Assign to payload
          if (cat.key === 'settings') {
            payloadToImport.settings = categoryData.data[0];
          } else {
            (payloadToImport as any)[cat.key] = categoryData.data;
          }

          results.push({
            categoryKey: cat.key,
            categoryLabel: cat.label,
            status: 'success',
            count: categoryData.rowCount,
            message: `Berhasil mengimpor ${categoryData.rowCount} data`,
          });
          totalProcessed += categoryData.rowCount;
        }
      } else if (isChecked && (!categoryData || categoryData.rowCount === 0)) {
        results.push({
          categoryKey: cat.key,
          categoryLabel: cat.label,
          status: 'skipped',
          count: 0,
          message: 'Dilewati (Tidak ada data di dalam file)',
        });
      } else {
        results.push({
          categoryKey: cat.key,
          categoryLabel: cat.label,
          status: 'skipped',
          count: 0,
          message: 'Dilewati (Tidak dicentang)',
        });
      }
    });

    setImportProgress(75);
    setImportStepText('Menyimpan ke database dan memuat ulang tampilan aplikasi...');

    await new Promise((r) => setTimeout(r, 500));

    // Execute state update
    onImportData(payloadToImport);

    setImportProgress(100);
    setImportStepText('Import data selesai!');

    await new Promise((r) => setTimeout(r, 300));

    setIsImporting(false);
    setImportSummary({
      totalProcessed,
      results,
      errors,
    });
  };

  const handleResetImport = () => {
    setParseResult(null);
    setSelectedCategories({});
    setImportSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-700 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Import Data (Excel / CSV)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Unggah file Excel (.xlsx) atau CSV untuk memperbarui data aplikasi secara instan.
          </p>
        </div>

        <button
          type="button"
          onClick={downloadDatabaseTemplateXlsx}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Unduh Template Excel Kosong</span>
        </button>
      </div>

      {/* Step 1: Upload File Area */}
      {!parseResult && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/40'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {isParsing ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Membaca dan menganalisis file import...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  Klik untuk memilih file atau seret file ke sini
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mendukung format Excel (.xlsx, .xls) dan CSV (.csv)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: File Parsed & Category Checkboxes */}
      {parseResult && !importSummary && (
        <div className="space-y-6">
          {/* File Card Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {parseResult.fileName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ukuran: {(parseResult.fileSize / 1024).toFixed(1)} KB • Total Data Ditemukan:{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {parseResult.totalRowsFound} baris
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetImport}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer self-start sm:self-center"
            >
              Ganti File
            </button>
          </div>

          {/* Validation Warnings if any */}
          {parseResult.errors.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Peringatan Struktur File:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1">
                {parseResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Category Checkbox Selection Area */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Pilih Kategori Data Yang Ingin Diimpor:
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Data yang dicentang akan diganti dengan data baru dari file. Data yang tidak dicentang tetap aman.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={setOnlyOperationalCategories}
                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Rekomendasi (Operasional Only)
                </button>
                <button
                  type="button"
                  onClick={() => setAllCategories(true)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => setAllCategories(false)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Grid Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {IMPORT_CATEGORIES.map((cat) => {
                const categoryData = parseResult.parsedCategories[cat.key];
                const count = categoryData ? categoryData.rowCount : 0;
                const isPresent = Boolean(count > 0);
                const isChecked = Boolean(selectedCategories[cat.key]);

                return (
                  <div
                    key={cat.key}
                    onClick={() => isPresent && toggleCategory(cat.key)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      !isPresent
                        ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                        : isChecked
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-bold truncate ${
                              isChecked
                                ? 'text-emerald-900 dark:text-emerald-200'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {cat.label}
                          </span>

                          {isPresent ? (
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-full shrink-0">
                              {count} data
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-medium rounded-full shrink-0">
                              Tidak ada di file
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>

                        {!cat.isOperational && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            • Data Sensitif / Administratif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Dipilih:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {activeSelectedKeys.length} kategori
                </strong>{' '}
                akan diperbarui
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleResetImport}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={activeSelectedKeys.length === 0}
                onClick={handleStartImportClick}
                className="px-6 py-2.5 custom-theme-btn disabled:opacity-50 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Mulai Import Data ({activeSelectedKeys.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Konfirmasi Import Data
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Import data akan mengganti data yang dipilih dengan data dari file. Data yang tidak
                  dipilih tidak akan berubah. Apakah Anda yakin ingin melanjutkan?
                </p>
              </div>
            </div>

            {/* List of categories to be replaced */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                Kategori yang akan diganti ({activeSelectedKeys.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeSelectedKeys.map((key) => {
                  const cat = IMPORT_CATEGORIES.find((c) => c.key === key);
                  const count = parseResult?.parsedCategories[key]?.rowCount || 0;
                  return (
                    <span
                      key={key}
                      className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-medium rounded-lg text-[11px]"
                    >
                      {cat?.label || key} ({count})
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-5 py-2 custom-theme-btn font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Ya, Import Data Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress / Loading Modal */}
      {isImporting && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Memproses Import Data...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {importStepText}
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {importProgress}%
            </span>
          </div>
        </div>
      )}

      {/* Summary Results Modal */}
      {importSummary && (
        <div className="p-5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h4 className="text-sm font-bold">Import Data Selesai & Berhasil Diperbarui!</h4>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full">
              {importSummary.totalProcessed} Data Diimpor
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Seluruh data yang dicentang telah berhasil diperbarui ke dalam sistem. Tampilan dashboard dan fitur lainnya telah otomatis diperbarui.
          </p>

          {/* Detail Category Summary Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Kategori Data</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Jumlah Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {importSummary.results.map((res) => (
                  <tr key={res.categoryKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">
                      {res.categoryLabel}
                    </td>
                    <td className="px-4 py-2">
                      {res.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Berhasil
                        </span>
                      )}
                      {res.status === 'skipped' && (
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          Dilewati
                        </span>
                      )}
                      {res.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                          <XCircle className="w-3.5 h-3.5" /> Error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">
                      {res.count > 0 ? `${res.count} data` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Finish Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleResetImport}
              className="px-5 py-2.5 custom-theme-btn font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Selesai & Tutup Ringkasan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
