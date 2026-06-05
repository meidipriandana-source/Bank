import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Peserta, FolderDiklat, Certificate, TemplateConfig, DEFAULT_TEMPLATE_CONFIG } from '../types';
import {
  Users,
  Search,
  UserPlus,
  FileSpreadsheet,
  Download,
  CheckCircle,
  Eye,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  ClipboardList,
  FileText,
  AlertTriangle,
  Settings,
  RefreshCw,
  Printer
} from 'lucide-react';
import CertificateLayout, { isCertExpired, getValidityInfo, getEffectiveConfig } from './CertificateLayout';

export const getExpiryStatus = (expiryStr: string | undefined): {
  status: 'expired' | 'warning' | 'safe' | 'none';
  daysLeft: number;
  badgeClass: string;
  label: string;
} => {
  if (!expiryStr) {
    return {
      status: 'none',
      daysLeft: 9999,
      badgeClass: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800',
      label: 'Bebas Expired'
    };
  }
  try {
    let expiryDate: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(expiryStr)) {
      expiryDate = new Date(expiryStr);
    } else {
      const parts = expiryStr.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        expiryDate = new Date(y, m, d);
      } else {
        return {
          status: 'none',
          daysLeft: 9999,
          badgeClass: 'bg-slate-50 text-slate-500 border-slate-200',
          label: expiryStr
        };
      }
    }
    expiryDate.setHours(23, 59, 59, 999);
    const now = new Date();

    if (expiryDate < now) {
      return {
        status: 'expired',
        daysLeft: 0,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-220 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900 shadow-[0_0_8px_rgba(244,63,94,0.15)] font-bold',
        label: 'Kedaluwarsa'
      };
    }

    const diffMs = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft <= 90) {
      return {
        status: 'warning',
        daysLeft,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900 shadow-[0_0_8px_rgba(245,158,11,0.15)] font-bold animate-pulse',
        label: `Akan Habis (${daysLeft} Hari)`
      };
    }

    return {
      status: 'safe',
      daysLeft,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-220 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 font-semibold',
      label: 'Masa Aktif Aman'
    };
  } catch (err) {
    return {
      status: 'none',
      daysLeft: 9999,
      badgeClass: 'bg-slate-50 text-slate-500 border-slate-200',
      label: expiryStr
    };
  }
};

export const parseIndonesianDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  const pruned = dateStr.trim();
  if (!pruned) return null;
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(pruned)) {
      return new Date(pruned);
    }
    const parts = pruned.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m, d);
      }
    }
    const normalParsed = new Date(pruned);
    if (!isNaN(normalParsed.getTime())) {
      return normalParsed;
    }
  } catch (err) {}
  return null;
};

interface ParticipantsViewProps {
  peserta: Peserta[];
  folders: FolderDiklat[];
  onAddPeserta: (data: Omit<Peserta, 'id' | 'sertifikat'>) => void;
  onEditPeserta: (id: string, data: Omit<Peserta, 'id' | 'sertifikat'>) => void;
  onDeletePeserta: (id: string) => void;
  onGenerateCert: (id: string) => void;
  onImportPeserta: (parsedArray: any[]) => void;
  appUrl: string;
  onUpdateFolderConfig: (id: string, config: TemplateConfig) => void;
}

