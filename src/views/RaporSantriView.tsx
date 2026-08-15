import React, { useState } from 'react';
import { getStudentTerm, getStudentTermLower } from '../lib/studentTerm';
import {
  Halaqoh,
  Santri,
  AttendanceRecord,
  PrestasiRecord,
  PrestasiType,
  GradeRecord,
  SchoolSettings,
  User,
  PaperSize,
  PaperOrientation,
} from '../types';
import { SchoolLogo } from '../components/SchoolLogo';
import {
  FileSpreadsheet,
  Download,
  Send,
  Calendar,
  Printer,
  X,
  UserCheck,
  BookOpen,
  Award,
  GraduationCap,
  Sparkles,
  Phone,
  Eye,
  Loader2,
  FileType,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface RaporSantriViewProps {
  halaqohs: Halaqoh[];
  santris: Santri[];
  attendanceRecords: AttendanceRecord[];
  prestasiRecords: PrestasiRecord[];
  grades: GradeRecord[];
  settings: SchoolSettings;
  activeUser: User;
}

// Helper for Indonesian Date Formatting (e.g., Bandung, 2 Januari 2026)
const formatIndonesianFullDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthIdx = parseInt(m, 10) - 1;
  const day = parseInt(d, 10);
  return `${day} ${monthNames[monthIdx] || m} ${y}`;
};

