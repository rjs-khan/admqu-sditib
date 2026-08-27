import React, { useState, useEffect } from 'react';
import {
  Halaqoh,
  Santri,
  AttendanceRecord,
  PrestasiRecord,
  GradeRecord,
  JournalRecord,
  SchoolSettings,
  User,
  PaperSize,
  PaperOrientation,
} from '../types';
import { SchoolLogo } from '../components/SchoolLogo';
import {
  Printer,
  FileText,
  Send,
  Download,
  Eye,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Link as LinkIcon,
  FileSpreadsheet,
  FileType,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface RekapCetakViewProps {
  halaqohs: Halaqoh[];
  santris: Santri[];
  attendanceRecords: AttendanceRecord[];
  prestasiRecords: PrestasiRecord[];
  grades: GradeRecord[];
  journals?: JournalRecord[];
  settings: SchoolSettings;
  activeUser: User;
  onSaveSettings?: (newSettings: SchoolSettings) => void;
}

// Helpers for Indonesian Date Formatting
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

const formatIndonesianShortDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agust', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const monthIdx = parseInt(m, 10) - 1;
  const day = parseInt(d, 10);
  return `${day} ${shortMonths[monthIdx] || m} ${y}`;
};

export const RekapCetakView: React.FC<RekapCetakViewProps> = ({
  halaqohs,
  santris,
  attendanceRecords,
  prestasiRecords,
  grades,
  journals = [],
  settings,
  activeUser,
  onSaveSettings,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Paper settings derived directly from school settings
  const paperSize: PaperSize = settings.paperSize || 'A4';
  const paperOrientation: PaperOrientation = settings.paperOrientation || 'landscape';

  // Helper for container dimensions matching paper size & orientation
  const getDocumentDimensions = () => {
    const isLandscape = paperOrientation === 'landscape';
    const isF4 = paperSize === 'F4';

    if (isLandscape) {
      return {
        widthClass: isF4 ? 'max-w-[330mm]' : 'max-w-[297mm]',
        modalWidthClass: isF4 ? 'w-[330mm]' : 'w-[297mm]',
        modalMinHeightClass: isF4 ? 'min-h-[215mm]' : 'min-h-[210mm]',
        label: isF4 ? 'F4 Landscape (330 x 215 mm)' : 'A4 Landscape (297 x 210 mm)',
      };
    } else {
      return {
        widthClass: isF4 ? 'max-w-[215mm]' : 'max-w-[210mm]',
        modalWidthClass: isF4 ? 'w-[215mm]' : 'w-[210mm]',
        modalMinHeightClass: isF4 ? 'min-h-[330mm]' : 'min-h-[297mm]',
        label: isF4 ? 'F4 Portrait (215 x 330 mm)' : 'A4 Portrait (210 x 297 mm)',
      };
    }
  };

  const docDim = getDocumentDimensions();

  // 8.1 Dropdown kelas
  const [selectedHalaqohId, setSelectedHalaqohId] = useState<string>(halaqohs[0]?.id || '');

  // 8.2 Dropdown jenis data
  const [dataType, setDataType] = useState<string>('Semua');

  // 8.3 Pilihan dari tanggal
  const [fromDate, setFromDate] = useState<string>('2025-01-01');

  // 8.4 Pilihan sampai tanggal
  const [toDate, setToDate] = useState<string>(todayStr);

  // 8.5 Toggle state for showing rekap (default to false, shown only when user clicks Tampilkan Rekap)
  const [isRendered, setIsRendered] = useState<boolean>(false);

  // PDF Preview & Download State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // WhatsApp Notification Modal State
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waMessageText, setWaMessageText] = useState('');
  const [waGroupLinkInput, setWaGroupLinkInput] = useState('');
  const [parentTermInput, setParentTermInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const selectedHalaqoh = (halaqohs || []).find((h) => h.id === selectedHalaqohId);
  const classSantris = (santris || []).filter((s) => s.halaqohId === selectedHalaqohId);

  // Derive default salutation for parents based on settings
  const getDefaultParentSalutation = () => {
    const parentSal = (settings?.parentSalutationTerm || '').trim() || 'Bapak/Ibu';
    const term = (settings?.studentTerm || '').trim() || 'Murid';
    return `${parentSal} Wali ${term} yang kami hormati,`;
  };

  const getReportNameForWa = () => {
    if (dataType === 'Semua') return "Laporan Rekapitulasi Qur'an & Presensi";
    if (dataType === 'Presensi') return "Laporan Kehadiran / Presensi";
    if (dataType === 'Kartu Prestasi') return "Laporan Hasil Capaian Qur'an";
    if (dataType === 'Nilai Ujian') return "Laporan Nilai Ujian & Assesmen";
    if (dataType === 'Jurnal Mengajar') return "Laporan Jurnal Mengajar";
    return `Laporan ${dataType}`;
  };

  const generateWaMessage = (salutation: string, groupLink: string) => {
    const rName = getReportNameForWa();
    const hName = selectedHalaqoh?.name || 'Halaqoh';
    const startD = formatIndonesianShortDate(fromDate);
    const endD = formatIndonesianShortDate(toDate);
    const sName = settings.schoolName || 'Nama Sekolah';

    let msg = `Assalamu'alaikum warahmatullahi wabarakatuh.\n${salutation}\nBerikut kami sampaikan "${rName}" halaqoh "${hName}" periode ${startD} s/d ${endD}. (Terlampir)`;

    if ((groupLink || '').trim()) {
      msg += `\n\nLink Grup WhatsApp Halaqoh:\n${(groupLink || '').trim()}`;
    }

    msg += `\n\nBarakallahu fiikum.\n${sName}`;
    return msg;
  };

  const handleOpenWaModal = () => {
    if (!selectedHalaqoh) return;
    const initialGroupLink = selectedHalaqoh.waGroupLink || '';
    const initialParentSalutation = getDefaultParentSalutation();
    setWaGroupLinkInput(initialGroupLink);
    setParentTermInput(initialParentSalutation);

    const initialText = generateWaMessage(initialParentSalutation, initialGroupLink);
    setWaMessageText(initialText);
    setIsWaModalOpen(true);
  };

  const handleUpdateWaFields = (newSalutation: string, newGroupLink: string) => {
    setParentTermInput(newSalutation);
    setWaGroupLinkInput(newGroupLink);
    setWaMessageText(generateWaMessage(newSalutation, newGroupLink));
  };

  const handleCopyWaText = () => {
    navigator.clipboard.writeText(waMessageText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendWaDirect = () => {
    const encoded = encodeURIComponent(waMessageText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Direct PDF Download Handler using html2pdf.js
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

  const handleDownloadPdf = async () => {
    if (!selectedHalaqoh) {
      alert('Silakan pilih kelas / halaqoh terlebih dahulu.');
      return;
    }

    if (!isRendered) {
      setIsRendered(true);
      await new Promise((r) => setTimeout(r, 200));
    }

    const element = document.getElementById('rekap-printable-document');
    if (!element) {
      alert('Gagal memuat dokumen rekapitulasi. Silakan klik "Tampilkan Rekap Laporan" terlebih dahulu.');
      return;
    }
    setIsGeneratingPdf(true);

    try {
      await convertImagesToDataUrls(element);

      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

      const halaqohName = selectedHalaqoh?.name ? selectedHalaqoh.name.replace(/\s+/g, '_') : 'Halaqoh';
      const typeStr = dataType.replace(/\s+/g, '_');
      const fileName = `Rekap_${halaqohName}_${typeStr}_${fromDate}_sd_${toDate}.pdf`;

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
            // 1. Clean up all <style> elements in clonedDoc by replacing oklch/oklab
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

            // 2. Inject explicit PDF style overrides for zero outer border, exact padding, and clean page breaks
            const pdfCssTag = clonedDoc.createElement('style');
            pdfCssTag.textContent = `
              #rekap-printable-document, #rapor-printable-document, .printable-document {
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

            // 3. Remove outer border & shadow & set fixed width and padding on target element
            const targetEl = clonedDoc.getElementById('rekap-printable-document') || clonedDoc.querySelector('.printable-document');
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

            // 4. Set inline pageBreakInside = avoid on table rows and blocks
            const allTrs = clonedDoc.querySelectorAll('tr, thead, .avoid-break, .keep-together, .signature-section, .kop-surat');
            allTrs.forEach((tr) => {
              const htmlEl = tr as HTMLElement;
              htmlEl.style.pageBreakInside = 'avoid';
              (htmlEl.style as any).breakInside = 'avoid';
            });

            // 5. Clean inline styles and sanitize computed colors directly on cloned elements
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

  // Export to Word (.doc / .docx) Handler with full layout & Kop surat
  const handleExportWord = () => {
    const element = document.getElementById('rekap-printable-document');
    if (!element) {
      alert('Silakan klik "Tampilkan Rekap Laporan" terlebih dahulu.');
      return;
    }

    const halaqohName = selectedHalaqoh?.name ? selectedHalaqoh.name.replace(/\s+/g, '_') : 'Halaqoh';
    const typeStr = dataType.replace(/\s+/g, '_');
    const fileName = `Rekap_${halaqohName}_${typeStr}_${fromDate}_sd_${toDate}.doc`;

    const isLandscape = paperOrientation === 'landscape';
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove no-print elements from export
    const noPrintElements = clone.querySelectorAll('.no-print');
    noPrintElements.forEach((el) => el.remove());

    const wordHtml = `
      <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${getReportTitle()}</title>
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
    const element = document.getElementById('rekap-printable-document');
    if (!element) {
      alert('Silakan klik "Tampilkan Rekap Laporan" terlebih dahulu.');
      return;
    }

    const halaqohName = selectedHalaqoh?.name ? selectedHalaqoh.name.replace(/\s+/g, '_') : 'Halaqoh';
    const typeStr = dataType.replace(/\s+/g, '_');
    const fileName = `Rekap_${halaqohName}_${typeStr}_${fromDate}_sd_${toDate}.xlsx`;

    const clone = element.cloneNode(true) as HTMLElement;

    // Remove no-print elements from export
    const noPrintElements = clone.querySelectorAll('.no-print');
    noPrintElements.forEach((el) => el.remove());

    const tables = clone.querySelectorAll('table');
    const wb = XLSX.utils.book_new();

    if (tables.length > 0) {
      tables.forEach((tbl, idx) => {
        const ws = XLSX.utils.table_to_sheet(tbl, { raw: true });
        XLSX.utils.book_append_sheet(wb, ws, tables.length === 1 ? 'Rekap Data' : `Tabel ${idx + 1}`);
      });
    } else {
      const ws = XLSX.utils.table_to_sheet(clone, { raw: true });
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Data');
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  };

  // Trigger browser print/save as PDF dialog
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

  // Determine report title based on selected data type
  const term = (settings?.studentTerm || '').trim() || 'Murid';
  const termUpper = term.toUpperCase();
  const termLower = term.toLowerCase();

  const getReportTitle = () => {
    if (dataType === 'Presensi') return `REKAPITULASI LAPORAN KEHADIRAN / PRESENSI ${termUpper}`;
    if (dataType === 'Kartu Prestasi') return `REKAPITULASI HASIL CAPAIAN QUR'AN ${termUpper}`;
    if (dataType === 'Nilai Ujian') return `REKAPITULASI NILAI UJIAN & ASSESMEN ${termUpper}`;
    if (dataType === 'Jurnal Mengajar') return `REKAPITULASI JURNAL MENGAJAR PENGAJAR`;
    return `REKAPITULASI LAPORAN QUR'AN & PRESENSI ${termUpper}`;
  };

  // Helper function to render document body tables
  const renderDocumentTables = () => {
    // 1. Kartu Prestasi / Capaian Qur'an Table
    const showPrestasiTable = dataType === 'Semua' || dataType === 'Kartu Prestasi';
    // 2. Presensi Table
    const showPresensiTable = dataType === 'Semua' || dataType === 'Presensi';
    // 3. Nilai Ujian Table
    const showNilaiTable = dataType === 'Semua' || dataType === 'Nilai Ujian';
    // 4. Jurnal Mengajar Table
    const showJurnalTable = dataType === 'Semua' || dataType === 'Jurnal Mengajar';

    return (
      <div className="space-y-8">
        {/* TABEL REKAPITULASI HASIL CAPAIAN QUR'AN */}
        {showPrestasiTable && (
          <div className="space-y-2">
            {dataType === 'Semua' && (
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 border-b border-slate-300 pb-1">
                I. Rekapitulasi Capaian Setoran Qur'an (Tahsin, Ziyadah, Muroja'ah)
              </h3>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-900 text-xs text-slate-900">
                <thead>
                  <tr className="bg-slate-100 font-bold uppercase text-center border-b border-slate-900">
                    <th className="border border-slate-900 px-2 py-2 w-10">NO</th>
                    <th className="border border-slate-900 px-3 py-2 w-28 text-center">TANGGAL</th>
                    <th className="border border-slate-900 px-3 py-2 text-left">NAMA</th>
                    <th className="border border-slate-900 px-3 py-2 text-left">TAHSIN</th>
                    <th className="border border-slate-900 px-3 py-2 text-left">ZIYADAH</th>
                    <th className="border border-slate-900 px-3 py-2 text-left">MUROJA'AH</th>
                    <th className="border border-slate-900 px-3 py-2 text-left">CATATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {classSantris.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500 italic border border-slate-900">
                        Tidak ada data {termLower} pada kelas ini.
                      </td>
                    </tr>
                  ) : (
                    classSantris.map((s, idx) => {
                      // Filter prestasi records for this santri within date range
                      const sPrestasi = (prestasiRecords || []).filter(
                        (r) => r.santriId === s.id && r.date >= fromDate && r.date <= toDate
                      );

                      const latestTahsin = sPrestasi.filter((r) => r.type === 'tahsin').pop();
                      const latestZiyadah = sPrestasi.filter((r) => r.type === 'ziyadah').pop();
                      const latestMurojaah = sPrestasi.filter((r) => r.type === 'murojaah').pop();

                      // Latest date of any setoran
                      const latestDate =
                        latestZiyadah?.date || latestTahsin?.date || latestMurojaah?.date || '-';

                      // Combine notes
                      const notesList = [
                        latestTahsin?.notes,
                        latestZiyadah?.notes,
                        latestMurojaah?.notes,
                      ]
                        .filter(Boolean)
                        .join('; ');

                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="border border-slate-900 px-2 py-2 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-900 px-2 py-2 text-center font-mono text-[11px] whitespace-nowrap">
                            {latestDate}
                          </td>
                          <td className="border border-slate-900 px-3 py-2 text-left font-bold">
                            {s.fullName}
                          </td>
                          <td className="border border-slate-900 px-3 py-2 text-left">
                            {latestTahsin
                              ? `${latestTahsin.tahsinMaterial || '-'} (${latestTahsin.tahsinPageAyat || '-'}) [Nilai: ${latestTahsin.tahsinGrade || '-'}]`
                              : '-'}
                          </td>
                          <td className="border border-slate-900 px-3 py-2 text-left">
                            {latestZiyadah
                              ? `Juz ${latestZiyadah.ziyadahJuz} - ${latestZiyadah.ziyadahSurah} (${latestZiyadah.ziyadahAyat || 'Semua'}) [Nilai: ${latestZiyadah.ziyadahQuality || '-'}]`
                              : '-'}
                          </td>
                          <td className="border border-slate-900 px-3 py-2 text-left">
                            {latestMurojaah
                              ? `${latestMurojaah.murojaahMaterial || '-'}${latestMurojaah.murojaahAyat ? ` (${latestMurojaah.murojaahAyat.toLowerCase().startsWith('ayat') || latestMurojaah.murojaahAyat.toLowerCase().startsWith('hal') ? latestMurojaah.murojaahAyat : `Ayat ${latestMurojaah.murojaahAyat}`})` : ''} [Kualitas: ${latestMurojaah.murojaahQuality || '-'}]`
                              : '-'}
                          </td>
                          <td className="border border-slate-900 px-3 py-2 text-left text-[11px] text-slate-700">
                            {notesList || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABEL LAPORAN KEHADIRAN / PRESENSI */}
        {showPresensiTable && (
          <div className="space-y-2">
            {dataType === 'Semua' && (
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 border-b border-slate-300 pb-1">
                II. Rekapitulasi Kehadiran / Presensi {term}
              </h3>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-900 text-xs text-slate-900">
                <thead>
                  <tr className="bg-slate-100 font-bold uppercase text-center border-b border-slate-900">
                    <th className="border border-slate-900 px-2 py-2 w-10">NO</th>
                    <th className="border border-slate-900 px-3 py-2 text-left">NAMA</th>
                    <th className="border border-slate-900 px-3 py-2 w-16 text-center">HADIR</th>
                    <th className="border border-slate-900 px-3 py-2 w-16 text-center">IZIN</th>
                    <th className="border border-slate-900 px-3 py-2 w-16 text-center">SAKIT</th>
                    <th className="border border-slate-900 px-3 py-2 w-16 text-center">ALPHA</th>
                    <th className="border border-slate-900 px-3 py-2 w-16 text-center">TELAT</th>
                    <th className="border border-slate-900 px-3 py-2 w-32 text-center">PERSENTASE KEHADIRAN</th>
                  </tr>
                </thead>
                <tbody>
                  {classSantris.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-500 italic border border-slate-900">
                        Tidak ada data {termLower} pada kelas ini.
                      </td>
                    </tr>
                  ) : (
                    classSantris.map((s, idx) => {
                      const sAtt = (attendanceRecords || []).filter((a) => {
                        if (String(a.santriId).trim() !== String(s.id).trim()) return false;
                        const recDate = (a.date || '').split('T')[0];
                        if (fromDate && recDate < fromDate) return false;
                        if (toDate && recDate > toDate) return false;
                        return true;
                      });

                      const isH = (st?: string) => st === 'H' || st?.toLowerCase() === 'hadir';
                      const isI = (st?: string) => st === 'I' || st?.toLowerCase() === 'izin';
                      const isS = (st?: string) => st === 'S' || st?.toLowerCase() === 'sakit';
                      const isA = (st?: string) => st === 'A' || st?.toLowerCase() === 'alpha' || st?.toLowerCase() === 'alpa';
                      const isT = (st?: string) => st === 'T' || st?.toLowerCase() === 'telat' || st?.toLowerCase() === 'terlambat';

                      const hadir = sAtt.filter((a) => isH(a.status)).length;
                      const izin = sAtt.filter((a) => isI(a.status)).length;
                      const sakit = sAtt.filter((a) => isS(a.status)).length;
                      const alpha = sAtt.filter((a) => isA(a.status)).length;
                      const telat = sAtt.filter((a) => isT(a.status)).length;

                      // Jumlah kehadiran = jumlah hadir + telat
                      const jumlahKehadiran = hadir + telat;
                      const totalPertemuan = hadir + izin + sakit + alpha + telat;

                      const persentase =
                        totalPertemuan > 0 ? Math.round((jumlahKehadiran / totalPertemuan) * 100) : 0;

                      return (
                        <tr key={s.id} className="text-center hover:bg-slate-50">
                          <td className="border border-slate-900 px-2 py-2 font-mono">{idx + 1}</td>
                          <td className="border border-slate-900 px-3 py-2 text-left font-bold">{s.fullName}</td>
                          <td className="border border-slate-900 px-2 py-2 font-mono font-bold text-emerald-800">
                            {hadir}
                          </td>
                          <td className="border border-slate-900 px-2 py-2 font-mono text-blue-800">{izin}</td>
                          <td className="border border-slate-900 px-2 py-2 font-mono text-amber-800">{sakit}</td>
                          <td className="border border-slate-900 px-2 py-2 font-mono text-rose-800">{alpha}</td>
                          <td className="border border-slate-900 px-2 py-2 font-mono text-amber-700 font-bold">
                            {telat}
                          </td>
                          <td className="border border-slate-900 px-2 py-2 font-mono font-bold bg-slate-50">
                            {persentase}% ({jumlahKehadiran}/{totalPertemuan || 0})
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-500 italic pt-0.5">
              *Catatan: Jumlah Kehadiran dihitung dari Hadir + Telat. Persentase = ((Hadir + Telat) / Total Pertemuan) x 100%.
            </p>
          </div>
        )}

        {/* TABEL NILAI UJIAN */}
        {showNilaiTable && (
          <div className="space-y-2">
            {dataType === 'Semua' && (
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 border-b border-slate-300 pb-1">
                III. Rekapitulasi Nilai Ujian & Assesmen
              </h3>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-900 text-xs text-slate-900">
                <thead>
                  <tr className="bg-slate-100 font-bold uppercase text-center border-b border-slate-900">
                    <th className="border border-slate-900 px-2 py-2 w-10">NO</th>
                    <th className="border border-slate-900 px-3 py-2 text-left">NAMA {termUpper}</th>
                    <th className="border border-slate-900 px-2 py-2 w-20 font-mono">NIS</th>
                    <th className="border border-slate-900 px-3 py-2">JENIS ASSESMEN</th>
                    <th className="border border-slate-900 px-3 py-2">NILAI AKHIR</th>
                    <th className="border border-slate-900 px-3 py-2">PREDIKAT / HASIL</th>
                  </tr>
                </thead>
                <tbody>
                  {classSantris.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-500 italic border border-slate-900">
                        Tidak ada data {termLower} pada kelas ini.
                      </td>
                    </tr>
                  ) : (
                    classSantris.map((s, idx) => {
                      const sGrade = (grades || []).find((g) => g.santriId === s.id);
                      return (
                        <tr key={s.id} className="text-center hover:bg-slate-50">
                          <td className="border border-slate-900 px-2 py-2 font-mono">{idx + 1}</td>
                          <td className="border border-slate-900 px-3 py-2 text-left font-bold">{s.fullName}</td>
                          <td className="border border-slate-900 px-2 py-2 font-mono">{s.nis}</td>
                          <td className="border border-slate-900 px-3 py-2">
                            {sGrade ? sGrade.assessmentType : '-'}
                          </td>
                          <td className="border border-slate-900 px-2 py-2 font-bold font-mono text-base">
                            {sGrade ? sGrade.score : '-'}
                          </td>
                          <td className="border border-slate-900 px-3 py-2 font-bold uppercase">
                            {sGrade ? sGrade.letterGrade || 'LULUS' : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABEL JURNAL MENGAJAR */}
        {showJurnalTable && (
          <div className="space-y-2">
            {dataType === 'Semua' && (
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 border-b border-slate-300 pb-1">
                IV. Rekapitulasi Jurnal Mengajar Pengajar
              </h3>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-900 text-xs text-slate-900">
                <thead>
                  <tr className="bg-slate-100 font-bold uppercase text-center border-b border-slate-900">
                    <th className="border border-slate-900 px-2 py-2 w-10">NO</th>
                    <th className="border border-slate-900 px-3 py-2 w-28 text-center">TANGGAL</th>
                    <th className="border border-slate-900 px-3 py-2 text-left">MATERI / KEGIATAN MENGAJAR</th>
                    <th className="border border-slate-900 px-3 py-2 text-left">CATATAN & EVALUASI</th>
                    <th className="border border-slate-900 px-3 py-2 text-left w-40">PENGAJAR / GURU</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const classJournals = (journals || []).filter(
                      (j) => j.halaqohId === selectedHalaqohId && j.date >= fromDate && j.date <= toDate
                    );
                    if (classJournals.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-slate-500 italic border border-slate-900">
                            Tidak ada catatan jurnal mengajar pada periode dan kelas ini.
                          </td>
                        </tr>
                      );
                    }
                    return classJournals.map((j, idx) => (
                      <tr key={j.id} className="hover:bg-slate-50">
                        <td className="border border-slate-900 px-2 py-2 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-900 px-2 py-2 text-center font-mono text-[11px] whitespace-nowrap">
                          {j.date}
                        </td>
                        <td className="border border-slate-900 px-3 py-2 text-left font-semibold">{j.material}</td>
                        <td className="border border-slate-900 px-3 py-2 text-left text-[11px]">{j.notesAndEvaluation || '-'}</td>
                        <td className="border border-slate-900 px-3 py-2 text-left font-bold">{j.teacherName || activeUser.name}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPrintableContent = () => {
    if (!selectedHalaqoh) return null;

    const isF4 = paperSize === 'F4';
    const isLandscape = paperOrientation === 'landscape';

    const docWidthMm = isLandscape ? (isF4 ? 330 : 297) : (isF4 ? 215 : 210);
    const docMinHeightMm = isLandscape ? (isF4 ? 215 : 210) : (isF4 ? 330 : 297);

    return (
      <div
        id="rekap-printable-document"
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
        <div className="border-b-4 border-double border-slate-900 pb-4 text-center kop-surat avoid-break">
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

        {/* Subtitle */}
        <div className="text-center space-y-1 avoid-break">
          <h2 className="text-lg font-bold uppercase tracking-wider underline">
            {getReportTitle()}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-700 pt-1">
            <span>Kelas / Halaqoh: <strong>{selectedHalaqoh.name} ({selectedHalaqoh.level})</strong></span>
            <span>•</span>
            <span>Tahun Ajaran: <strong>{settings.academicYear}</strong></span>
            <span>•</span>
            <span>Periode Tanggal: <strong>{formatIndonesianShortDate(fromDate)} s/d {formatIndonesianShortDate(toDate)}</strong></span>
          </div>
        </div>

        {/* Dynamic Tables */}
        {renderDocumentTables()}

        {/* Signatures */}
        <div className="pt-8 flex items-[flex-end] justify-between text-xs text-slate-900 px-4 avoid-break signature-section">
          <div className="flex flex-col justify-between text-center min-h-[100px] max-w-[240px] leading-tight">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold break-words">{settings.headmasterTitle || 'Kepala Sekolah'}</p>
            </div>
            <div className="mt-8">
              <p className="font-bold underline uppercase break-words">{settings.headmasterName || 'Dr. H. Muhammad Ridwan, M.A.'}</p>
              <p className="font-mono text-[11px]">NIPK: {settings.headmasterNip || '-'}</p>
            </div>
          </div>

          <div className="flex flex-col justify-between text-center min-h-[100px] max-w-[240px] leading-tight">
            <div>
              <p>{settings.city || 'Bandung'}, {formatIndonesianFullDate(todayStr)}</p>
              <p className="font-bold break-words">{activeUser.title || "Guru Qur'an / Pengajar Halaqoh"}</p>
            </div>
            <div className="mt-8">
              <p className="font-bold underline uppercase break-words">{activeUser.name}</p>
              <p className="font-mono text-[11px]">NIPK: {activeUser.nip || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dynamic Print CSS for Page Orientation */}
      <style key="rekap-print-style">
        {`
          @media print {
            @page {
              size: ${
                paperSize === 'F4'
                  ? paperOrientation === 'landscape'
                    ? '330mm 215mm'
                    : '215mm 330mm'
                  : `A4 ${paperOrientation}`
              };
              margin: 10mm;
            }
            body {
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      {/* Top Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Rekapitulasi & Cetak Transkrip</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cetak dan unduh rekapitulasi nilai, presensi, dan prestasi kelas format transkrip
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Filter Controls (8.1 - 8.5) */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 8.1 Dropdown kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pilih Kelas / Halaqoh:
            </label>
            <select
              id="rekap-halaqoh"
              value={selectedHalaqohId}
              onChange={(e) => {
                setSelectedHalaqohId(e.target.value);
                setIsRendered(false);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              {halaqohs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.level})
                </option>
              ))}
            </select>
          </div>

          {/* 8.2 Dropdown jenis data */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jenis Data Laporan:
            </label>
            <select
              id="rekap-type"
              value={dataType}
              onChange={(e) => {
                setDataType(e.target.value);
                setIsRendered(false);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Data Rekap</option>
              <option value="Presensi">Data Presensi Harian</option>
              <option value="Kartu Prestasi">Data Capaian Qur'an</option>
              <option value="Nilai Ujian">Data Nilai Ujian</option>
              <option value="Jurnal Mengajar">Jurnal Mengajar Pengajar</option>
            </select>
          </div>

          {/* 8.3 Dari tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dari Tanggal:
            </label>
            <input
              id="rekap-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setIsRendered(false);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* 8.4 Sampai tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sampai Tanggal:
            </label>
            <input
              id="rekap-to-date"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setIsRendered(false);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 8.5 Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            id="btn-tampilkan-rekap"
            onClick={() => setIsRendered(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Tampilkan Rekap Laporan</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download PDF Button */}
            <button
              id="btn-download-pdf-rekap"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Download PDF'}</span>
            </button>

            {/* Export Word Button */}
            <button
              id="btn-export-word-rekap"
              onClick={handleExportWord}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              title="Export dokumen ke Word (.docx) untuk pengeditan manual"
            >
              <FileType className="w-4 h-4" />
              <span>Export Word (.docx)</span>
            </button>

            {/* Export Excel Button */}
            <button
              id="btn-export-excel-rekap"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              title="Export tabel data ke Excel (.xlsx) untuk pengeditan manual"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>

            {/* Kirim ke WA Button */}
            <button
              id="btn-rekap-wa-group"
              onClick={handleOpenWaModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim ke WA</span>
            </button>

            {/* Buka Preview PDF Button */}
            <button
              id="btn-preview-pdf-rekap"
              onClick={() => setIsPreviewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Buka Preview PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable / Transkrip Format Document Display */}
      {isRendered && selectedHalaqoh ? (
        <div className="overflow-x-auto flex justify-center py-2">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1 mx-auto transition-all duration-300">
            {renderPrintableContent()}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
          <FileText className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
            Rekap Laporan Belum Ditampilkan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Silakan atur filter di atas, lalu klik tombol <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">"Tampilkan Rekap Laporan"</strong> untuk memuat dan mencetak dokumen rekapitulasi.
          </p>
        </div>
      )}

      {/* WHATSAPP NOTIFICATION MODAL */}
      {isWaModalOpen && selectedHalaqoh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Kirim Pemberitahuan WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Template pesan pemberitahuan untuk wali murid / grup halaqoh
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Field: Sebutan Orang Tua / Wali */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sebutan / Salam Wali Murid:
                </label>
                <input
                  type="text"
                  value={parentTermInput}
                  onChange={(e) => handleUpdateWaFields(e.target.value, waGroupLinkInput)}
                  placeholder="Bapak/Ibu wali murid yang kami hormati,"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Field: Link Grup WA Halaqoh */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Link Grup WhatsApp Halaqoh:</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {selectedHalaqoh.waGroupLink ? 'Tersimpan di data halaqoh' : 'Opsional'}
                  </span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      value={waGroupLinkInput}
                      onChange={(e) => handleUpdateWaFields(parentTermInput, e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  {(waGroupLinkInput || '').trim() && (
                    <a
                      href={waGroupLinkInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                      title="Buka Link Grup WA"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tes Link</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Editable Text Template Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Draf Teks Pesan (Dapat Diedit):
                  </label>
                  <button
                    onClick={() => {
                      const defSal = getDefaultParentSalutation();
                      handleUpdateWaFields(defSal, selectedHalaqoh.waGroupLink || '');
                    }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium"
                  >
                    Reset Template
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={waMessageText}
                  onChange={(e) => setWaMessageText(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
                />
              </div>

              {isCopied && (
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Teks pemberitahuan berhasil disalin ke clipboard!</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleCopyWaText}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>

              <div className="flex items-center gap-2">
                {(waGroupLinkInput || '').trim() && (
                  <a
                    href={waGroupLinkInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Masuk Grup WA</span>
                  </a>
                )}

                <button
                  onClick={handleSendWaDirect}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim via WA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Modal / Fast Print Modal */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span>Unduh & Cetak PDF Laporan</span>
              </h3>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Siap Mengunduh / Mencetak Dokumen PDF</span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Dokumen rekapitulasi disesuaikan secara presisi untuk kelas <strong>{selectedHalaqoh?.name}</strong>. Anda dapat memilih "Simpan sebagai PDF" di jendela cetak atau mengunduh langsung.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{isGeneratingPdf ? 'Memproses...' : 'Download Langsung PDF'}</span>
                </button>
                <button
                  onClick={handleOpenPreviewPdf}
                  className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Buka Preview Dokumen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN INTERACTIVE PREVIEW MODAL */}
      {isPreviewModalOpen && selectedHalaqoh && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col h-screen w-screen overflow-hidden no-print animate-in fade-in duration-200">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0 gap-3 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Pratinjau Asli Dokumen PDF</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md font-mono">
                    {docDim.label}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Kelas: {selectedHalaqoh.name} | Periode: {fromDate} s/d {toDate}
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
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
              <div className="bg-white text-slate-900 shadow-2xl border-0 border-none transition-all duration-300" style={{ border: 'none', boxShadow: 'none' }}>
                {renderPrintableContent()}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