export default function ParticipantsView({
  peserta,
  folders,
  onAddPeserta,
  onEditPeserta,
  onDeletePeserta,
  onGenerateCert,
  onImportPeserta,
  appUrl,
  onUpdateFolderConfig,
}: ParticipantsViewProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatusCert, setFilterStatusCert] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const [activeCertPeserta, setActiveCertPeserta] = useState<Peserta | null>(null);

  const activeFolder = activeCertPeserta ? folders.find(f => f.id === activeCertPeserta.folderId) : null;
  const config = activeFolder ? getEffectiveConfig(activeFolder) : DEFAULT_TEMPLATE_CONFIG;

  const updateConfigVal = (key: keyof TemplateConfig, value: any) => {
    if (!activeFolder) return;
    const currentConfig = activeFolder.templateConfig || getEffectiveConfig(activeFolder);
    const newConfig = {
      ...currentConfig,
      [key]: value
    };
    onUpdateFolderConfig(activeFolder.id, newConfig);
  };

  const resetConfig = () => {
    if (!activeFolder) return;
    const hasUploadedTemplate = !!activeFolder.templateUrl;
    if (hasUploadedTemplate) {
      onUpdateFolderConfig(activeFolder.id, {
        showBorder: false,
        showDecorations: false,
        showHeaderEmblem: false,
        showSalutation: false,
        showPelatihanBox: false,
        showSignatureLabel: false,
        
        showSignatureBlock: false,
        showVerificationCredits: false,
        showPelatihanContainer: false,
        showPelatihanStaticText: false,
        showPelatihanName: true,
        
        fontSizeName: 28,
        colorName: '#1E88E5',
        yOffsetName: 36,

        fontSizeNumber: 12,
        colorNumber: '#0F4C81',
        yOffsetNumber: 22,

        fontSizeDetails: 13,
        colorDetails: '#374151',
        yOffsetDetails: 48,

        fontSizePelatihan: 20,
        colorPelatihan: '#0F4C81',
        yOffsetPelatihan: 58,

        sizeQrCode: 85,
        xOffsetQrCode: 50,
        yOffsetQrCode: 73,

        xOffsetSignature: 82,
        yOffsetSignature: 73,

        yOffsetExpiry: 63,
      });
    } else {
      onUpdateFolderConfig(activeFolder.id, DEFAULT_TEMPLATE_CONFIG);
    }
  };

  // Form State
  const [formId, setFormId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formFolderId, setFormFolderId] = useState('');
  const [formName, setFormName] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formInstansi, setFormInstansi] = useState('');
  const [formJabatan, setFormJabatan] = useState('');
  const [formCertNum, setFormCertNum] = useState('');
  const [formNilai, setFormNilai] = useState('85');
  const [formTanggal, setFormTanggal] = useState(new Date().toLocaleDateString('id-ID'));
  const [formTanggalExpired, setFormTanggalExpired] = useState('');
  const [formPdfData, setFormPdfData] = useState<string | undefined>(undefined);
  const [formPdfName, setFormPdfName] = useState<string | undefined>(undefined);

  // CSV Drag and Drop state
  const [csvStatusMsg, setCsvStatusMsg] = useState('');

  const calculateDefaultExpiry = (dateStr: string): string => {
    try {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10) + 5; // Default 5 years validity duration
        return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
      }
    } catch (e) {}
    return '';
  };

  const handleFilterFolder = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFolderId(e.target.value);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const openAddModalFunc = () => {
    setIsEditing(false);
    setFormId('');
    setFormFolderId(folders[0]?.id || '');
    setFormName('');
    setFormNip('');
    setFormInstansi('');
    setFormJabatan('');
    setFormCertNum('');
    setFormNilai('85');
    const todayStr = new Date().toLocaleDateString('id-ID');
    setFormTanggal(todayStr);
    setFormTanggalExpired(calculateDefaultExpiry(todayStr));
    setFormPdfData(undefined);
    setFormPdfName(undefined);
    setShowAddModal(true);
  };

  const openEditModalFunc = (p: Peserta) => {
    setIsEditing(true);
    setFormId(p.id);
    setFormFolderId(p.folderId);
    setFormName(p.name);
    setFormNip(p.nip);
    setFormInstansi(p.instansi);
    setFormJabatan(p.jabatan);
    setFormCertNum(p.noSertifikat);
    setFormNilai(p.nilai);
    setFormTanggal(p.tanggal);
    setFormTanggalExpired(p.tanggalExpired || calculateDefaultExpiry(p.tanggal));
    setFormPdfData(p.pdfData);
    setFormPdfName(p.pdfName);
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formFolderId) return;

    const data = {
      folderId: formFolderId,
      name: formName,
      nip: formNip.trim() || '-',
      instansi: formInstansi.trim() || '-',
      jabatan: formJabatan.trim() || '-',
      noSertifikat: formCertNum.trim() || `800.2/4.1- ${Math.floor(10437 + Math.random() * 500)}/RSUDdrHJSK/2026`,
      nilai: formNilai,
      tanggal: formTanggal,
      tanggalExpired: formTanggalExpired || calculateDefaultExpiry(formTanggal),
      pdfData: formPdfData,
      pdfName: formPdfName,
    };

    if (isEditing) {
      onEditPeserta(formId, data);
    } else {
      onAddPeserta(data);
    }

    setShowAddModal(false);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formFolderId) {
      setCsvStatusMsg('Silakan pilih Folder Diklat Tujuan terlebih dahulu!');
      return;
    }

    setCsvStatusMsg('Membaca berkas spreadsheet...');

    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (!jsonData || jsonData.length === 0) {
            setCsvStatusMsg('Lembar kerja kosong atau tidak valid!');
            return;
          }

          // Inject folderId so App.tsx knows where to place them
          const enriched = jsonData.map((row: any) => ({
            ...row,
            folderId: formFolderId
          }));

          onImportPeserta(enriched);
          setCsvStatusMsg(`Sukses mengimpor ${enriched.length} data peserta dari Excel!`);
          setTimeout(() => {
            setShowImportModal(false);
            setCsvStatusMsg('');
          }, 1500);
        } catch (err) {
          setCsvStatusMsg(`Gagal memuat Excel: ${(err as Error).message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // It is a CSV file
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rows = text.split('\n');
          if (rows.length < 2) {
            setCsvStatusMsg('File CSV tidak valid atau kosong!');
            return;
          }

          const headers = rows[0].replace('\r', '').split(',');
          const parsedArray: any[] = [];

          for (let i = 1; i < rows.length; i++) {
            const rowText = rows[i].trim();
            if (!rowText) continue;

            const cols = rowText.replace('\r', '').split(',');
            const obj: any = { folderId: formFolderId };

            for (let j = 0; j < headers.length; j++) {
              const headerName = headers[j].trim();
              obj[headerName] = cols[j] ? cols[j].trim() : '';
            }
            parsedArray.push(obj);
          }

          if (parsedArray.length === 0) {
            setCsvStatusMsg('Tidak ada baris data peserta terdeteksi!');
            return;
          }

          onImportPeserta(parsedArray);
          setCsvStatusMsg(`Sukses mengimpor ${parsedArray.length} data peserta!`);
          setTimeout(() => {
            setShowImportModal(false);
            setCsvStatusMsg('');
          }, 1500);
        } catch (err) {
          setCsvStatusMsg(`Terjadi kesalahan pengolahan: ${(err as Error).message}`);
        }
      };
      reader.readAsText(file);
    }
  };

  // Trigger dynamic generate
  const handleTriggerGenerate = (p: Peserta) => {
    onGenerateCert(p.id);
    const matchingFolder = folders.find((f) => f.id === p.folderId);
    if (!matchingFolder) return;

    const generatedCert: Certificate = {
      id: p.sertifikat?.id || `CRT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      pesertaId: p.id,
      linkPdf: p.sertifikat?.linkPdf || `#`,
      qrLink: p.sertifikat?.qrLink || `${p.sertifikat?.id || 'PROTOTYPE'}`,
      status: 'Aktif',
      tanggalTerbit: p.tanggal,
    };

    const simulatedPeserta: Peserta = {
      ...p,
      sertifikat: generatedCert,
    };

    setActiveCertPeserta(simulatedPeserta);
    setShowCertModal(true);
  };

  const filteredPeserta = peserta.filter((p) => {
    const matchFolder = !selectedFolderId || p.folderId === selectedFolderId;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.instansi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.noSertifikat.toLowerCase().includes(searchQuery.toLowerCase());

    const isIssued = p.sertifikat !== null;
    let matchStatus = true;
    if (filterStatusCert === 'terbit') {
      matchStatus = isIssued;
    } else if (filterStatusCert === 'belum_terbit') {
      matchStatus = !isIssued;
    }

    let matchDateRange = true;
    if (filterStartDate || filterEndDate) {
      const pDate = parseIndonesianDate(p.tanggal);
      if (pDate) {
        if (filterStartDate) {
          const start = new Date(filterStartDate);
          start.setHours(0, 0, 0, 0);
          if (pDate < start) {
            matchDateRange = false;
          }
        }
        if (filterEndDate) {
          const end = new Date(filterEndDate);
          end.setHours(23, 59, 59, 999);
          if (pDate > end) {
            matchDateRange = false;
          }
        }
      } else {
        matchDateRange = false;
      }
    }

    return matchFolder && matchSearch && matchStatus && matchDateRange;
  });

  const handleExportExcel = () => {
    if (filteredPeserta.length === 0) {
      alert("Tidak ada data peserta untuk diekspor!");
      return;
    }

    const headers = [
      "ID Roster",
      "Nama Lengkap",
      "NIP",
      "Unit Kerja",
      "Jabatan",
      "Program Pelatihan",
      "Nomor Sertifikat",
      "Nilai",
      "Status Cetak",
      "Masa Berlaku"
    ];

    const dataRows = filteredPeserta.map((p) => {
      const folderName = folders.find((f) => f.id === p.folderId)?.name || "-";
      const isIssued = p.sertifikat !== null;
      const expired = isCertExpired(p.tanggalExpired);
      const statusCetak = isIssued ? (expired ? "KEDALUWARSA" : "TERBIT") : "BELUM RILIS";

      return [
        p.id,
        p.name,
        p.nip,
        p.instansi,
        p.jabatan,
        folderName,
        p.noSertifikat,
        p.nilai,
        statusCetak,
        p.tanggalExpired || "-"
      ];
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Peserta");

    // Auto-fit column widths
    const maxCols = headers.length;
    const colWidths = [];
    for (let i = 0; i < maxCols; i++) {
      let maxLen = headers[i].length;
      for (const row of dataRows) {
        const val = row[i];
        if (val !== null && val !== undefined) {
          maxLen = Math.max(maxLen, val.toString().length);
        }
      }
      colWidths.push({ wch: maxLen + 3 });
    }
    worksheet['!cols'] = colWidths;

    // Export file
    XLSX.writeFile(workbook, `Daftar_Peserta_RSUD_Jusuf_SK_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportCsv = () => {
    if (filteredPeserta.length === 0) {
      alert("Tidak ada data peserta untuk diekspor!");
      return;
    }

    // Header row
    const headers = [
      "ID Roster",
      "Nama Lengkap",
      "NIP",
      "Unit Kerja",
      "Jabatan",
      "Program Pelatihan",
      "Nomor Sertifikat",
      "Nilai",
      "Status Cetak",
      "Masa Berlaku"
    ];

    // Escape commas and double quotes for clean CSV fields
    const cleanField = (field: string | undefined | null) => {
      if (field === null || field === undefined) return '""';
      return `"${field.toString().replace(/"/g, '""')}"`;
    };

    // Map each participant to a row of data
    const rows = filteredPeserta.map((p) => {
      const folderName = folders.find((f) => f.id === p.folderId)?.name || "-";
      const isIssued = p.sertifikat !== null;
      const expired = isCertExpired(p.tanggalExpired);
      const statusCetak = isIssued ? (expired ? "KEDALUWARSA" : "TERBIT") : "BELUM RILIS";

      return [
        cleanField(p.id),
        cleanField(p.name),
        cleanField(p.nip),
        cleanField(p.instansi),
        cleanField(p.jabatan),
        cleanField(folderName),
        cleanField(p.noSertifikat),
        cleanField(p.nilai),
        cleanField(statusCetak),
        cleanField(p.tanggalExpired || "-")
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Daftar_Peserta_Sertifikasi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 text-left">
      {/* FILTER & OPERATIONS RIBBON */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
        {/* Row 1: Primary Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FOLDER FILTER dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saring Program Pelatihan:</label>
            <select
              value={selectedFolderId}
              onChange={handleFilterFolder}
              className="w-full px-3 py-1.5 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none text-xs rounded-lg font-semibold text-slate-800 transition-colors bg-white hover:border-slate-300"
            >
              <option value="">-- Semua Folder Diklat --</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* QUERY SEARCH box */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penyaringan Roster:</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-8 pr-4 py-1.5 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none text-xs rounded-lg transition-colors placeholder-slate-400 hover:border-slate-300"
                placeholder="Cari nama, NIP, unit kerja, no sertifikat..."
              />
            </div>
          </div>
        </div>

        {/* Row 2: Advanced Filters & Actions */}
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-end pt-3 border-t border-dashed border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {/* status filter dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Sertifikat:</label>
              <select
                value={filterStatusCert}
                onChange={(e) => setFilterStatusCert(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none text-xs rounded-lg font-semibold text-slate-800 transition-colors bg-white hover:border-slate-300"
              >
                <option value="">-- Semua Status --</option>
                <option value="terbit">Sudah Terbit</option>
                <option value="belum_terbit">Belum Terbit</option>
              </select>
            </div>

            {/* start date register range */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Terbit Mulai:</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none text-xs rounded-lg text-slate-705 transition-colors font-semibold"
              />
            </div>

            {/* end date register range */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Terbit Selesai:</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none text-xs rounded-lg text-slate-705 transition-colors font-semibold"
              />
            </div>
          </div>

          {/* operations button group */}
          <div className="flex flex-wrap items-center gap-2">
            {(selectedFolderId || searchQuery || filterStatusCert || filterStartDate || filterEndDate) && (
              <button
                onClick={() => {
                  setSelectedFolderId('');
                  setSearchQuery('');
                  setFilterStatusCert('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="flex-1 lg:flex-none border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Bersihkan semua penyaringan aktif"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Bersihkan Filter
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="flex-1 lg:flex-none border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Ekspor daftar ke format Excel (.xlsx)"
            >
              <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-700" />
              Ekspor Excel
            </button>

            <button
              onClick={handleExportCsv}
              className="flex-1 lg:flex-none border border-slate-250 hover:bg-slate-50 text-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Ekspor daftar ke format CSV"
            >
              <Download className="h-4.5 w-4.5 text-[#0F4C81]" />
              Ekspor CSV
            </button>

            <button
              onClick={() => {
                setFormFolderId(folders[0]?.id || '');
                setShowImportModal(true);
              }}
              className="flex-1 lg:flex-none border border-slate-250 hover:bg-slate-50 text-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
              Import CSV
            </button>

            <button
              onClick={openAddModalFunc}
              className="flex-1 lg:flex-none bg-[#0F4C81] hover:bg-[#1E88E5] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="h-4.5 w-4.5" />
              Daftarkan Baru
            </button>
          </div>
        </div>
      </div>

      {/* ROSTER DATATABLE CARD */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse text-left">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                <th className="px-5 py-3 w-16">ID Record</th>
                <th className="px-5 py-3">Nama Lengkap & NIP</th>
                <th className="px-5 py-3">Unit Kerja</th>
                <th className="px-5 py-3">Pelatihan Diklat</th>
                <th className="px-5 py-3">Nomor Sertifikat</th>
                <th className="px-5 py-3">Tanggal Expired</th>
                <th className="px-5 py-3">Status Cetak</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-750">
              {filteredPeserta.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <ClipboardList className="h-9 w-9 text-slate-350 mx-auto mb-2" />
                    <p className="font-semibold text-xs text-slate-600">Tidak ada data peserta ditemukan</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Silakan tambahkan baru atau ubah penyaringan</p>
                  </td>
                </tr>
              ) : (
                filteredPeserta.map((p) => {
                  const matchingFolder = folders.find((f) => f.id === p.folderId);
                  const isIssued = p.sertifikat !== null;
                  const expired = isCertExpired(p.tanggalExpired);

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${expired ? 'bg-red-50/20' : ''}`}>
                      <td className="px-5 py-3 font-mono font-bold text-[10px] text-slate-400">
                        {p.id}
                      </td>
                      <td className="px-5 py-3">
                        <strong className="block text-slate-800 font-bold">{p.name}</strong>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">NIP. {p.nip}</span>
                          {p.pdfData && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 rounded px-1.5 py-0.5 text-[9px] font-semibold w-fit" title={p.pdfName}>
                              <FileText className="h-3 w-3 text-blue-500" />
                              PDF Kustom Attached
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="block text-slate-700 font-medium">{p.instansi}</span>
                        <span className="text-[10px] text-slate-400 block">{p.jabatan}</span>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-600 max-w-[180px] truncate">
                        {matchingFolder ? matchingFolder.name : 'Program Umum'}
                      </td>
                      <td className="px-5 py-3">
                        <code className="text-[10px] text-[#0F4C81] font-mono block font-bold leading-none">
                          {p.noSertifikat}
                        </code>
                        <div className="text-[9px] text-slate-450 mt-1 flex flex-col gap-0.5">
                          <div>Sertifikat Nilai: <strong className="text-orange-500 font-bold">{p.nilai}/100</strong></div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {p.tanggalExpired ? (() => {
                          const expStatus = getExpiryStatus(p.tanggalExpired);
                          const valInfo = getValidityInfo(p.tanggal, p.tanggalExpired);
                          return (
                            <div className="flex flex-col gap-1 max-w-[160px]">
                              {/* Expired Status Warning Badge */}
                              <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full font-bold uppercase text-[8px] w-fit leading-none ${expStatus.badgeClass}`}>
                                {expStatus.status === 'expired' && <AlertTriangle className="h-2.5 w-2.5 text-rose-600 shrink-0 animate-pulse" />}
                                {expStatus.status === 'warning' && <AlertTriangle className="h-2.5 w-2.5 text-amber-600 shrink-0" />}
                                {expStatus.status === 'safe' && (
                                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                  </span>
                                )}
                                {expStatus.label}
                              </span>

                              {/* Target Date Display */}
                              <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                                Exp: <span className="font-bold text-slate-800 dark:text-slate-100">{p.tanggalExpired}</span>
                              </div>

                              {/* Progress Activated Time remaining scale bar */}
                              {expStatus.status !== 'expired' && valInfo.percentRemaining < 100 && (
                                <div className="w-full mt-0.5" title={`Sisa masa aktif: ${valInfo.timeLeftString}`}>
                                  <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-500 mb-0.5 font-bold leading-none">
                                    <span>{valInfo.timeLeftString}</span>
                                    <span>{valInfo.percentRemaining}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        valInfo.percentRemaining > 30 ? 'bg-emerald-500' : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${valInfo.percentRemaining}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          <span className="text-slate-450 text-[10px] italic">Bebas Expired</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {isIssued ? (
                          expired ? (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.35)]">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                              </span>
                              KEDALUWARSA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">
                              <span className="w-1 h-1 rounded-full bg-emerald-500"></span> TERBIT
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">
                            <span className="w-1 h-1 rounded-full bg-amber-500"></span> BELUM RILIS
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* File PDF Kustom download button */}
                          {p.pdfData && (
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = p.pdfData!;
                                link.download = p.pdfName || `Sertifikat_${p.name.replace(/\s+/g, '_')}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded px-2.5 py-1 flex items-center gap-1 transition-colors text-[10px] font-semibold cursor-pointer shadow-xs"
                              title="Unduh Berkas PDF Tambahan"
                            >
                              <Download className="h-3 w-3" />
                              PDF
                            </button>
                          )}

                          {isIssued ? (
                            <button
                              onClick={() => handleTriggerGenerate(p)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded px-2.5 py-1 flex items-center gap-1 transition-colors text-[10px] font-semibold cursor-pointer shadow-xs"
                              title="Tampilkan Kredensial"
                            >
                              <Eye className="h-3 w-3" />
                              Lihat
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTriggerGenerate(p)}
                              className="bg-[#0F4C81] hover:bg-[#1E88E5] text-white rounded px-2.5 py-1 flex items-center gap-1 transition-colors text-[10px] font-bold cursor-pointer shadow-xs"
                              title="Terbitkan Sertifikat"
                            >
                              <Sparkles className="h-3 w-3 animate-pulse" />
                              Rilis
                            </button>
                          )}

                          <button
                            onClick={() => openEditModalFunc(p)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit data"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePeserta(p.id)}
                            className="text-slate-400 hover:text-red-650 p-1 rounded hover:bg-red-50/50 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT DIALOG */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-lg overflow-hidden border border-slate-200 text-left">
            <div className="bg-[#1E88E5] px-4.5 py-3.5 flex items-center justify-between border-b text-white">
              <span className="font-bold text-xs flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-white" />
                {isEditing ? 'Ubah Informasi Peserta' : 'Pendaftaran Anggota Roster'}
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white hover:opacity-80 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 space-y-3.5 text-left text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Spesifikasi Kelas Pelatihan:</label>
                  <select
                    value={formFolderId}
                    onChange={(e) => setFormFolderId(e.target.value)}
                    className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 outline-none rounded-lg text-slate-800"
                    required
                  >
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Nama Lengkap & Gelar:</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-1.5 focus:border-[#1E88E5] border border-slate-200 outline-none rounded-lg"
                    placeholder="Siti Aminah, S.Kep., Ners"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Nomor NIP Kepegawaian:</label>
                  <input
                    type="text"
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    className="w-full px-3 py-1.5 focus:border-[#1E88E5] border border-slate-200 outline-none rounded-lg font-mono"
                    placeholder="19950412 202102 2 001"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Unit Kerja:</label>
                  <input
                    type="text"
                    value={formInstansi}
                    onChange={(e) => setFormInstansi(e.target.value)}
                    className="w-full px-3 py-1.5 focus:border-[#1E88E5] border border-slate-200 outline-none rounded-lg"
                    placeholder="RSUP Dr. Sardjito Sleman"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Jabatan / Kompetensi:</label>
                  <input
                    type="text"
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    className="w-full px-3 py-1.5 focus:border-[#1E88E5] border border-slate-200 outline-none rounded-lg"
                    placeholder="Perawat Klinis ICU"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Template Kode Sertifikat:</label>
                  <input
                    type="text"
                    value={formCertNum}
                    onChange={(e) => setFormCertNum(e.target.value)}
                    className="w-full px-3 py-1.5 focus:border-[#1E88E5] border border-slate-200 outline-none rounded-lg font-mono"
                    placeholder="Contoh: 800.2/4.1- 10437/RSUDdrHJSK/2026"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Nilai Kelulusan Akademik:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formNilai}
                    onChange={(e) => setFormNilai(e.target.value)}
                    className="w-full px-3 py-1.5 focus:border-[#1E88E5] border border-slate-200 outline-none rounded-lg font-bold"
                    required
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#1E88E5]" /> Tanggal Cetak Terbit:
                  </label>
                  <input
                    type="text"
                    value={formTanggal}
                    onChange={(e) => {
                      setFormTanggal(e.target.value);
                      setFormTanggalExpired(calculateDefaultExpiry(e.target.value));
                    }}
                    className="w-full px-3 py-1.5 focus:border-[#1E88E5] border border-slate-200 outline-none rounded-lg text-slate-700"
                    placeholder="Contoh: 04/06/2026"
                    required
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-rose-500" /> Tanggal Habis Berlaku:
                  </label>
                  <input
                    type="text"
                    value={formTanggalExpired}
                    onChange={(e) => setFormTanggalExpired(e.target.value)}
                    className="w-full px-3 py-1.5 focus:border-rose-500 border border-slate-200 outline-none rounded-lg text-slate-700"
                    placeholder="Contoh: 04/06/2031"
                    required
                  />
                </div>

                {/* PDF custom uploader */}
                <div className="space-y-1 sm:col-span-2 border-t pt-2 border-dashed mt-1 text-left">
                  <label className="text-[11px] font-bold text-[#0F4C81] uppercase block flex items-center gap-1">
                    📎 Lampiran File PDF Sertifikat Asli (Opsional)
                  </label>
                  <p className="text-[10px] text-slate-400 mb-1">
                    Unggah file PDF riil untuk disimpan di database simulator. Peserta akan dapat mengunduh berkas utuh ini.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 p-2.5 rounded-lg border">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setFormPdfData(evt.target?.result as string);
                            setFormPdfName(file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-[11px] text-slate-500 w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-[#1E88E5]/10 file:text-[#1E88E5] hover:file:bg-[#1E88E5]/20 cursor-pointer"
                    />

                    {formPdfName && (
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 py-1 px-2.5 rounded text-[10px] font-semibold w-full sm:w-auto shrink-0 justify-between">
                        <span className="truncate max-w-[150px]">📎 {formPdfName}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormPdfData(undefined);
                            setFormPdfName(undefined);
                          }}
                          className="text-red-500 hover:text-red-700 font-bold hover:scale-110 transition-transform cursor-pointer text-sm leading-none pl-1"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-[11px] rounded-md text-slate-500 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1E88E5] hover:bg-[#0F4C81] text-white rounded-md font-bold transition-colors"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCEL/CSV IMPORTER */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-lg overflow-hidden border border-slate-200 text-left">
            <div className="bg-[#2c3e50] px-4.5 py-3.5 flex items-center justify-between border-b text-white">
              <span className="font-bold text-xs flex items-center gap-2">
                <FileSpreadsheet className="h-4.5 w-4.5 text-[#00ACC1]" />
                Import Peserta Massal (CSV)
              </span>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-white hover:opacity-80 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pilih Folder Diklat Tujuan:</label>
                <select
                  value={formFolderId}
                  onChange={(e) => setFormFolderId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 focus:border-[#0F4C81] outline-none rounded-md font-semibold text-slate-800"
                >
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                  Format Header Column (Pisahkan koma):
                </span>
                <code className="block p-2 bg-slate-900 text-slate-100 rounded text-[9px] font-mono leading-relaxed select-all">
                  name,nip,instansi,jabatan,noSertifikat,nilai,tanggal
                </code>
              </div>

              {/* Upload Drop area */}
              <div className="p-5 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvImport}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="h-8 w-8 text-slate-400 mx-auto mb-1.5" />
                <h5 className="font-bold text-[11px] text-slate-700">Pilih Berkas CSV Spreadsheet</h5>
                <span className="text-[10px] text-slate-400 mt-1 block">Data akan tergabung ke folder terpilih</span>
              </div>

              {csvStatusMsg && (
                <div className="text-center font-bold text-[10px] text-amber-700 bg-amber-50 p-2 border border-amber-100 rounded">
                  {csvStatusMsg}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-[11px] rounded-md text-slate-500 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUCCESS FULL PREVIEW CERTS ISSUANCE */}
      {showCertModal && activeCertPeserta && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex flex-col justify-start overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="bg-white rounded-2xl max-w-6xl w-full mx-auto shadow-2xl overflow-hidden my-auto border border-slate-200 flex flex-col">
            <div className="bg-[#0F4C81] p-4 flex items-center justify-between text-white border-b">
              <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
                Sertifikat Online Diklat Telah Terbit & Valid
              </span>
              <button
                onClick={() => setShowCertModal(false)}
                className="text-white hover:opacity-80 font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[85vh] lg:max-h-[75vh]">
              {/* LEFT SIDEBAR: Layout Controls Panel (4 columns) */}
              <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto max-h-[40vh] lg:max-h-[75vh] space-y-4 text-left">
                {activeCertPeserta.pdfData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Sertifikat Kustom Terdeteksi
                      </span>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl space-y-2.5">
                      <div className="text-xs text-blue-900 font-semibold leading-relaxed">
                        Anda telah melampirkan berkas sertifikat kustom secara mandiri untuk peserta ini.
                      </div>
                      <div className="text-[11px] text-slate-500 leading-normal space-y-1">
                        <div><strong>Nama Peserta:</strong> {activeCertPeserta.name}</div>
                        <div><strong>NIP:</strong> {activeCertPeserta.nip}</div>
                        {activeCertPeserta.pdfName && (
                          <div className="break-all font-mono text-[10px] mt-1 bg-white p-1.5 rounded border border-slate-150">
                            <strong>Nama File:</strong> {activeCertPeserta.pdfName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-amber-50/55 border border-amber-200/70 p-3 rounded-lg text-[11.5px] text-amber-900 leading-normal">
                      ⚠️ <strong>Informasi:</strong> Panel atur tata letak dinonaktifkan karena berkas ini menggunakan file asli PDF/gambar penuh dari kolom lampiran data peserta.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wide flex items-center gap-1">
                        <Settings className="h-3.5 w-3.5 text-[#0F4C81]" />
                        Atur Tata Letak Sertifikat
                      </span>
                      <button 
                        onClick={resetConfig}
                        className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Kembalikan semua slider ke posisi standar"
                      >
                        <RefreshCw className="h-2.5 w-2.5 animate-spin-hover" />
                        Reset
                      </button>
                    </div>

                    {/* CATEGORY 1: Layer Visibility Toggles */}
                    <div className="space-y-1.5 p-2.5 bg-white border border-slate-150 rounded-lg">
                      <h5 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Tampilkan Komponen Bawaan:</h5>
                      
                      <label className="flex items-center justify-between cursor-pointer text-xs select-none p-1 hover:bg-slate-50 rounded">
                        <span className="text-slate-650 font-medium">Tepi Bingkai Biru & Garis Tipis</span>
                        <input 
                          type="checkbox" 
                          checked={config.showBorder}
                          onChange={(e) => updateConfigVal('showBorder', e.target.checked)}
                          className="accent-[#0F4C81]"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer text-xs select-none p-1 hover:bg-slate-50 rounded">
                        <span className="text-slate-650 font-medium">Ornamen Sudut Emas</span>
                        <input 
                          type="checkbox" 
                          checked={config.showDecorations}
                          onChange={(e) => updateConfigVal('showDecorations', e.target.checked)}
                          className="accent-[#0F4C81]"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer text-xs select-none p-1 hover:bg-slate-50 rounded">
                        <span className="text-slate-650 font-medium">Logo & Judul &quot;SERTIFIKAT&quot;</span>
                        <input 
                          type="checkbox" 
                          checked={config.showHeaderEmblem}
                          onChange={(e) => updateConfigVal('showHeaderEmblem', e.target.checked)}
                          className="accent-[#0F4C81]"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer text-xs select-none p-1 hover:bg-slate-50 rounded">
                        <span className="text-slate-650 font-medium">Kalimat Pembuka</span>
                        <input 
                          type="checkbox" 
                          checked={config.showSalutation}
                          onChange={(e) => updateConfigVal('showSalutation', e.target.checked)}
                          className="accent-[#0F4C81]"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer text-xs select-none p-1 hover:bg-slate-50 rounded">
                        <span className="text-slate-650 font-medium">Kotak Judul Training</span>
                        <input 
                          type="checkbox" 
                          checked={config.showPelatihanBox}
                          onChange={(e) => updateConfigVal('showPelatihanBox', e.target.checked)}
                          className="accent-[#0F4C81]"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer text-xs select-none p-1 hover:bg-slate-50 rounded">
                        <span className="text-slate-650 font-medium text-[11px] leading-tight">Label Deskripsi (&quot;Atas dedikasi...&quot;)</span>
                        <input 
                          type="checkbox" 
                          checked={config.showSignatureLabel}
                          onChange={(e) => updateConfigVal('showSignatureLabel', e.target.checked)}
                          className="accent-[#0F4C81]"
                        />
                      </label>

                      {/* Additional switches when custom background is active */}
                      {activeFolder?.templateUrl && (
                        <div className="border-t border-slate-150 pt-2.5 mt-2.5 space-y-1.5">
                          <h6 className="font-extrabold text-[9px] text-[#0F4C81] uppercase tracking-wide mb-1">
                            Filter Pemetaan Background Kustom:
                          </h6>
                          
                          <label className="flex items-center justify-between cursor-pointer text-xs select-none p-1 hover:bg-slate-50 rounded">
                            <span className="text-slate-650 font-bold text-emerald-700">Tampilkan Nama Pelatihan</span>
                            <input 
                              type="checkbox" 
                              checked={config.showPelatihanName !== false}
                              onChange={(e) => updateConfigVal('showPelatihanName', e.target.checked)}
                              className="accent-emerald-600"
                            />
                          </label>

                          <label className="flex items-center justify-between cursor-pointer text-xs select-none p-1 hover:bg-slate-50 rounded">
                            <span className="text-slate-650 font-medium">Kotak Bingkai Pelatihan (Abu-abu)</span>
                            <input 
                              type="checkbox" 
                              checked={!!config.showPelatihanContainer}
                              onChange={(e) => updateConfigVal('showPelatihanContainer', e.target.checked)}
                              className="accent-[#0F4C81]"
                            />
                          </label>

                          <label className="flex items-center justify-between cursor-pointer text-xs select-none p-1 hover:bg-slate-50 rounded">
                            <span className="text-slate-650 font-medium text-[11px] leading-tight">Keterangan Pelatihan (&quot;Diselenggarakan...&quot;)</span>
                            <input 
                              type="checkbox" 
                              checked={!!config.showPelatihanStaticText}
                              onChange={(e) => updateConfigVal('showPelatihanStaticText', e.target.checked)}
                              className="accent-[#0F4C81]"
                            />
                          </label>

                          <label className="flex items-center justify-between cursor-pointer text-xs select-none p-1 hover:bg-slate-50 rounded">
                            <span className="text-slate-650 font-semibold text-blue-700">Tampilkan Blok Tanda Tangan</span>
                            <input 
                              type="checkbox" 
                              checked={!!config.showSignatureBlock}
                              onChange={(e) => updateConfigVal('showSignatureBlock', e.target.checked)}
                              className="accent-blue-600"
                            />
                          </label>

                          <label className="flex items-center justify-between cursor-pointer text-xs select-none p-1 hover:bg-slate-50 rounded">
                            <span className="text-slate-650 font-medium">Tampilkan ID Kredensial Verifikasi</span>
                            <input 
                              type="checkbox" 
                              checked={!!config.showVerificationCredits}
                              onChange={(e) => updateConfigVal('showVerificationCredits', e.target.checked)}
                              className="accent-[#0F4C81]"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* CATEGORY 2: Element Sliders */}
                    <div className="space-y-3.5 p-2.5 bg-white border border-slate-150 rounded-lg text-xs">
                      <h5 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Atur Dimensi & Posisi Teks:</h5>

                      {/* 1. Nama Lengkap */}
                      <div className="space-y-1.5 border-b border-slate-100 pb-2.5">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>1. Nama Penerima</span>
                          <span className="font-mono text-slate-400">{config.yOffsetName}% Y</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-slate-450 block mb-0.5">Tinggi Y-Offset</label>
                            <input 
                              type="range" min="10" max="90" step="1"
                              value={config.yOffsetName}
                              onChange={(e) => updateConfigVal('yOffsetName', parseInt(e.target.value))}
                              className="w-full accent-[#1E88E5]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-450 block mb-0.5">Ukuran: {config.fontSizeName}px</label>
                            <input 
                              type="range" min="12" max="42" step="1"
                              value={config.fontSizeName}
                              onChange={(e) => updateConfigVal('fontSizeName', parseInt(e.target.value))}
                              className="w-full accent-[#1E88E5]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Nomor Sertifikat */}
                      <div className="space-y-1.5 border-b border-slate-100 pb-2.5">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>2. Nomor Sertifikat</span>
                          <span className="font-mono text-slate-400">{config.yOffsetNumber}% Y</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-slate-455 block mb-0.5">Tinggi Y-Offset</label>
                            <input 
                              type="range" min="10" max="85" step="1"
                              value={config.yOffsetNumber}
                              onChange={(e) => updateConfigVal('yOffsetNumber', parseInt(e.target.value))}
                              className="w-full accent-[#0F4C81]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-455 block mb-0.5">Ukuran: {config.fontSizeNumber}px</label>
                            <input 
                              type="range" min="8" max="22" step="1"
                              value={config.fontSizeNumber}
                              onChange={(e) => updateConfigVal('fontSizeNumber', parseInt(e.target.value))}
                              className="w-full accent-[#0F4C81]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Detail Metadata (NIP / Unit / Jabatan) */}
                      <div className="space-y-1.5 border-b border-slate-100 pb-2.5">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>3. Detail NIP & Unit</span>
                          <span className="font-mono text-slate-400">{config.yOffsetDetails}% Y</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-slate-450 block mb-0.5">Tinggi Y-Offset</label>
                            <input 
                              type="range" min="15" max="90" step="1"
                              value={config.yOffsetDetails}
                              onChange={(e) => updateConfigVal('yOffsetDetails', parseInt(e.target.value))}
                              className="w-full accent-[#374151]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-455 block mb-0.5">Ukuran: {config.fontSizeDetails}px</label>
                            <input 
                              type="range" min="8" max="20" step="1"
                              value={config.fontSizeDetails}
                              onChange={(e) => updateConfigVal('fontSizeDetails', parseInt(e.target.value))}
                              className="w-full accent-[#374151]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 4. Kotak Kelulusan Training */}
                      <div className="space-y-1.5 border-b border-slate-100 pb-2.5">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>4. Label Training & Nilai</span>
                          <span className="font-mono text-slate-400">{config.yOffsetPelatihan}% Y</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-slate-455 block mb-0.5">Tinggi Y-Offset</label>
                            <input 
                              type="range" min="20" max="90" step="1"
                              value={config.yOffsetPelatihan}
                              onChange={(e) => updateConfigVal('yOffsetPelatihan', parseInt(e.target.value))}
                              className="w-full accent-teal-600"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-455 block mb-0.5">Ukuran: {config.fontSizePelatihan}px</label>
                            <input 
                              type="range" min="10" max="30" step="1"
                              value={config.fontSizePelatihan}
                              onChange={(e) => updateConfigVal('fontSizePelatihan', parseInt(e.target.value))}
                              className="w-full accent-teal-600"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 5. QR Code Security */}
                      <div className="space-y-1.5 border-b border-slate-100 pb-2.5">
                        <div className="flex justify-between font-bold text-teal-700">
                          <span>5. QR Code Verifikasi</span>
                          <span className="font-mono text-slate-455">{config.xOffsetQrCode}% X / {config.yOffsetQrCode}% Y</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <label className="text-[8px] text-slate-500 block">Kiri X</label>
                            <input 
                              type="range" min="10" max="90" step="1"
                              value={config.xOffsetQrCode}
                              onChange={(e) => updateConfigVal('xOffsetQrCode', parseInt(e.target.value))}
                              className="w-full accent-teal-600"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] text-slate-500 block">Tinggi Y</label>
                            <input 
                              type="range" min="20" max="95" step="1"
                              value={config.yOffsetQrCode}
                              onChange={(e) => updateConfigVal('yOffsetQrCode', parseInt(e.target.value))}
                              className="w-full accent-teal-600"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] text-slate-500 block">Sisi: {config.sizeQrCode}px</label>
                            <input 
                              type="range" min="40" max="110" step="5"
                              value={config.sizeQrCode}
                              onChange={(e) => updateConfigVal('sizeQrCode', parseInt(e.target.value))}
                              className="w-full accent-teal-600"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 6. Block Tanda Tangan */}
                      <div className="space-y-1.5 border-b border-slate-100 pb-2.5">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>6. Blok Tanda Tangan</span>
                          <span className="font-mono text-slate-455">{config.xOffsetSignature}% X / {config.yOffsetSignature}% Y</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-slate-450 block mb-0.5">Kanan X-Offset</label>
                            <input 
                              type="range" min="15" max="85" step="1"
                              value={config.xOffsetSignature}
                              onChange={(e) => updateConfigVal('xOffsetSignature', parseInt(e.target.value))}
                              className="w-full accent-[#1E88E5]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-450 block mb-0.5">Tinggi Y-Offset</label>
                            <input 
                              type="range" min="30" max="95" step="1"
                              value={config.yOffsetSignature}
                              onChange={(e) => updateConfigVal('yOffsetSignature', parseInt(e.target.value))}
                              className="w-full accent-[#1E88E5]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 7. Banner Expired / Masa Berlaku */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between font-bold text-amber-700">
                          <span>7. Banner Expired</span>
                          <span className="font-mono text-slate-400">{config.yOffsetExpiry}% Y</span>
                        </div>
                        <div>
                          <input 
                            type="range" min="20" max="95" step="1"
                            value={config.yOffsetExpiry}
                            onChange={(e) => updateConfigVal('yOffsetExpiry', parseInt(e.target.value))}
                            className="w-full accent-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT PORTION: Certificate Visualizer (8 columns) */}
              <div className="lg:col-span-8 p-5 bg-slate-200/50 flex flex-col justify-between overflow-x-auto select-none min-h-[350px] lg:max-h-[75vh]">
                {activeCertPeserta.pdfData ? (
                  <div className="bg-blue-50/80 border border-blue-100 text-blue-800 text-[10px] leading-relaxed p-2.5 rounded-lg mb-4 text-left shadow-3xs hover:bg-blue-50 transition-colors">
                    📄 <strong>Pratinjau PDF Kustom Aktif:</strong> Tampilan di bawah ini memuat berkas utuh rujukan dari kolom lampiran PDF peserta.
                  </div>
                ) : (
                  <div className="bg-blue-50/80 border border-blue-100 text-blue-800 text-[10px] leading-relaxed p-2.5 rounded-lg mb-4 text-left shadow-3xs hover:bg-blue-50 transition-colors">
                    💡 <strong>Mode Penyelarasan Presisi Aktif:</strong> Gunakan panel kontrol di sebelah kiri untuk mengatur tata letak cetak secara instan agar sesuai secara presisi dengan PDF background kustom yang diupload pada folder ini!
                  </div>
                )}

                <div className="relative w-full overflow-x-auto flex items-center justify-center py-2 flex-1">
                  <div className="w-full min-w-[700px] max-w-[850px] transform hover:scale-[1.005] transition-all duration-300">
                    <CertificateLayout
                      peserta={activeCertPeserta}
                      folder={folders.find((f) => f.id === activeCertPeserta.folderId) as FolderDiklat}
                      verifyUrl={`${appUrl}?v=${activeCertPeserta.sertifikat?.id}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls bottom bar */}
            <div className="bg-white border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ID Kredensial Validasi:</span>
                <span className="font-mono text-xs text-[#0F4C81] font-bold block select-all">
                  {activeCertPeserta.sertifikat?.id}
                </span>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 sm:flex-initial bg-[#0F4C81] hover:bg-[#1E88E5] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Sertifikat
                </button>

                {activeCertPeserta.pdfData && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = activeCertPeserta.pdfData!;
                      link.download = activeCertPeserta.pdfName || `Sertifikat_${activeCertPeserta.name.replace(/\s+/g, '_')}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex-1 sm:flex-initial bg-[#1E88E5] hover:bg-[#0F4C81] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Unduh Berkas PDF Asli
                  </button>
                )}

                <button
                  onClick={() => setShowCertModal(false)}
                  className="flex-1 sm:flex-initial border border-slate-200 hover:bg-slate-50 text-slate-500 px-4 py-2 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
