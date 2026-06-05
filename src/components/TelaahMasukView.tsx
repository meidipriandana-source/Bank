import React, { useState, useRef, useMemo } from 'react';
import { SuratDokumen } from '../types';
import {
  Inbox,
  Send,
  Plus,
  Trash2,
  Edit,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  X,
  FileText,
  AlertCircle,
  Folder,
  Calendar,
  Briefcase,
  Layers,
  Save,
  ChevronDown
} from 'lucide-react';

interface TelaahMasukViewProps {
  suratList: SuratDokumen[];
  onAddSurat: (surat: Omit<SuratDokumen, 'rowIndex' | 'id' | 'uploadDate'>, base64File: string, fileName?: string) => void;
  onEditSurat: (rowIndex: number, updated: Partial<SuratDokumen>) => void;
  onDeleteSurat: (rowIndex: number) => void;
  onImportSuratList: (csvText: string) => void;
  onExportSuratList: () => void;
}

export default function TelaahMasukView({
  suratList,
  onAddSurat,
  onEditSurat,
  onDeleteSurat,
  onImportSuratList,
  onExportSuratList
}: TelaahMasukViewProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Surat Masuk' | 'Surat Keluar'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Active items for mutations
  const [activePreviewDoc, setActivePreviewDoc] = useState<SuratDokumen | null>(null);
  const [activeEditDoc, setActiveEditDoc] = useState<SuratDokumen | null>(null);
  const [activeDeleteDoc, setActiveDeleteDoc] = useState<SuratDokumen | null>(null);

  // Form input States for Add
  const [addForm, setAddForm] = useState({
    docName: '',
    suratType: 'Surat Masuk' as 'Surat Masuk' | 'Surat Keluar',
    suratNo: '',
    entryDate: new Date().toISOString().slice(0, 10),
    employee: '',
    division: '',
    desc: ''
  });
  const [uploadedBase64, setUploadedBase64] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form input States for Edit
  const [editForm, setEditForm] = useState({
    docName: '',
    suratType: 'Surat Masuk' as 'Surat Masuk' | 'Surat Keluar',
    suratNo: '',
    entryDate: '',
    employee: '',
    division: '',
    desc: ''
  });

  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  // Filtered List
  const filteredList = useMemo(() => {
    return suratList.filter((doc) => {
      const matchesSearch =
        doc.docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.suratNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.division.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'all' || doc.suratType === filterType;

      return matchesSearch && matchesType;
    });
  }, [suratList, searchQuery, filterType]);

  // Statistics
  const stats = useMemo(() => {
    const total = suratList.length;
    const masuk = suratList.filter((d) => d.suratType === 'Surat Masuk').length;
    const keluar = suratList.filter((d) => d.suratType === 'Surat Keluar').length;
    return { total, masuk, keluar };
  }, [suratList]);

  // File Upload Handlers (Local Simulation and Base64 parsing)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Maaf, sistem hanya mendukung format PDF untuk berkas otentik.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setUploadedBase64(evt.target.result as string);
        setUploadedFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.docName || !addForm.suratNo || !addForm.employee || !addForm.division) {
      alert('Mohon lengkapi semua kolom wajib bintang (*)');
      return;
    }

    onAddSurat(addForm, uploadedBase64, uploadedFileName);

    // Reset Form
    setAddForm({
      docName: '',
      suratType: 'Surat Masuk',
      suratNo: '',
      entryDate: new Date().toISOString().slice(0, 10),
      employee: '',
      division: '',
      desc: ''
    });
    setUploadedBase64('');
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditDoc) return;

    onEditSurat(activeEditDoc.rowIndex, editForm);
    setIsEditModalOpen(false);
    setActiveEditDoc(null);
  };

  const handleOpenEdit = (doc: SuratDokumen) => {
    setActiveEditDoc(doc);
    setEditForm({
      docName: doc.docName,
      suratType: doc.suratType,
      suratNo: doc.suratNo,
      entryDate: doc.entryDate,
      employee: doc.employee,
      division: doc.division,
      desc: doc.desc
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteConfirm = (doc: SuratDokumen) => {
    setActiveDeleteDoc(doc);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteExecute = () => {
    if (activeDeleteDoc) {
      onDeleteSurat(activeDeleteDoc.rowIndex);
      setIsDeleteConfirmOpen(false);
      setActiveDeleteDoc(null);
    }
  };

  const handleImportCSVClick = () => {
    if (restoreFileInputRef.current) {
      restoreFileInputRef.current.click();
    }
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      'PERINGATAN: Mengunggah berkas CSV ini akan menimpa data yang ada. Apakah Anda ingin melanjutkan?'
    );
    if (!confirmRestore) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        onImportSuratList(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Generate generic document URL for display fellbacks if no real pdf is uploaded
  const getDocumentPreviewUrl = (doc: SuratDokumen) => {
    if (doc.link && doc.link.startsWith('data:application/pdf')) {
      return doc.link;
    }

    // fallback html document layout if there is no authentic PDF
    const embedContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Poppins', sans-serif; padding: 40px; color: #1e293b; background: #f8fafc; }
            .letter-card { background: white; max-width: 700px; margin: 0 auto; padding: 50px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header-banner { text-align: center; border-bottom: 3px double #0f4c81; padding-bottom: 15px; margin-bottom: 30px; }
            .header-banner h2 { margin: 0; color: #0f4c81; text-transform: uppercase; font-size: 20px; }
            .header-banner p { margin: 2px 0; font-size: 11px; color: #64748b; font-weight: 500; }
            .letter-meta { display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 25px; line-height: 1.6; }
            .letter-title { text-align: center; font-weight: bold; font-size: 15px; text-decoration: underline; margin-bottom: 5px; color: #0f4c81; }
            .letter-no { text-align: center; font-size: 11px; color: #475569; font-family: monospace; margin-bottom: 30px; font-weight: bold; }
            .letter-body { text-align: justify; font-size: 13px; line-height: 1.8; color: #334155; min-height: 250px; }
            .letter-footer { margin-top: 50px; display: flex; justify-content: flex-end; }
            .signature-block { text-align: center; font-size: 12px; width: 220px; line-height: 1.5; }
            .signature-name { font-weight: bold; text-decoration: underline; margin-top: 60px; text-transform: uppercase; }
            .signature-info { color: #64748b; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="letter-card">
            <div class="header-banner">
              <h2>PELAYANAN PER-SURATAN DIKLAT RSUD</h2>
              <p>JL. Pasir Putih No. 12 Sengkawit, Tanjung Selor, Provinsi Kalimantan Utara</p>
              <p>Email: admin.diklat@rsud.jusuf-sk.go.id | Telp: (0552) 21151</p>
            </div>
            <div class="letter-meta">
              <div>
                <strong>Nomor:</strong> ${doc.suratNo}<br/>
                <strong>Sifat:</strong> Segera / Penting<br/>
                <strong>Hal:</strong> ${doc.docName}
              </div>
              <div>
                <strong>Tanggal:</strong> ${doc.entryDate}<br/>
                <strong>Bagian:</strong> ${doc.division}
              </div>
            </div>
            <div class="letter-title">${doc.docName.toUpperCase()}</div>
            <div class="letter-no">Nomor Dokumen Sistem: ${doc.id}</div>
            <div class="letter-body">
              Dengan hormat,<br/>
              Melalui lembar penelaahan dokumen ini, Bagian Pendidikan dan Pelatihan RSUD mengesahkan bahwa dokumen mengenai program pendidikan berkelanjutan berikut telah diverifikasi dan dicatat dalam instrumen pembukuan sistem.<br/><br/>
              Detail data terekam:<br/>
              - <strong>Nama Dokumen:</strong> ${doc.docName}<br/>
              - <strong>Kategori Berkas:</strong> ${doc.suratType}<br/>
              - <strong>Pegawai Terkait:</strong> ${doc.employee}<br/>
              - <strong>Unit Kerja / Divisi:</strong> ${doc.division}<br/>
              - <strong>Tanggal Pencatatan:</strong> ${doc.entryDate}<br/>
              - <strong>Keterangan / Telaah Tambahan:</strong> ${doc.desc || '-'}<br/><br/>
              Demikian lembar telaahan persuratan diklat ini dibuat dengan sebenar-benarnya untuk digunakan sebagaimana mestinya.
            </div>
            <div class="letter-footer">
              <div class="signature-block">
                Tanjung Selor, ${doc.entryDate}<br/>
                <strong>Verifikator Diklat,</strong>
                <div class="signature-name">${doc.employee}</div>
                <div class="signature-info">${doc.division}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return `data:text/html;charset=utf-8,${encodeURIComponent(embedContent)}`;
  };

  return (
    <div className="space-y-6 text-left">
      {/* SECTION HEADER CARDS STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center transition-all hover:shadow-md">
          <div className="p-4 bg-blue-100 dark:bg-blue-950/40 text-[#0F4C81] dark:text-sky-400 rounded-xl mr-4 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-450 text-xs font-semibold uppercase tracking-wider">Total Dokumen</p>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center transition-all hover:shadow-md">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-xl mr-4 shrink-0">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-450 text-xs font-semibold uppercase tracking-wider">Surat Masuk</p>
            <h3 className="text-2xl font-extrabold text-[#15803D] dark:text-emerald-400 mt-1">{stats.masuk}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex items-center transition-all hover:shadow-md">
          <div className="p-4 bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-450 rounded-xl mr-4 shrink-0">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-450 text-xs font-semibold uppercase tracking-wider">Surat Keluar</p>
            <h3 className="text-2xl font-extrabold text-orange-600 dark:text-orange-450 mt-1">{stats.keluar}</h3>
          </div>
        </div>
      </div>

      {/* SEARCH RIBBON & ACTION CONTROLS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 dark:border-slate-750 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none text-xs rounded-lg transition-colors placeholder-slate-405 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 hover:border-slate-300 dark:hover:border-slate-700"
              placeholder="Cari nama dokumen, nomor surat, pegawai..."
            />
          </div>

          {/* Type dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-750 focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81] outline-none text-xs rounded-lg font-semibold text-slate-800 dark:text-slate-200 transition-colors bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            >
              <option value="all">Semua Jenis Berkas</option>
              <option value="Surat Masuk">✉️ Surat Masuk</option>
              <option value="Surat Keluar">📤 Surat Keluar</option>
            </select>
          </div>
        </div>

        {/* Toolbar operations */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <button
            onClick={onExportSuratList}
            className="flex-1 sm:flex-none border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Ekspor CSV database persuratan"
          >
            <Download className="h-4 w-4 text-slate-550" />
            Backup CSV
          </button>

          <button
            onClick={handleImportCSVClick}
            className="flex-1 sm:flex-none border border-purple-200 dark:border-purple-900/40 bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/35 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Sertakan CSV pemulihan database"
          >
            <Upload className="h-4 w-4 text-purple-500" />
            Restore CSV
          </button>
          
          <input
            type="file"
            ref={restoreFileInputRef}
            onChange={handleCSVFileChange}
            accept=".csv"
            className="hidden"
          />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none bg-[#0F4C81] dark:bg-[#1E88E5] hover:bg-[#1E88E5] text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Upload Dokumen
          </button>
        </div>
      </div>

      {/* CORE DATA RECORDS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Informasi Dokumen</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Jenis & Nomor Surat</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pegawai Terkait</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tanggal & Upload</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filteredList.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/35 transition-colors">
                  {/* DOC NAME & ID */}
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="h-9 w-9 bg-rose-50 dark:bg-rose-950/20 rounded-lg flex items-center justify-center text-rose-500 dark:text-rose-400 mr-3 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-150 line-clamp-1">{doc.docName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{doc.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* SURAT TYPE & NO */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                        doc.suratType === 'Surat Masuk'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-150 dark:border-emerald-900/30'
                          : 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-150 dark:border-orange-900/30'
                      }`}
                    >
                      {doc.suratType === 'Surat Masuk' ? '✉️ Masuk' : '📤 Keluar'}
                    </span>
                    <div className="text-[10px] sm:text-[11px] mt-1 font-mono text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                      {doc.suratNo}
                    </div>
                  </td>

                  {/* EMPLOYEE & DEPT */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      {doc.employee}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{doc.division}</div>
                  </td>

                  {/* DATES */}
                  <td className="px-6 py-4">
                    <div className="text-slate-700 dark:text-slate-300 font-medium">{doc.entryDate}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Up: {doc.uploadDate}</div>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(doc)}
                        className="p-1 px-1.5 text-[#0F4C81] dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Edit metadata surat"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setActivePreviewDoc(doc);
                          setIsPreviewModalOpen(true);
                        }}
                        className="p-1 px-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Pratinjau fisik dokumen"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenDeleteConfirm(doc)}
                        className="p-1 px-1.5 text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-colors"
                        title="Hapus berkas permanen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    Belum ada surat pelatihan dengan rincian ini terekam.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD DOCUMENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800 flex flex-col text-left transition-colors">
            {/* Header */}
            <div className="bg-[#0F4C81] dark:bg-slate-950 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h4 className="font-bold text-sm">Registrasi Surat Training & Diklat</h4>
                <p className="text-[10px] text-white/70">Wajibkan verifikasi metadata dalam instrumen arsip digital</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* File upload */}
              <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-1.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <FileText className="h-8 w-8 text-slate-400 mx-auto" />
                <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  {uploadedFileName ? 'Unggahan Berhasil' : 'Unggah Fisik Dokumen (PDF)'}
                </h5>
                <p className="text-[10px] text-slate-450 leading-relaxed">
                  {uploadedFileName ? `${uploadedFileName} terekam` : 'Penyandian format base64 langsung dalam database lokal'}
                </p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                  id="pdf-upload-file-picker"
                  ref={fileInputRef}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-[10px] font-bold text-[#0F4C81] border border-slate-200 dark:border-slate-700 hover:bg-slate-150 px-2.5 py-1 rounded bg-white dark:bg-slate-800 dark:text-sky-450 cursor-pointer"
                >
                  {uploadedFileName ? 'Ganti Berkas PDF' : 'Pilih Berkas PDF Asli'}
                </button>
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Dokumen / Perihal *</label>
                  <input
                    type="text"
                    required
                    value={addForm.docName}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, docName: e.target.value }))}
                    className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 outline-none text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Contoh: Nota Dinas Pengajuan Izin Belajar"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jenis Kategori Berkas *</label>
                  <select
                    value={addForm.suratType}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, suratType: e.target.value as any }))}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-750 focus:border-[#0F4C81] outline-none text-xs rounded-lg font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="Surat Masuk">✉️ Surat Masuk</option>
                    <option value="Surat Keluar">📤 Surat Keluar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nomor Surat Resmi *</label>
                  <input
                    type="text"
                    required
                    value={addForm.suratNo}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, suratNo: e.target.value }))}
                    className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 outline-none text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100 font-mono"
                    placeholder="Contoh: 005/214/DIKLAT-UP/2026"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tanggal Pencatatan / Surat *</label>
                  <input
                    type="date"
                    required
                    value={addForm.entryDate}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, entryDate: e.target.value }))}
                    className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 outline-none text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pegawai Yang Mengajukan *</label>
                  <input
                    type="text"
                    required
                    value={addForm.employee}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, employee: e.target.value }))}
                    className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 outline-none text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Contoh: dr. Setiawan, Sp.An"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Unit / Divisi Kerja *</label>
                  <input
                    type="text"
                    required
                    value={addForm.division}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, division: e.target.value }))}
                    className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 outline-none text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Contoh: Instalasi ICU dsk"
                  />
                </div>
              </div>

              <div className="space-y-1 pb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Keterangan Tambahan / Disposisi</label>
                <textarea
                  value={addForm.desc}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, desc: e.target.value }))}
                  className="w-full p-2.5 outline-none focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100 h-20 leading-relaxed resize-none"
                  placeholder="Isikan catatan disposisi, instruksi penting, atau rangkuman pokok surat..."
                />
              </div>

              {/* Actions footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs leading-none font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#0F4C81] hover:bg-[#1E88E5] text-white rounded-lg text-xs font-bold leading-none flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan Arsip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DOCUMENT */}
      {isEditModalOpen && activeEditDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-scaleIn border border-slate-200 dark:border-slate-800 flex flex-col text-left transition-colors">
            {/* Header */}
            <div className="bg-[#0F4C81] dark:bg-slate-950 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h4 className="font-bold text-sm">Edit Metadata Berkas Training</h4>
                <p className="text-[10px] text-white/70">Perbarui nilai rincian data terekam di baris: {activeEditDoc.rowIndex}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Grid Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Dokumen / Perihal *</label>
                  <input
                    type="text"
                    required
                    value={editForm.docName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, docName: e.target.value }))}
                    className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 outline-none text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jenis Kategori Berkas *</label>
                  <select
                    value={editForm.suratType}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, suratType: e.target.value as any }))}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-750 focus:border-[#0F4C81] outline-none text-xs rounded-lg font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="Surat Masuk">✉️ Surat Masuk</option>
                    <option value="Surat Keluar">📤 Surat Keluar</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nomor Surat Resmi *</label>
                  <input
                    type="text"
                    required
                    value={editForm.suratNo}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, suratNo: e.target.value }))}
                    className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 outline-none text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tanggal Pencatatan / Surat *</label>
                  <input
                    type="date"
                    required
                    value={editForm.entryDate}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, entryDate: e.target.value }))}
                    className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 outline-none text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pegawai Yang Mengajukan *</label>
                  <input
                    type="text"
                    required
                    value={editForm.employee}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, employee: e.target.value }))}
                    className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 outline-none text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Unit / Divisi Kerja *</label>
                  <input
                    type="text"
                    required
                    value={editForm.division}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, division: e.target.value }))}
                    className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 outline-none text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1 pb-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Keterangan Tambahan / Disposisi</label>
                <textarea
                  value={editForm.desc}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, desc: e.target.value }))}
                  className="w-full p-2.5 outline-none focus:border-[#0F4C81] border border-slate-200 dark:border-slate-750 text-xs rounded-lg text-slate-800 dark:bg-slate-800 dark:text-slate-100 h-20 leading-relaxed resize-none"
                />
              </div>

              {/* Actions footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs leading-none font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#0F4C81] hover:bg-[#1E88E5] text-white rounded-lg text-xs font-bold leading-none flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PREVIEW DOCUMENT */}
      {isPreviewModalOpen && activePreviewDoc && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[820px] h-[85vh] flex flex-col overflow-hidden border border-slate-250 dark:border-slate-800 transition-colors animate-scaleIn">
            <div className="px-6 py-4.5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white">
              <div className="text-left">
                <h3 className="font-bold text-xs sm:text-sm line-clamp-1">{activePreviewDoc.docName}</h3>
                <span className="text-[10px] text-slate-405 font-mono">Kode Arsip: {activePreviewDoc.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getDocumentPreviewUrl(activePreviewDoc)}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0F4C81] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-[#1E88E5] transition-colors flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> Unduh Berkas
                </a>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1 px-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 overflow-hidden relative">
              <iframe
                src={getDocumentPreviewUrl(activePreviewDoc)}
                className="w-full h-full rounded-lg border border-slate-200 bg-white"
                frameBorder="0"
                title={`Arsip_${activePreviewDoc.id}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
      {isDeleteConfirmOpen && activeDeleteDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 text-center p-6 animate-scaleIn transition-colors">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 text-rose-600 dark:text-rose-400 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 leading-none">Hapus Arsip Pelatihan?</h3>
            <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed mb-6 px-1">
              Dokumen <strong className="text-slate-700 dark:text-slate-200">{activeDeleteDoc.docName}</strong> ({activeDeleteDoc.id}) beserta fisik file terekam akan terhapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setActiveDeleteDoc(null);
                }}
                className="px-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteExecute}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
