import React, { useState, useEffect } from 'react';
import { FolderDiklat, Peserta, Certificate, DashboardStats, SuratDokumen } from './types';
import { initialFolders, initialPeserta } from './initialData';
import {
  Award,
  FolderOpen,
  Users,
  Terminal,
  ShieldCheck,
  Menu,
  ChevronRight,
  BookOpen,
  X,
  Plus,
  AlertTriangle,
  Trash2,
  CheckCircle,
  Sun,
  Moon
} from 'lucide-react';

// Modular view layouts
import DashboardView from './components/DashboardView';
import FoldersView from './components/FoldersView';
import ParticipantsView from './components/ParticipantsView';
import AppsScriptCenter from './components/AppsScriptCenter';
import PublicVerifyView from './components/PublicVerifyView';
import TelaahMasukView from './components/TelaahMasukView';

export default function App() {
  // Navigation Router state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'folders' | 'participants' | 'apps_script' | 'verify' | 'telaah_masuk'>('dashboard');
  const [prefilledVerifyId, setPrefilledVerifyId] = useState<string>('');

  // Dark Mode Theme Switcher State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') return 'dark';
    return 'light';
  });

  // Custom Primary Color Theme State
  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('primary_color') || '#0F4C81';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('primary_color', primaryColor);
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    
    // Add custom helper for hover variant (roughly 85% opacity version of the color)
    const hoverColor = primaryColor.startsWith('#') && primaryColor.length === 7 
      ? `${primaryColor}cc` 
      : primaryColor;
    document.documentElement.style.setProperty('--primary-color-hover', hoverColor);
  }, [primaryColor]);

  // Custom Confirm/Alert Modal State for Iframe compatibilities
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Ya, Hapus', cancelText = 'Batal') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const triggerAlert = (title: string, message: string) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
    });
  };

  // Local storage synchronized databases
  const [folders, setFolders] = useState<FolderDiklat[]>([]);
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [suratList, setSuratList] = useState<SuratDokumen[]>([]);

  // Mobile sidebar controls
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // App domain URL for verification scanning
  const [appUrl, setAppUrl] = useState<string>('https://script.google.com/macros/s/AKfycbx_placeholder/exec');

  // Load from local storage or pre-populate initial preset data
  useEffect(() => {
    const savedFolders = localStorage.getItem('diklat_folders');
    const savedPeserta = localStorage.getItem('diklat_peserta');
    const savedSurat = localStorage.getItem('surat_list');

    if (savedFolders !== null) {
      setFolders(JSON.parse(savedFolders));
    } else {
      setFolders(initialFolders);
      try {
        localStorage.setItem('diklat_folders', JSON.stringify(initialFolders));
      } catch (e) {
        console.error('Failed to set initial folders in localStorage:', e);
      }
    }

    if (savedPeserta !== null) {
      setPeserta(JSON.parse(savedPeserta));
    } else {
      setPeserta(initialPeserta);
      try {
        localStorage.setItem('diklat_peserta', JSON.stringify(initialPeserta));
      } catch (e) {
        console.error('Failed to set initial peserta in localStorage:', e);
      }
    }

    if (savedSurat !== null) {
      setSuratList(JSON.parse(savedSurat));
    } else {
      const defaultSurat: SuratDokumen[] = [
        {
          rowIndex: 1,
          id: 'DOC-2026-001',
          docName: 'Surat Delegasi Diklat Manajemen Keperawatan',
          suratType: 'Surat Masuk',
          suratNo: '445/812/DIKLIT/V/2026',
          entryDate: '2026-05-18',
          uploadDate: '2026-05-20 09:15',
          employee: 'Nursiah Lestari, S.Kep',
          division: 'Bidang Keperawatan',
          desc: 'Delegasi pemanggilan training kepemimpinan ward manager untuk sertifikasi KARS.',
          link: ''
        },
        {
          rowIndex: 2,
          id: 'DOC-2026-002',
          docName: 'Nota Dinas Permohonan Sertifikat Keahlian Lanjut',
          suratType: 'Surat Keluar',
          suratNo: '445/ND-901/SDM/V/2026',
          entryDate: '2026-05-24',
          uploadDate: '2026-05-24 14:32',
          employee: 'dr. Setiawan, Sp.An',
          division: 'Instalasi Anestesi',
          desc: 'Permohonan penerbitan lembar bukti registrasi keahlian bersertifikat dari komite medik.',
          link: ''
        }
      ];
      setSuratList(defaultSurat);
      try {
        localStorage.setItem('surat_list', JSON.stringify(defaultSurat));
      } catch (e) {
        console.error('Failed to set initial surat in localStorage:', e);
      }
    }

    // Capture URL Query verified tokens for real-life QR validation scanning simulation!
    const queryParams = new URLSearchParams(window.location.search);
    const idParam = queryParams.get('id') || queryParams.get('verify') || queryParams.get('v');
    if (idParam) {
      setPrefilledVerifyId(idParam);
      setActiveTab('verify');
    }

    // Attempt to parse dynamic host URL
    if (window.location.origin) {
      setAppUrl(window.location.origin);
    }
  }, []);

  // Save changes automatically
  const saveFoldersState = (updated: FolderDiklat[]) => {
    setFolders(updated);
    try {
      localStorage.setItem('diklat_folders', JSON.stringify(updated));
    } catch (e) {
      console.error('Quota exceeded for localStorage (folders):', e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        triggerAlert('Penyimpanan Penuh', 'Penyimpanan lokal penuh karena berkas template kustom terlalu besar. Silakan gunakan template preset atau file gambar yang lebih kecil.');
      }
    }
  };

  const savePesertaState = (updated: Peserta[]) => {
    setPeserta(updated);
    try {
      localStorage.setItem('diklat_peserta', JSON.stringify(updated));
    } catch (e) {
      console.error('Quota exceeded for localStorage (peserta):', e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        triggerAlert('Penyimpanan Penuh', 'Penyimpanan lokal penuh karena jumlah data peserta / sertifikat melebihi batas browser.');
      }
    }
  };

  const saveSuratListState = (updated: SuratDokumen[]) => {
    const normalized = updated.map((item, idx) => ({
      ...item,
      rowIndex: idx + 1
    }));
    setSuratList(normalized);
    try {
      localStorage.setItem('surat_list', JSON.stringify(normalized));
    } catch (e) {
      console.error('Quota exceeded for localStorage (surat_list):', e);
    }
  };

  // CALCULATE LIVE STATISTICS
  const getStats = (): DashboardStats => {
    const totalPublished = peserta.filter((p) => p.sertifikat !== null).length;
    return {
      totalFolders: folders.length,
      totalParticipants: peserta.length,
      totalCerts: peserta.length,
      totalPublished,
    };
  };

  // OPERATIONS: FOLDERS (CRUD)
  const handleAddFolder = (name: string) => {
    const id = `FLD-${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
    const newFolder: FolderDiklat = {
      id,
      name,
      driveId: `DRV-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      templateUrl: '',
      date: new Date().toLocaleDateString('id-ID'),
    };
    saveFoldersState([newFolder, ...folders]);
  };

  const handleEditFolder = (id: string, name: string) => {
    const updated = folders.map((f) => (f.id === id ? { ...f, name } : f));
    saveFoldersState(updated);
  };

  const handleDeleteFolder = (id: string) => {
    triggerConfirm(
      'Hapus Folder Diklat?',
      'PERINGATAN: Menghapus folder diklat akan menghapus seluruh data peserta di dalamnya secara permanen dalam simulator. Apakah Anda yakin ingin melanjutkan?',
      () => {
        // Delete matching folder rows
        const updatedFolders = folders.filter((f) => f.id !== id);
        saveFoldersState(updatedFolders);

        // Clean up participants enrolled in this category
        const updatedPeserta = peserta.filter((p) => p.folderId !== id);
        savePesertaState(updatedPeserta);
      },
      'Ya, Hapus Folder'
    );
  };

  const handleUpdateTemplate = (id: string, url: string) => {
    const updated = folders.map((f) => {
      if (f.id === id) {
        // If image URL is clear or uploaded, initialize a clean layout structure suited for high fidelity overlays
        const defaultConfig = url !== "" ? {
          showBorder: false,
          showDecorations: false,
          showHeaderEmblem: false,
          showSalutation: false,
          showPelatihanBox: false,
          showSignatureLabel: false,
          
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
        } : undefined;

        return {
          ...f,
          templateUrl: url,
          templateConfig: f.templateConfig || defaultConfig
        };
      }
      return f;
    });
    saveFoldersState(updated);
  };

  const handleUpdateFolderConfig = (id: string, config: any) => {
    const updated = folders.map((f) => (f.id === id ? { ...f, templateConfig: config } : f));
    saveFoldersState(updated);
  };

  // OPERATIONS: PARTICIPANTS (CRUD)
  const handleAddPeserta = (data: Omit<Peserta, 'id' | 'sertifikat'>) => {
    const id = `PES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newPeserta: Peserta = {
      ...data,
      id,
      sertifikat: null,
    };
    savePesertaState([newPeserta, ...peserta]);
  };

  const handleEditPeserta = (id: string, data: Omit<Peserta, 'id' | 'sertifikat'>) => {
    const updated = peserta.map((p) => (p.id === id ? { ...p, ...data } : p));
    savePesertaState(updated);
  };

  const handleDeletePeserta = (id: string) => {
    triggerConfirm(
      'Hapus Berkas Peserta?',
      'Apakah Anda yakin ingin menghapus berkas pendaftaran peserta ini secara permanen dari roster?',
      () => {
        const updated = peserta.filter((p) => p.id !== id);
        savePesertaState(updated);
      },
      'Ya, Hapus'
    );
  };

  // Release/generate certificate
  const handleGenerateCert = (pesertaId: string) => {
    const updated = peserta.map((p) => {
      if (p.id === pesertaId && p.sertifikat === null) {
        // Build new valid QR credential code
        const certId = `CRT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const newCert: Certificate = {
          id: certId,
          pesertaId,
          linkPdf: `#`, // simulates local PDF print action
          qrLink: certId,
          status: 'Aktif',
          tanggalTerbit: p.tanggal,
        };
        return { ...p, sertifikat: newCert };
      }
      return p;
    });
    savePesertaState(updated);
  };

  // Bulk XLS/CSV import
  const handleImportPeserta = (dataArray: any[]) => {
    const newEntries = dataArray.map((row) => {
      const id = `PES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const tanggal = row.tanggal || row.Tanggal || new Date().toLocaleDateString('id-ID');
      
      // Calculate 5 years later for expiry if not provided
      let tanggalExpired = row.tanggalExpired || row.TanggalExpired || '';
      if (!tanggalExpired) {
        try {
          const parts = tanggal.split('/');
          if (parts.length === 3) {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const y = parseInt(parts[2], 10) + 5;
            tanggalExpired = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
          } else {
            tanggalExpired = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID');
          }
        } catch (e) {
          tanggalExpired = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID');
        }
      }

      return {
        id,
        folderId: row.folderId,
        name: row.name || row.Nama || row["Nama Lengkap"] || row["Nama_Lengkap"] || row["nama"] || 'Peserta Baru',
        nip: row.nip || row.NIP || row["Nomor NIP"] || row["NIP Kepegawaian"] || '-',
        instansi: row.instansi || row.Instansi || row["Unit Kerja"] || row["Unit_Kerja"] || '-',
        jabatan: row.jabatan || row.Jabatan || row["Jabatan"] || row["Jabatan / Kompetensi"] || '-',
        noSertifikat: row.noSertifikat || row.NoSertifikat || row["Nomor Sertifikat"] || row["Nomor_Sertifikat"] || row["no_sertifikat"] || `800.2/4.1- ${Math.floor(10437 + Math.random() * 500)}/RSUDdrHJSK/2026`,
        nilai: row.nilai || row.Nilai || row["Total"] || row["Nilai Postest"] || row["Nilai Kelulusan"] || '85',
        tanggal,
        tanggalExpired,
        sertifikat: null,
      };
    });
    savePesertaState([...newEntries, ...peserta]);
  };

  const handleAddSurat = (
    surat: Omit<SuratDokumen, 'rowIndex' | 'id' | 'uploadDate'>,
    base64File: string,
    fileName?: string
  ) => {
    const id = `DOC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const uploadDate = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    
    const newSurat: SuratDokumen = {
      rowIndex: suratList.length + 1,
      id,
      docName: surat.docName,
      suratType: surat.suratType,
      suratNo: surat.suratNo,
      entryDate: surat.entryDate,
      uploadDate,
      employee: surat.employee,
      division: surat.division,
      desc: surat.desc,
      link: base64File,
      fileName
    };
    
    saveSuratListState([newSurat, ...suratList]);
  };

  const handleEditSurat = (rowIndex: number, updated: Partial<SuratDokumen>) => {
    const nextList = suratList.map((item) =>
      item.rowIndex === rowIndex ? { ...item, ...updated } : item
    );
    saveSuratListState(nextList);
  };

  const handleDeleteSurat = (rowIndex: number) => {
    const nextList = suratList.filter((item) => item.rowIndex !== rowIndex);
    saveSuratListState(nextList);
  };

  const handleImportSuratList = (csvText: string) => {
    try {
      const lines = csvText.split('\n');
      if (lines.length <= 1) return;
      
      const newDocs: SuratDokumen[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const separator = line.includes(';') ? ';' : ',';
        const parts = line.split(separator).map(p => p.replace(/^"|"$/g, '').trim());
        
        if (parts.length < 6) continue;
        
        newDocs.push({
          rowIndex: i,
          id: parts[0] || `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
          docName: parts[1] || 'Arsip Dokumen',
          suratType: (parts[2] === 'Surat Keluar' || parts[2]?.toLowerCase().includes('keluar')) ? 'Surat Keluar' : 'Surat Masuk',
          suratNo: parts[3] || 'N/A',
          entryDate: parts[4] || new Date().toISOString().slice(0, 10),
          uploadDate: parts[5] || new Date().toISOString().slice(0, 10),
          employee: parts[6] || 'Staff Administrasi',
          division: parts[7] || 'Instalasi Diklat',
          desc: parts[8] || '',
          link: ''
        });
      }
      
      if (newDocs.length > 0) {
        saveSuratListState(newDocs);
        triggerAlert('Pemulihan Sukses', `Sebanyak ${newDocs.length} dokumen persuratan berhasil direstore.`);
      }
    } catch (e: any) {
      triggerAlert('Pemulihan Gagal', `Gagal mengurai file CSV: ${e.message}`);
    }
  };

  const handleExportSuratList = () => {
    try {
      const headers = 'ID,Nama Dokumen,Kategori,Nomor Surat,Tanggal Surat,Tanggal Upload,Pegawai,Divisi,Keterangan';
      const rows = suratList.map((doc) => {
        return [
          `"${doc.id}"`,
          `"${doc.docName.replace(/"/g, '""')}"`,
          `"${doc.suratType}"`,
          `"${doc.suratNo.replace(/"/g, '""')}"`,
          `"${doc.entryDate}"`,
          `"${doc.uploadDate}"`,
          `"${doc.employee.replace(/"/g, '""')}"`,
          `"${doc.division.replace(/"/g, '""')}"`,
          `"${doc.desc.replace(/"/g, '""')}"`
        ].join(',');
      });
      
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_surat_diklat_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      triggerAlert('Gagal Ekspor', `Gagal membackup data: ${e.message}`);
    }
  };

  const handleResetAllData = () => {
    triggerConfirm(
      'Hapus Semua Data Simulator?',
      'PERINGATAN: Apakah Anda yakin ingin menghapus seluruh data (Folder Diklat, Peserta, dan Surat Telaah Masuk) secara permanen dari sistem simulator? Kredensial akan dikosongkan.',
      () => {
        saveFoldersState([]);
        savePesertaState([]);
        saveSuratListState([]);
        triggerAlert('Data Dihapus', 'Seluruh data di simulator berhasil dikosongkan!');
        setActiveTab('dashboard');
      },
      'Ya, Kosongkan Semua'
    );
  };

  return (
    <div id="app-root-container" className="h-screen w-full overflow-hidden bg-[#F5F7FA] dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100 flex flex-col md:flex-row relative transition-colors duration-300">
      
      {/* SIDEBAR BLOCK: STATIC ON DESKTOP, FLYOUT ON MOBILE */}
      <aside
        className={`fixed inset-y-0 left-0 bg-[#0F4C81] dark:bg-slate-900 text-white z-40 w-64 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static flex flex-col justify-between border-r border-[#1E88E5]/20 dark:border-slate-800 shrink-0`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Brand header banner */}
          <div className="p-6 flex items-center space-x-3 border-b border-[#1E88E5]/30 shrink-0 justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#00ACC1] to-[#01579B] rounded-xl flex items-center justify-center shadow-lg border border-teal-300/30 overflow-hidden shrink-0">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Main Hospital Structure Ground */}
                  <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  {/* Central Main Building Block */}
                  <path d="M6 21V9C6 8.44772 6.44772 8 7 8H17C17.5523 8 18 8.44772 18 9V21" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="rgba(255,255,255,0.1)" />
                  {/* Hospital Medical Cross Symbol atop */}
                  <path d="M12 2V6M10 4H14" stroke="#FFF066" strokeWidth="2" strokeLinecap="round" />
                  {/* Left Side Wing */}
                  <path d="M2 21V13C2 12.4477 2.44772 12 3 12H6V21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  {/* Right Side Wing */}
                  <path d="M18 21H21C21.5523 21 22 20.5523 22 20V13C22 12.4477 21.5523 12 21 12H18" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  {/* Windows indicators */}
                  <rect x="8.5" y="11" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.8" />
                  <rect x="13.5" y="11" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.8" />
                  <rect x="8.5" y="15" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.8" />
                  <rect x="13.5" y="15" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.8" />
                  {/* Hospital Main Door */}
                  <path d="M10 21V18C10 17.4477 10.4477 17 11 17H13C13.5523 17 14 17.4477 14 18V21" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="text-left">
                <h1 className="text-white font-extrabold leading-none tracking-tight text-sm">Bank Sertifikat</h1>
                <p className="text-[#00ACC1] text-[9.5px] uppercase font-bold tracking-wider mt-1.5 leading-tight">Admin Diklit RSUD Jusuf.SK</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-white/80 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setSidebarOpen(false);
              }}
              className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-colors group cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#1E88E5] text-white font-medium shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">📊</span>
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('folders');
                setSidebarOpen(false);
              }}
              className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-colors group cursor-pointer ${
                activeTab === 'folders'
                  ? 'bg-[#1E88E5] text-white font-medium shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">📁</span>
              <span className="font-medium">Folder Diklat</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('participants');
                setSidebarOpen(false);
              }}
              className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-colors group cursor-pointer ${
                activeTab === 'participants'
                  ? 'bg-[#1E88E5] text-white font-medium shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">👥</span>
              <span className="font-medium">Manajemen Peserta</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('telaah_masuk');
                setSidebarOpen(false);
              }}
              className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-colors group cursor-pointer ${
                activeTab === 'telaah_masuk'
                  ? 'bg-[#1E88E5] text-white font-medium shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">✉️</span>
              <span className="font-medium">Telaah Surat Masuk</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('apps_script');
                setSidebarOpen(false);
              }}
              className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-colors group cursor-pointer ${
                activeTab === 'apps_script'
                  ? 'bg-[#1E88E5] text-white font-medium shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">📜</span>
              <span className="font-medium">Apps Script Portal</span>
            </button>

            <hr className="border-white/10 my-4" />

            {/* Public verification scanner simulation */}
            <button
              onClick={() => {
                setActiveTab('verify');
                setSidebarOpen(false);
              }}
              className={`w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all group cursor-pointer ${
                activeTab === 'verify'
                  ? 'bg-amber-500 text-slate-900 shadow-sm'
                  : 'bg-white/5 text-amber-300 border border-amber-350/20 hover:bg-amber-300/10'
              }`}
            >
              <span className="text-lg">✅</span>
              <span className="font-semibold">Uji Verifikasi QR</span>
            </button>

            {/* Clear Database button */}
            <button
              onClick={handleResetAllData}
              className="w-full text-left flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-white transition-all group cursor-pointer mt-2"
              title="Kosongkan Database"
            >
              <span className="text-lg">🗑️</span>
              <span className="font-semibold">Hapus Semua Data</span>
            </button>
          </nav>
        </div>

        {/* Profile/User section at bottom */}
        <div className="p-6 mt-auto border-t border-[#1E88E5]/30 shrink-0 bg-[#0F4C81]">
          <div className="flex items-center space-x-3 text-white/70">
            <div className="w-8 h-8 rounded-full bg-[#1E88E5] flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
              AD
            </div>
            <div className="text-xs overflow-hidden text-left">
              <p className="text-white font-semibold leading-none">Meidi Dana</p>
              <p className="truncate text-[10px] text-white/50 mt-1 leading-none">admin@diklat.go.id</p>
            </div>
          </div>
        </div>
      </aside>

      {/* FLYOUT COLLAPSIBLE MASK ON MOBILE */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/45 z-30 md:hidden"
        />
      )}

      {/* CORE CONTENT CENTER */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* TOP COMPONENT HEADER NAVIGATION BAR */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sm:px-8 shrink-0 transition-colors duration-350">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-1.5 rounded-lg border dark:border-slate-750 cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center space-x-2 text-xs sm:text-sm">
              <span className="text-slate-800 dark:text-slate-200 font-bold tracking-tight text-sm sm:text-base capitalize">
                {activeTab === 'dashboard'
                  ? 'Dashboard Overview'
                  : activeTab === 'folders'
                  ? 'Folder Diklat'
                  : activeTab === 'participants'
                  ? 'Manajemen Peserta'
                  : activeTab === 'apps_script'
                  ? 'Apps Script Code'
                  : activeTab === 'telaah_masuk'
                  ? 'Telaah Surat Masuk'
                  : 'Verifikasi Sertifikat'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Cari sertifikat..."
                onClick={() => setActiveTab('participants')}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-full py-1.5 px-4 pl-9 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F4C81] dark:focus:ring-[#1E88E5] text-slate-700 dark:text-slate-200 dark:placeholder-slate-400 w-48 lg:w-64 cursor-pointer"
              />
              <span className="absolute left-3.5 top-1.5 opacity-40 dark:opacity-60 text-xs">🔍</span>
            </div>

            {/* THEME SWITCHER TOGGLE BUTTON */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title={theme === 'light' ? 'Nyalakan Dark Mode' : 'Nyalakan Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-4.5 w-4.5" />
              ) : (
                <Sun className="h-4.5 w-4.5 text-amber-400" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('verify')}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-250 transition-colors relative"
              title="Notifikasi Verifikasi"
            >
              🔔
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            </button>
          </div>
        </header>

        {/* ACTIVE MAIN VIEW PANEL (Individually Scrollable on Desktop) */}
        <main className="p-6 flex-1 overflow-y-auto space-y-6 bg-[#F5F7FA] dark:bg-slate-950 transition-colors duration-300">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={getStats()}
              onNavigate={(tab) => setActiveTab(tab)}
              recentFolders={folders.slice(0, 3)}
              recentPeserta={peserta.slice(0, 3)}
              suratList={suratList}
              primaryColor={primaryColor}
              onPrimaryColorChange={setPrimaryColor}
            />
          )}

          {activeTab === 'folders' && (
            <FoldersView
              folders={folders}
              onAddFolder={handleAddFolder}
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
              onUpdateTemplate={handleUpdateTemplate}
              onUpdateFolderConfig={handleUpdateFolderConfig}
            />
          )}

          {activeTab === 'participants' && (
            <ParticipantsView
              peserta={peserta}
              folders={folders}
              onAddPeserta={handleAddPeserta}
              onEditPeserta={handleEditPeserta}
              onDeletePeserta={handleDeletePeserta}
              onGenerateCert={handleGenerateCert}
              onImportPeserta={handleImportPeserta}
              appUrl={appUrl}
              onUpdateFolderConfig={handleUpdateFolderConfig}
            />
          )}

          {activeTab === 'apps_script' && <AppsScriptCenter />}

          {activeTab === 'telaah_masuk' && (
            <TelaahMasukView
              suratList={suratList}
              onAddSurat={handleAddSurat}
              onEditSurat={handleEditSurat}
              onDeleteSurat={handleDeleteSurat}
              onImportSuratList={handleImportSuratList}
              onExportSuratList={handleExportSuratList}
            />
          )}

          {activeTab === 'verify' && (
            <PublicVerifyView
              peserta={peserta}
              folders={folders}
              prefilledId={prefilledVerifyId}
            />
          )}
        </main>
      </div>

      {/* CUSTOM CONFIRM DIALOG OVERLAY */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left animate-fade-in">
            <div className="bg-rose-50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40 p-4 flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-950/30 rounded-full text-rose-650 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">{confirmModal.title}</h4>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{confirmModal.message}</p>
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 font-semibold cursor-pointer"
                >
                  {confirmModal.cancelText || 'Batal'}
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  {confirmModal.confirmText || 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT DIALOG OVERLAY */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40 p-4 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">{alertModal.title}</h4>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-slate-600 dark:text-slate-350 text-xs leading-relaxed">{alertModal.message}</p>
              <div className="flex justify-end text-xs">
                <button
                  type="button"
                  onClick={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-1.5 bg-[#0F4C81] dark:bg-[#1E88E5] hover:bg-[#1E88E5] text-white rounded-lg font-bold cursor-pointer animate-pulse"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