export const RaporSantriView: React.FC<RaporSantriViewProps> = ({
  halaqohs,
  santris,
  attendanceRecords,
  prestasiRecords,
  grades,
  settings,
  activeUser,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const term = getStudentTerm(settings);
  const termLower = getStudentTermLower(settings);
  const termUpper = term.toUpperCase();

  // 9.1 Pilihan halaqoh
  const [selectedHalaqohId, setSelectedHalaqohId] = useState<string>(halaqohs[0]?.id || '');

  // 9.2 Pilihan nama peserta (harus pilih halaqoh dulu)
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');

  // 9.4 Pengaturan dari tanggal sampai tanggal (kosong = seluruh waktu)
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Paper settings derived directly from school settings
  const paperSize: PaperSize = settings.paperSize || 'A4';
  const paperOrientation: PaperOrientation = settings.paperOrientation || 'portrait';

  // Preview & Modal states
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [previewScale, setPreviewScale] = useState<number>(1);

  // Helper for paper dimensions
  const getDocDimensions = () => {
    const isLandscape = paperOrientation === 'landscape';
    const isF4 = paperSize === 'F4';

    if (isLandscape) {
      return {
        label: isF4 ? 'F4 Landscape' : 'A4 Landscape',
        widthClass: isF4 ? 'max-w-[330mm]' : 'max-w-[297mm]',
        modalWidthClass: isF4 ? 'w-[330mm]' : 'w-[297mm]',
        modalMinHeightClass: isF4 ? 'min-h-[215mm]' : 'min-h-[210mm]',
      };
    } else {
      return {
        label: isF4 ? 'F4 Portrait' : 'A4 Portrait',
        widthClass: isF4 ? 'max-w-[215mm]' : 'max-w-[210mm]',
        modalWidthClass: isF4 ? 'w-[215mm]' : 'w-[210mm]',
        modalMinHeightClass: isF4 ? 'min-h-[330mm]' : 'min-h-[297mm]',
      };
    }
  };
  const docDim = getDocDimensions();

  // Helper function to convert oklab to RGB
  const oklabToRgb = (L: number, aComp: number, bComp: number, alpha?: number): string => {
    const l_ = L + 0.3963377774 * aComp + 0.2158037573 * bComp;
    const m_ = L - 0.1055613458 * aComp - 0.0638541728 * bComp;
    const s_ = L - 0.0894841775 * aComp - 1.2914855480 * bComp;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    const toGamma = (val: number) => {
      const clamped = Math.max(0, Math.min(1, val));
      return clamped > 0.0031308
        ? 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
        : 12.92 * clamped;
    };

    const r = Math.round(toGamma(rLin) * 255);
    const g = Math.round(toGamma(gLin) * 255);
    const b = Math.round(toGamma(bLin) * 255);

    if (alpha !== undefined && alpha < 1) {
      return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  };

  const parseOklchString = (str: string): string | null => {
    try {
      const inner = str.replace(/^oklch\(\s*/i, '').replace(/\s*\)$/, '');
      const parts = inner.split(/[\s,/]+/);
      if (parts.length < 3) return null;

      let lStr = parts[0];
      let cStr = parts[1];
      let hStr = parts[2];
      let aStr = parts[3];

      let l = parseFloat(lStr);
      if (isNaN(l)) l = 0.5;
      if (lStr.endsWith('%')) l = l / 100;

      let c = parseFloat(cStr);
      if (isNaN(c)) c = 0;
      if (cStr.endsWith('%')) c = c / 100;

      let h = parseFloat(hStr);
      if (isNaN(h)) h = 0;
      if (hStr.endsWith('rad')) h = (h * 180) / Math.PI;

      let a: number | undefined = undefined;
      if (aStr !== undefined && aStr !== '') {
        a = parseFloat(aStr);
        if (isNaN(a)) a = 1;
        if (aStr.endsWith('%')) a = a / 100;
      }

      const hRad = (h * Math.PI) / 180;
      const aComp = c * Math.cos(hRad);
      const bComp = c * Math.sin(hRad);

      return oklabToRgb(l, aComp, bComp, a);
    } catch {
      return null;
    }
  };

  const parseOklabString = (str: string): string | null => {
    try {
      const inner = str.replace(/^oklab\(\s*/i, '').replace(/\s*\)$/, '');
      const parts = inner.split(/[\s,/]+/);
      if (parts.length < 3) return null;

      let lStr = parts[0];
      let aStrComp = parts[1];
      let bStrComp = parts[2];
      let alphaStr = parts[3];

      let l = parseFloat(lStr);
      if (isNaN(l)) l = 0.5;
      if (lStr.endsWith('%')) l = l / 100;

      let aComp = parseFloat(aStrComp);
      if (isNaN(aComp)) aComp = 0;
      if (aStrComp.endsWith('%')) aComp = aComp / 100;

      let bComp = parseFloat(bStrComp);
      if (isNaN(bComp)) bComp = 0;
      if (bStrComp.endsWith('%')) bComp = bComp / 100;

      let alpha: number | undefined = undefined;
      if (alphaStr !== undefined && alphaStr !== '') {
        alpha = parseFloat(alphaStr);
        if (isNaN(alpha)) alpha = 1;
        if (alphaStr.endsWith('%')) alpha = alpha / 100;
      }

      return oklabToRgb(l, aComp, bComp, alpha);
    } catch {
      return null;
    }
  };

  // Helper function to convert color strings (oklch, oklab, light-dark) to standard hex/rgb
  const parseToStandardColor = (colorStr: string): string => {
    if (!colorStr || typeof colorStr !== 'string') return colorStr;
    const trimmed = colorStr.trim();
    const lower = trimmed.toLowerCase();

    if (lower.startsWith('oklch')) {
      const res = parseOklchString(lower);
      if (res && !res.toLowerCase().includes('oklch')) return res;
      return 'rgb(0, 0, 0)';
    }

    if (lower.startsWith('oklab')) {
      const res = parseOklabString(lower);
      if (res && !res.toLowerCase().includes('oklab')) return res;
      return 'rgb(0, 0, 0)';
    }

    if (lower.startsWith('color-mix') || lower.startsWith('light-dark')) {
      return 'rgb(0, 0, 0)';
    }

    if (lower.includes('oklch') || lower.includes('oklab')) {
      return 'rgb(0, 0, 0)';
    }

    return colorStr;
  };

  const sanitizeColorString = (str: string): string => {
    if (!str || typeof str !== 'string') return str;
    if (!/(oklch|oklab|color-mix|light-dark)/i.test(str)) return str;

    let result = str.replace(/(oklch|oklab|color-mix|light-dark)\([^)]+\)/gi, (match) => {
      return parseToStandardColor(match);
    });

    if (/(oklch|oklab|color-mix|light-dark)/i.test(result)) {
      result = result.replace(/(oklch|oklab|color-mix|light-dark)\b[^;}"']*/gi, 'rgb(0, 0, 0)');
    }

    return result;
  };

  const handleTriggerPrint = () => {
    setIsPdfModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleOpenPreviewPdf = () => {
    setIsPdfModalOpen(false);
    setIsPreviewModalOpen(true);
  };

  const convertImagesToDataUrls = async (container: HTMLElement) => {
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        return new Promise<void>((resolve) => {
          if (!img.src || img.src.startsWith('data:')) {
            resolve();
            return;
          }
          const newImg = new Image();
          newImg.crossOrigin = 'anonymous';
          newImg.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = newImg.naturalWidth || newImg.width || 120;
              canvas.height = newImg.naturalHeight || newImg.height || 120;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(newImg, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                img.src = dataUrl;
              }
            } catch (e) {
              console.warn('Could not convert image to data URL:', e);
            }
            resolve();
          };
          newImg.onerror = () => {
            resolve();
          };
          newImg.src = img.src;
        });
      })
    );
  };

  // Direct PDF Download Handler using html2pdf.js with full paper dimensions & zero cut-offs
  const handleDownloadPdf = async () => {
    const element = document.getElementById('rapor-printable-document');
    if (!element) {
      alert('Silakan pilih peserta terlebih dahulu.');
      return;
    }
    setIsGeneratingPdf(true);

    try {
      await convertImagesToDataUrls(element);

      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

      const santriName = selectedSantri ? selectedSantri.fullName.replace(/\s+/g, '_') : 'Santri';
      const fileName = `Rapor_${santriName}_${settings.academicYear || ''}.pdf`;

      const isF4 = paperSize === 'F4';
      const isLandscape = paperOrientation === 'landscape';

      const pdfWidth = isLandscape ? (isF4 ? 330 : 297) : (isF4 ? 215 : 210);
      const pdfHeight = isLandscape ? (isF4 ? 215 : 210) : (isF4 ? 330 : 297);

      const pxWidth = Math.round(pdfWidth * (96 / 25.4));

      const opt = {
        margin: [0, 0, 0, 0],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: pxWidth,
          onclone: (clonedDoc: Document) => {
            // 1. Clean style tags for oklch/oklab
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((styleTag) => {
              if (styleTag.textContent) {
                styleTag.textContent = sanitizeColorString(styleTag.textContent);
              }
            });

            // 1b. Clean styleSheets in clonedDoc if accessible
            try {
              Array.from(clonedDoc.styleSheets).forEach((sheet) => {
                try {
                  const rules = Array.from(sheet.cssRules || sheet.rules || []);
                  rules.forEach((rule) => {
                    if (rule.cssText && /(oklch|oklab|color-mix|light-dark)/i.test(rule.cssText)) {
                      const sanitized = sanitizeColorString(rule.cssText);
                      try {
                        (rule as any).cssText = sanitized;
                      } catch (e) {
                        // ignore
                      }
                    }
                  });
                } catch (e) {
                  // ignore
                }
              });
            } catch (e) {
              // ignore
            }

            // 2. Inject explicit PDF style overrides
            const pdfCssTag = clonedDoc.createElement('style');
            pdfCssTag.textContent = `
              #rapor-printable-document, #rekap-printable-document, .printable-document {
                border: none !important;
                border-width: 0 !important;
                box-shadow: none !important;
                outline: none !important;
                border-radius: 0 !important;
                padding: 12mm !important;
                margin: 0 !important;
                width: ${pdfWidth}mm !important;
                min-height: auto !important;
                height: auto !important;
                box-sizing: border-box !important;
                background-color: #ffffff !important;
                color: #000000 !important;
              }
              table {
                border-collapse: collapse !important;
                width: 100% !important;
                page-break-inside: auto !important;
              }
              tr, .avoid-break, .keep-together, .signature-section, .kop-surat {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                break-inside: avoid-page !important;
              }
              th, td {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              thead {
                display: table-header-group !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              tbody {
                page-break-inside: auto !important;
              }
            `;
            clonedDoc.head.appendChild(pdfCssTag);

            // 3. Remove outer border & shadow & padding from printable target element
            const targetEl = clonedDoc.getElementById('rapor-printable-document') || clonedDoc.querySelector('.printable-document');
            if (targetEl) {
              const htmlTarget = targetEl as HTMLElement;
              htmlTarget.style.border = 'none';
              htmlTarget.style.borderWidth = '0px';
              htmlTarget.style.borderColor = 'transparent';
              htmlTarget.style.boxShadow = 'none';
              htmlTarget.style.borderRadius = '0px';
              htmlTarget.style.outline = 'none';
              htmlTarget.style.padding = '12mm';
              htmlTarget.style.margin = '0px';
              htmlTarget.style.width = `${pdfWidth}mm`;
              htmlTarget.style.minHeight = 'auto';
              htmlTarget.style.height = 'auto';
              htmlTarget.style.boxSizing = 'border-box';
              htmlTarget.style.backgroundColor = '#ffffff';
              htmlTarget.style.color = '#000000';
            }

            // 4. Set pageBreakInside = avoid on table rows and blocks
            const allTrs = clonedDoc.querySelectorAll('tr, thead, .avoid-break, .keep-together, .signature-section, .kop-surat');
            allTrs.forEach((tr) => {
              const htmlEl = tr as HTMLElement;
              htmlEl.style.pageBreakInside = 'avoid';
              (htmlEl.style as any).breakInside = 'avoid';
            });

            // 5. Clean inline styles & sanitize computed colors directly on cloned elements
            const clonedWin = clonedDoc.defaultView || window;
            const allElms = clonedDoc.querySelectorAll('*');
            allElms.forEach((el) => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.style && htmlEl.style.cssText) {
                htmlEl.style.cssText = sanitizeColorString(htmlEl.style.cssText);
              }
              if (clonedWin && clonedWin.getComputedStyle) {
                try {
                  const cs = clonedWin.getComputedStyle(htmlEl);
                  if (cs) {
                    if (cs.color && /(oklch|oklab|color-mix|light-dark)/i.test(cs.color)) {
                      htmlEl.style.color = sanitizeColorString(cs.color);
                    }
                    if (cs.backgroundColor && /(oklch|oklab|color-mix|light-dark)/i.test(cs.backgroundColor)) {
                      htmlEl.style.backgroundColor = sanitizeColorString(cs.backgroundColor);
                    }
                    if (cs.borderColor && /(oklch|oklab|color-mix|light-dark)/i.test(cs.borderColor)) {
                      htmlEl.style.borderColor = sanitizeColorString(cs.borderColor);
                    }
                  }
                } catch (e) {
                  // ignore
                }
              }
            });
          },
        },
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: [
            'tr',
            'thead',
            '.avoid-break',
            '.keep-together',
            '.signature-section',
            '.kop-surat'
          ]
        },
        jsPDF: { unit: 'mm', format: [pdfWidth, pdfHeight], orientation: paperOrientation },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Gagal mengunduh file PDF: ' + (err?.message || 'Terjadi kesalahan saat memproses dokumen'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Export to Word (.docx) Handler
  const handleExportWord = () => {
    const element = document.getElementById('rapor-printable-document');
    if (!element) {
      alert('Silakan pilih peserta terlebih dahulu.');
      return;
    }

    const santriName = selectedSantri ? selectedSantri.fullName.replace(/\s+/g, '_') : 'Santri';
    const fileName = `Rapor_${santriName}_${settings.academicYear || ''}.doc`;

    const isLandscape = paperOrientation === 'landscape';
    const clone = element.cloneNode(true) as HTMLElement;

    const noPrintElements = clone.querySelectorAll('.no-print');
    noPrintElements.forEach((el) => el.remove());

    const wordHtml = `
      <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>RAPOR SANTRI - ${selectedSantri?.fullName || ''}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page WordSection1 {
            size: ${paperSize === 'F4' ? (isLandscape ? '330mm 215mm' : '215mm 330mm') : (isLandscape ? '297mm 210mm' : '210mm 297mm')};
            margin: 15mm;
            mso-page-orientation: ${paperOrientation};
          }
          div.WordSection1 {
            page: WordSection1;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            color: #000000;
            background-color: #ffffff;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 10px;
            margin-bottom: 10px;
          }
          th, td {
            border: 1px solid #000000;
            padding: 5px 7px;
            font-size: 10pt;
            vertical-align: middle;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            text-align: center;
          }
          .border-none, table.no-border td, table.no-border th {
            border: none !important;
          }
          .text-left { text-align: left !important; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .font-bold { font-weight: bold !important; }
          .uppercase { text-transform: uppercase !important; }
          .underline { text-decoration: underline !important; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          ${clone.innerHTML}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
    saveAs(blob, fileName);
  };

  // Export to Excel (.xlsx) Handler
  const handleExportExcel = () => {
    const element = document.getElementById('rapor-printable-document');
    if (!element) {
      alert('Silakan pilih peserta terlebih dahulu.');
      return;
    }

    const santriName = selectedSantri ? selectedSantri.fullName.replace(/\s+/g, '_') : 'Santri';
    const fileName = `Rapor_${santriName}_${settings.academicYear || ''}.xlsx`;

    const clone = element.cloneNode(true) as HTMLElement;

    const noPrintElements = clone.querySelectorAll('.no-print');
    noPrintElements.forEach((el) => el.remove());

    const tables = clone.querySelectorAll('table');
    const wb = XLSX.utils.book_new();

    if (tables.length > 0) {
      tables.forEach((tbl, idx) => {
        const ws = XLSX.utils.table_to_sheet(tbl, { raw: true });
        XLSX.utils.book_append_sheet(wb, ws, tables.length === 1 ? 'Rapor Santri' : `Tabel ${idx + 1}`);
      });
    } else {
      const ws = XLSX.utils.table_to_sheet(clone, { raw: true });
      XLSX.utils.book_append_sheet(wb, ws, 'Rapor Santri');
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  };

  const availableSantris = (santris || []).filter((s) => s.halaqohId === selectedHalaqohId && s.status === 'aktif');
  const selectedSantri = (santris || []).find((s) => s.id === selectedSantriId);
  const selectedHalaqoh = (halaqohs || []).find((h) => h.id === selectedHalaqohId);

  // Filter records by date range if specified
  const filterByDate = (dateStr?: string) => {
    if (!dateStr) return false;
    const recDate = dateStr.split('T')[0];
    if (fromDate && recDate < fromDate) return false;
    if (toDate && recDate > toDate) return false;
    return true;
  };

  const santriAtt = (attendanceRecords || []).filter(
    (a) => String(a.santriId).trim() === String(selectedSantriId).trim() && filterByDate(a.date)
  );
  const santriPrestasi = (prestasiRecords || []).filter(
    (p) => String(p.santriId).trim() === String(selectedSantriId).trim() && filterByDate(p.date)
  );
  const santriGrades = (grades || []).filter(
    (g) => String(g.santriId).trim() === String(selectedSantriId).trim() && filterByDate(g.date)
  );

  // Helper formatters for Prestasi summary in Rapor Santri
  const formatSinglePrestasiMaterial = (p: PrestasiRecord): string => {
    if (p.type === 'tahsin') {
      if (!p.tahsinMaterial && !p.tahsinPageAyat) return '-';
      const mat = p.tahsinMaterial || '';
      const pageAyat = p.tahsinPageAyat ? `(${p.tahsinPageAyat})` : '';
      return [mat, pageAyat].filter(Boolean).join(' ');
    }
    if (p.type === 'ziyadah') {
      const parts: string[] = [];
      if (p.ziyadahJuz !== undefined && p.ziyadahJuz !== null && String(p.ziyadahJuz) !== '') {
        parts.push(`Juz ${p.ziyadahJuz}`);
      }
      if (p.ziyadahSurah) {
        parts.push(p.ziyadahSurah);
      }
      const base = parts.join(' - ');
      const ayat = p.ziyadahAyat ? `(${p.ziyadahAyat})` : '';
      const res = [base, ayat].filter(Boolean).join(' ');
      return res || '-';
    }
    if (p.type === 'murojaah') {
      if (!p.murojaahMaterial && !p.murojaahAyat) return '-';
      const mat = p.murojaahMaterial || '';
      let ayatStr = '';
      if (p.murojaahAyat) {
        const lowerAyat = p.murojaahAyat.toLowerCase();
        if (lowerAyat.startsWith('ayat') || lowerAyat.startsWith('hal') || lowerAyat.startsWith('juz')) {
          ayatStr = `(${p.murojaahAyat})`;
        } else {
          ayatStr = `(Ayat ${p.murojaahAyat})`;
        }
      }
      return [mat, ayatStr].filter(Boolean).join(' ') || '-';
    }
    return '-';
  };

  const formatQualityToLetterPredicate = (val?: string | number): string => {
    if (val === undefined || val === null || val === '') return '-';
    const str = String(val).trim();
    if (!str || str === '-') return '-';

    // If already in "Huruf (Predikat)" format like "A (Mumtaz)" or "A+ (Mumtaz)"
    const letterParenMatch = str.match(/^([A-Da-d][+-]?)\s*\((.+)\)$/);
    if (letterParenMatch) {
      const letter = letterParenMatch[1].toUpperCase();
      const pred = letterParenMatch[2].trim();
      return `${letter} (${pred})`;
    }

    // If in reverse "Predikat (Huruf)" format like "Mumtaz (A)" or "Jayyid Jiddan (A)"
    const predParenMatch = str.match(/^(.+)\s*\(([A-Da-d][+-]?)\)$/);
    if (predParenMatch) {
      const pred = predParenMatch[1].trim();
      const letter = predParenMatch[2].toUpperCase();
      return `${letter} (${pred})`;
    }

    const lower = str.toLowerCase();

    // Check numerical values
    if (!isNaN(Number(str))) {
      const num = Number(str);
      if (num >= 90) return 'A (Mumtaz)';
      if (num >= 80) return 'A (Jayyid Jiddan)';
      if (num >= 70) return 'B+ (Jayyid)';
      if (num >= 60) return 'B (Maqbul)';
      return 'C (Rasib)';
    }

    // Check specific textual grades/predicates
    if (lower === 'a+') return 'A+ (Mumtaz)';
    if (lower === 'a') return 'A (Mumtaz)';
    if (lower === 'b+') return 'B+ (Jayyid)';
    if (lower === 'b') return 'B (Maqbul)';
    if (lower === 'c') return 'C (Rasib)';
    if (lower === 'd') return 'D (Rasib)';

    if (lower.includes('mumtaz') || lower.includes('istimewa') || lower.includes('sangat baik sekali')) {
      return lower.includes('a+') ? 'A+ (Mumtaz)' : 'A (Mumtaz)';
    }
    if (lower.includes('jayyid jiddan') || lower.includes('sangat baik') || lower.includes('sangat lancar')) {
      return 'A (Jayyid Jiddan)';
    }
    if (lower.includes('jayyid') || lower.includes('baik') || lower.includes('lancar')) {
      return 'B+ (Jayyid)';
    }
    if (lower.includes('maqbul') || lower.includes('cukup')) {
      return 'B (Maqbul)';
    }
    if (lower.includes('rasib') || lower.includes('kurang') || lower.includes('mengulang') || lower.includes('ulang')) {
      return 'C (Rasib)';
    }

    return str;
  };

  const calculatePrestasiAverageQuality = (type: PrestasiType, recs: PrestasiRecord[]): string => {
    if (recs.length === 0) return '-';
    if (recs.length === 1) {
      const r = recs[0];
      const val = type === 'tahsin' ? r.tahsinGrade : type === 'ziyadah' ? r.ziyadahQuality : r.murojaahQuality;
      return formatQualityToLetterPredicate(val);
    }

    const scores: number[] = [];
    for (const r of recs) {
      const val = (type === 'tahsin' ? r.tahsinGrade : type === 'ziyadah' ? r.ziyadahQuality : r.murojaahQuality) || '';
      const lower = String(val).trim().toLowerCase();
      if (!lower) continue;
      if (!isNaN(Number(lower))) {
        scores.push(Number(lower));
      } else if (lower === 'a+' || lower.includes('a+') || lower.includes('mumtaz') || lower.includes('sangat baik sekali') || lower.includes('istimewa')) {
        scores.push(95);
      } else if (lower === 'a' || lower.includes('jayyid jiddan') || lower.includes('sangat baik') || lower.includes('sangat lancar')) {
        scores.push(85);
      } else if (lower === 'b+' || lower.includes('jayyid') || lower.includes('baik') || lower.includes('lancar')) {
        scores.push(75);
      } else if (lower === 'b' || lower.includes('maqbul') || lower.includes('cukup')) {
        scores.push(65);
      } else if (lower === 'c' || lower.includes('rasib') || lower.includes('kurang') || lower.includes('ulang')) {
        scores.push(50);
      } else {
        scores.push(75);
      }
    }

    if (scores.length === 0) return '-';
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    if (avg >= 95) return 'A+ (Mumtaz)';
    if (avg >= 90) return 'A (Mumtaz)';
    if (avg >= 80) return 'A (Jayyid Jiddan)';
    if (avg >= 70) return 'B+ (Jayyid)';
    if (avg >= 60) return 'B (Maqbul)';
    return 'C (Rasib)';
  };

  // Grouped 3 activity elements for concise report printing
  const prestasiActivityTypes: { key: PrestasiType; label: string }[] = [
    { key: 'tahsin', label: 'TAHSIN' },
    { key: 'ziyadah', label: 'ZIYADAH' },
    { key: 'murojaah', label: "MUROJA'AH" },
  ];

  const prestasiSummaryRows = prestasiActivityTypes.map((act) => {
    const actRecords = santriPrestasi
      .filter((p) => p.type === act.key)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let periode = '-';
    if (actRecords.length === 0) {
      if (fromDate && toDate) {
        periode = `${fromDate} s/d ${toDate}`;
      } else if (fromDate) {
        periode = `Dari ${fromDate}`;
      } else if (toDate) {
        periode = `Sampai ${toDate}`;
      } else {
        periode = '-';
      }
    } else if (actRecords.length === 1) {
      periode = actRecords[0].date;
    } else {
      const minD = actRecords[0].date;
      const maxD = actRecords[actRecords.length - 1].date;
      periode = minD === maxD ? minD : `${minD} s/d ${maxD}`;
    }

    let materiRange = '-';
    if (actRecords.length === 0) {
      materiRange = '-';
    } else if (actRecords.length === 1) {
      materiRange = formatSinglePrestasiMaterial(actRecords[0]);
    } else {
      const firstMat = formatSinglePrestasiMaterial(actRecords[0]);
      const lastMat = formatSinglePrestasiMaterial(actRecords[actRecords.length - 1]);
      if (firstMat === '-' && lastMat === '-') {
        materiRange = '-';
      } else if (firstMat === lastMat) {
        materiRange = firstMat;
      } else {
        materiRange = `${firstMat} s/d ${lastMat}`;
      }
    }

    const avgQuality = calculatePrestasiAverageQuality(act.key, actRecords);

    return {
      key: act.key,
      label: act.label,
      periode,
      materiRange,
      avgQuality,
      recordCount: actRecords.length,
    };
  });

  // Stats calculation
  const isH = (st?: string) => st === 'H' || st?.toLowerCase() === 'hadir';
  const isI = (st?: string) => st === 'I' || st?.toLowerCase() === 'izin';
  const isS = (st?: string) => st === 'S' || st?.toLowerCase() === 'sakit';
  const isA = (st?: string) => st === 'A' || st?.toLowerCase() === 'alpha' || st?.toLowerCase() === 'alpa';
  const isT = (st?: string) => st === 'T' || st?.toLowerCase() === 'telat' || st?.toLowerCase() === 'terlambat';

  const hadirCount = santriAtt.filter((a) => isH(a.status)).length;
  const izinCount = santriAtt.filter((a) => isI(a.status)).length;
  const sakitCount = santriAtt.filter((a) => isS(a.status)).length;
  const alphaCount = santriAtt.filter((a) => isA(a.status)).length;
  const telatCount = santriAtt.filter((a) => isT(a.status)).length;
  
  const totalAtt = hadirCount + izinCount + sakitCount + alphaCount + telatCount;
  const totalPresent = hadirCount + telatCount;
  const attPercentage = totalAtt > 0 ? Math.round((totalPresent / totalAtt) * 100) : 100;

  // WA Parent Notification Sender
  const handleSendWA = () => {
    if (!selectedSantri) return;
    const parentPhone = selectedSantri.parentPhone || selectedSantri.phone;
    if (!parentPhone) {
      alert(`Nomor WA Orang Tua / Wali untuk ${selectedSantri.fullName} belum diisi.`);
      return;
    }

    let formattedPhone = parentPhone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    const textMsg = `Assalamu'alaikum Wr. Wb. Bpk/Ibu Wali dari ${selectedSantri.fullName}, berikut Laporan Perkembangan Hasil Belajar Al-Qur'an Santri di ${settings.schoolName}.\n\n` +
      `- Presensi Kehadiran: ${attPercentage}% (${hadirCount} Hadir dari ${totalAtt} pertemuan)\n` +
      `- Total Setoran Setoran Kartu Prestasi: ${santriPrestasi.length} catatan\n` +
      `- Total Evaluasi Nilai Ujian: ${santriGrades.length} penilaian\n\n` +
      `Silakan hubungi Pengajar/Ustadz untuk informasi lebih lanjut. Syukron Wa Jazakumullah Khairan.`;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(textMsg)}`;
    window.open(waUrl, '_blank');
  };

  // Render document body for printing/export
  const renderRaporDocumentContent = () => {
    if (!selectedSantri || !selectedHalaqoh) return null;

    const isF4 = paperSize === 'F4';
    const isLandscape = paperOrientation === 'landscape';

    const docWidthMm = isLandscape ? (isF4 ? 330 : 297) : (isF4 ? 215 : 210);
    const docMinHeightMm = isLandscape ? (isF4 ? 215 : 210) : (isF4 ? 330 : 297);

    return (
      <div
        id="rapor-printable-document"
        className="bg-white text-slate-900 space-y-6 printable-document border-0 border-none shadow-none outline-none rounded-none mx-auto"
        style={{
          width: `${docWidthMm}mm`,
          padding: '12mm',
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: 'none',
          outline: 'none',
          backgroundColor: '#ffffff',
          color: '#000000',
        }}
      >
        {/* KOP Surat */}
        <div className="border-b-4 border-double border-slate-900 pb-4 text-center">
          {settings.kopUrl ? (
            <img
              src={settings.kopUrl}
              alt="KOP Surat"
              {...(settings.kopUrl.startsWith('http') ? { crossOrigin: 'anonymous' as const } : {})}
              className="max-h-24 mx-auto mb-2 object-contain"
            />
          ) : (
            <div className="flex items-center justify-between gap-4">
              {settings.foundationLogoUrl ? (
                <>
                  <img
                    src={settings.foundationLogoUrl}
                    alt="Logo Yayasan"
                    {...(settings.foundationLogoUrl.startsWith('http') ? { crossOrigin: 'anonymous' as const } : {})}
                    className="w-16 h-16 object-contain shrink-0"
                  />
                  <div className="flex-1 text-center">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{settings.foundation}</h4>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{settings.schoolName}</h1>
                    <p className="text-xs text-slate-600">{settings.address}{settings.accreditation ? ` (${settings.accreditation})` : ''}</p>
                  </div>
                  <SchoolLogo logoUrl={settings.logoUrl} size="lg" className="shrink-0" />
                </>
              ) : (
                <>
                  <SchoolLogo logoUrl={settings.logoUrl} size="lg" className="shrink-0" />
                  <div className="flex-1 text-center">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{settings.foundation}</h4>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{settings.schoolName}</h1>
                    <p className="text-xs text-slate-600">{settings.address}{settings.accreditation ? ` (${settings.accreditation})` : ''}</p>
                  </div>
                  <div className="w-16 h-16 opacity-0 shrink-0" />
                </>
              )}
            </div>
          )}
        </div>

        {/* LAPORAN PERKEMBANGAN HASIL BELAJAR */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black uppercase tracking-wider underline">
            LAPORAN PERKEMBANGAN HASIL BELAJAR {(settings.studentTerm || 'MURID').toUpperCase()}
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Bidang Studi Al-Qur'an (Tahsin & Tahfizh)
          </p>
        </div>

        {/* Student Info Metadata Block */}
        <div className="grid grid-cols-2 gap-4 text-xs border border-slate-900 p-4 rounded-lg bg-slate-50 font-medium">
          <div className="space-y-1">
            <p>Nama Lengkap {settings.studentTerm || 'Murid'}: <strong className="text-sm font-bold">{selectedSantri.fullName}</strong></p>
            <p>Nomor Induk {settings.studentTerm || 'Murid'} (NIS): <strong>{selectedSantri.nis}</strong></p>
            <p>Jenis Kelamin: <strong>{selectedSantri.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</strong></p>
          </div>
          <div className="space-y-1 text-right sm:text-left">
            <p>Kelas / Halaqoh: <strong>{selectedHalaqoh?.name} ({selectedHalaqoh?.level})</strong></p>
            <p>Tahun Ajaran: <strong>{settings.academicYear}</strong></p>
            <p>Tanggal Diterbitkan: <strong>{formatIndonesianFullDate(todayStr)}</strong></p>
          </div>
        </div>

        {/* Section A: Akumulasi Kehadiran */}
        <div className="space-y-2 avoid-break">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <span>A. REKAPITULASI PRESENSI KEHADIRAN</span>
          </h3>
          <table className="w-full border-collapse border border-slate-900 text-xs text-center">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-900">
                <th className="border border-slate-900 px-3 py-2">Hadir (H)</th>
                <th className="border border-slate-900 px-3 py-2">Izin (I)</th>
                <th className="border border-slate-900 px-3 py-2">Sakit (S)</th>
                <th className="border border-slate-900 px-3 py-2">Alpha (A)</th>
                <th className="border border-slate-900 px-3 py-2">Telat (T)</th>
                <th className="border border-slate-900 px-3 py-2">Persentase Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-900 px-3 py-2 font-bold">{hadirCount} Hari</td>
                <td className="border border-slate-900 px-3 py-2">{izinCount} Hari</td>
                <td className="border border-slate-900 px-3 py-2">{sakitCount} Hari</td>
                <td className="border border-slate-900 px-3 py-2">{alphaCount} Hari</td>
                <td className="border border-slate-900 px-3 py-2">{telatCount} Hari</td>
                <td className="border border-slate-900 px-3 py-2 font-bold text-emerald-800">{attPercentage}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section B: Kartu Prestasi (Tahsin, Ziyadah, Murojaah) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            B. REKAPITULASI CAPAIAN KARTU PRESTASI QUR'AN
          </h3>
          <table className="w-full border-collapse border border-slate-900 text-xs">
            <thead>
              <tr className="bg-slate-100 font-bold text-center border-b border-slate-900">
                <th className="border border-slate-900 px-3 py-2 w-10">No</th>
                <th className="border border-slate-900 px-3 py-2 w-44">Tanggal</th>
                <th className="border border-slate-900 px-3 py-2 w-28">Kegiatan</th>
                <th className="border border-slate-900 px-3 py-2 text-left">Materi / Surah / Ayat</th>
                <th className="border border-slate-900 px-3 py-2 w-36">Nilai / Kualitas</th>
              </tr>
            </thead>
            <tbody>
              {prestasiSummaryRows.map((row, idx) => (
                <tr key={row.key} className="text-center">
                  <td className="border border-slate-900 px-2 py-2 font-mono">{idx + 1}</td>
                  <td className="border border-slate-900 px-2 py-2 font-mono text-[11px] whitespace-nowrap">
                    {row.periode}
                  </td>
                  <td className="border border-slate-900 px-2 py-2 font-bold uppercase">
                    {row.label}
                  </td>
                  <td className="border border-slate-900 px-3 py-2 text-left font-medium">
                    {row.materiRange}
                  </td>
                  <td className="border border-slate-900 px-2 py-2 font-bold uppercase text-center">
                    {row.avgQuality}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section C: Nilai Ujian (PTS / PAS) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            C. REKAPITULASI NILAI UJIAN & EVALUASI
          </h3>
          <table className="w-full border-collapse border border-slate-900 text-xs">
            <thead>
              <tr className="bg-slate-100 font-bold text-center border-b border-slate-900">
                <th className="border border-slate-900 px-3 py-2 w-10">No</th>
                <th className="border border-slate-900 px-3 py-2 text-left">Materi / Bidang Studi</th>
                <th className="border border-slate-900 px-3 py-2 text-left">Metode / Kitab</th>
                <th className="border border-slate-900 px-3 py-2 w-28">Jenis Evaluasi</th>
                <th className="border border-slate-900 px-3 py-2 w-20">Nilai Angka</th>
              </tr>
            </thead>
            <tbody>
              {santriGrades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-slate-500 italic border border-slate-900">
                    Belum ada data nilai ujian terdata.
                  </td>
                </tr>
              ) : (
                santriGrades.map((g, idx) => (
                  <tr key={g.id} className="text-center">
                    <td className="border border-slate-900 px-2 py-1.5 font-mono">{idx + 1}</td>
                    <td className="border border-slate-900 px-3 py-1.5 text-left font-bold">{g.subjectArea}</td>
                    <td className="border border-slate-900 px-3 py-1.5 text-left">{g.methodKitab}</td>
                    <td className="border border-slate-900 px-2 py-1.5">{g.assessmentType}</td>
                    <td className="border border-slate-900 px-2 py-1.5 font-bold text-sm">{g.score}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures Section */}
        <div className="pt-8 flex items-[flex-end] justify-between text-xs text-slate-900 px-4 avoid-break signature-section">
          <div className="flex flex-col justify-between text-center min-h-[100px] max-w-[240px] leading-tight">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold break-words">{settings.headmasterTitle || 'Kepala Sekolah'}</p>
            </div>
            <div className="mt-8">
              <p className="font-bold underline uppercase break-words">{settings.headmasterName || 'Dr. H. Muhammad Ridwan, M.A.'}</p>
              <p className="font-mono text-[11px]">NIP: {settings.headmasterNip || '-'}</p>
            </div>
          </div>

          <div className="flex flex-col justify-between text-center min-h-[100px] max-w-[240px] leading-tight">
            <div>
              <p>{settings.city || 'Bandung'}, {formatIndonesianFullDate(todayStr)}</p>
              <p className="font-bold break-words">{activeUser.title || "Guru Qur'an / Pengajar Halaqoh"}</p>
            </div>
            <div className="mt-8">
              <p className="font-bold underline uppercase break-words">{activeUser.name}</p>
              <p className="font-mono text-[11px]">NIP: {activeUser.nip || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Rapor Perkembangan {term}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mencetak Rapor Transkrip Resmi Hasil Perkembangan Al-Qur'an & Kehadiran {term}
          </p>
        </div>
      </div>

      {/* Control Configuration Grid */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
        {/* 1. Pilih halaqoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Pilih Kelas / Halaqoh:
          </label>
          <select
            id="rapor-halaqoh"
            value={selectedHalaqohId}
            onChange={(e) => {
              setSelectedHalaqohId(e.target.value);
              setSelectedSantriId('');
            }}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            {halaqohs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Pilih nama peserta */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Pilih Nama {term}:
          </label>
          <select
            id="rapor-santri"
            value={selectedSantriId}
            onChange={(e) => setSelectedSantriId(e.target.value)}
            disabled={!selectedHalaqohId}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          >
            <option value="">-- Pilih {term} --</option>
            {availableSantris.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.nis})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Dari Tanggal */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Dari Tanggal (Opsional):
          </label>
          <input
            id="rapor-from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* 4. Sampai Tanggal */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Sampai Tanggal (Opsional):
          </label>
          <input
            id="rapor-to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Action Toolbar & Document Display when Santri is Selected */}
      {selectedSantriId && selectedSantri ? (
        <div className="space-y-6">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Rapor Terbitan {term}: <strong>{selectedSantri.fullName}</strong></span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {/* Kirim ke WA Ortu */}
              <button
                id="btn-rapor-wa-ortu"
                onClick={handleSendWA}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim ke WA Ortu</span>
              </button>

              {/* Download PDF */}
              <button
                id="btn-download-pdf-rapor"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 custom-theme-btn disabled:opacity-50 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Download PDF'}</span>
              </button>

              {/* Export Word */}
              <button
                id="btn-export-word-rapor"
                onClick={handleExportWord}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                title="Export dokumen ke Word (.docx) untuk pengeditan manual"
              >
                <FileType className="w-4 h-4" />
                <span>Export Word (.docx)</span>
              </button>

              {/* Export Excel */}
              <button
                id="btn-export-excel-rapor"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                title="Export tabel data ke Excel (.xlsx) untuk pengeditan manual"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel (.xlsx)</span>
              </button>

              {/* Buka Preview PDF */}
              <button
                id="btn-preview-pdf-rapor"
                onClick={() => setIsPreviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Buka Preview PDF</span>
              </button>

              {/* Cetak PDF / Window Print */}
              <button
                id="btn-print-rapor"
                onClick={handleTriggerPrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Save</span>
              </button>
            </div>
          </div>

          {/* Document Printable View */}
          <div className="overflow-x-auto flex justify-center py-2">
            <div className={`w-full ${docDim.widthClass} bg-white rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1 mx-auto transition-all duration-300`}>
              {renderRaporDocumentContent()}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold">Silakan pilih Nama {term} di atas terlebih dahulu untuk mencetak Rapor {term}.</p>
        </div>
      )}

      {/* Modal Preview PDF Rapor Santri (Interactive Preview with Scale & Actions) */}
      {isPreviewModalOpen && selectedSantri && selectedHalaqoh && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md overflow-hidden flex flex-col no-print animate-in fade-in duration-200">
          {/* Top Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Pratinjau Asli Rapor {term} PDF</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md uppercase font-mono">
                    {docDim.label}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {term}: {selectedSantri.fullName} ({selectedSantri.nis}) | Kelas: {selectedHalaqoh.name}
                </p>
              </div>
            </div>

            {/* Zoom / Scale Controls */}
            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setPreviewScale((prev) => Math.max(0.4, prev - 0.1))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Perkecil Scale"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center text-emerald-400">
                {Math.round(previewScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPreviewScale((prev) => Math.min(1.5, prev + 0.1))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Perbesar Scale"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewScale(1)}
                className="px-2 py-1 text-[11px] bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md font-bold transition-colors cursor-pointer"
                title="Reset Scale 100%"
              >
                <Maximize2 className="w-3.5 h-3.5 inline mr-1" />
                100%
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-3.5 py-2 custom-theme-btn disabled:opacity-50 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{isGeneratingPdf ? 'Memproses...' : 'Download PDF'}</span>
              </button>
              <button
                onClick={handleExportWord}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Export ke Word (.docx)"
              >
                <FileType className="w-4 h-4" />
                <span>Export Word</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Export ke Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={handleTriggerPrint}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak PDF</span>
              </button>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Full Screen Scrollable Canvas Body */}
          <div className="flex-1 overflow-auto p-4 sm:p-10 bg-slate-950 flex justify-center items-start">
            <div
              className="transition-transform duration-200 origin-top shadow-2xl rounded-xs"
              style={{ transform: `scale(${previewScale})` }}
            >
              <div className={`${docDim.modalWidthClass} ${docDim.modalMinHeightClass} bg-white text-slate-900 shadow-2xl border-0 border-none transition-all duration-300`} style={{ border: 'none', boxShadow: 'none' }}>
                {renderRaporDocumentContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
