import React, { useState } from 'react';
import { FolderDiklat, TemplateConfig, DEFAULT_TEMPLATE_CONFIG } from '../types';
import { FolderPlus, Trash2, Edit3, Image as ImageIcon, Check, Folder, Eye, Settings, RefreshCw } from 'lucide-react';
import CertificateLayout, { getEffectiveConfig } from './CertificateLayout';

interface FoldersViewProps {
  folders: FolderDiklat[];
  onAddFolder: (name: string) => void;
  onEditFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onUpdateTemplate: (id: string, url: string) => void;
  onUpdateFolderConfig: (id: string, config: TemplateConfig) => void;
}

export default function FoldersView({
  folders,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  onUpdateTemplate,
  onUpdateFolderConfig,
}: FoldersViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderDiklat | null>(null);

  const [formName, setFormName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');

  const templatePresets = [
    {
      name: "Modern Classic Ivory",
      url: "",
      color: "bg-amber-50 border-amber-200"
    },
    {
      name: "Navy Corporate Classic",
      url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1000",
      color: "bg-sky-950 border-sky-800"
    },
    {
      name: "Gold Emerald Achievement",
      url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000",
      color: "bg-emerald-950 border-emerald-800"
    },
    {
      name: "Vintage Coral Diploma",
      url: "https://images.unsplash.com/photo-1554034483-04fda0d3507b?auto=format&fit=crop&q=80&w=1000",
      color: "bg-orange-50 border-orange-200"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (isEditing) {
      onEditFolder(editingId, formName);
    } else {
      onAddFolder(formName);
    }

    setFormName('');
    setIsEditing(false);
    setShowAddModal(false);
  };

  const startEdit = (folder: FolderDiklat) => {
    setFormName(folder.name);
    setIsEditing(true);
    setEditingId(folder.id);
    setShowAddModal(true);
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFolder) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        // Draw image onto canvas to reduce size/dimension under 1000px and compress as JPEG
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDimension = 1000;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Save compressed as jpeg at 0.6 quality (looks decent for certificates and is very small ~ 30-70KB)
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.6);
            onUpdateTemplate(selectedFolder.id, compressedUrl);
          } else {
            onUpdateTemplate(selectedFolder.id, dataUrl);
          }
          setShowTemplateModal(false);
        };
        img.onerror = () => {
          onUpdateTemplate(selectedFolder.id, dataUrl);
          setShowTemplateModal(false);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-5 text-left">
      {/* High Density View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span className="p-1.5 bg-[#0F4C81]/10 text-[#0F4C81] rounded-md">
              <Folder className="h-4.5 w-4.5" />
            </span>
            <span>Alokasi Folder Pelatihan</span>
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Visualisasi pemetaan subfolder Google Drive dan kustomisasi rancangan template cetak sertifikat online
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setFormName('');
            setShowAddModal(true);
          }}
          className="bg-[#0F4C81] hover:bg-[#1E88E5] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span>+</span> Buat Folder Baru
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 p-6">
          <Folder className="h-10 w-10 text-slate-350 mx-auto" />
          <h4 className="font-bold text-slate-700 text-xs mt-3">Belum Ada Folder Terregistrasi</h4>
          <p className="text-slate-450 text-[11px] mt-1 max-w-sm mx-auto">
            Silakan tekan tombol &quot;Buat Folder Baru&quot; untuk menambahkan folder simulasi terhubung Google Drive Cloud.
          </p>
        </div>
      ) : (
        /* Dense Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {folders.map((folder) => {
            const hasTemplate = folder.templateUrl !== '';
            return (
              <div
                key={folder.id}
                className="border border-slate-200 rounded-xl bg-white hover:border-[#1E88E5]/50 hover:shadow-xs transition-all flex flex-col overflow-hidden"
              >
                {/* Image Banner styling */}
                <div
                  className="h-24 bg-slate-100 border-b border-slate-150 p-4 flex flex-col justify-between relative"
                  style={folder.templateUrl ? { backgroundImage: `url(${folder.templateUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 to-slate-900/10 pointer-events-none" />
                  <span className="relative z-10 font-mono text-[9px] font-bold text-[#00ACC1] bg-slate-950/40 px-2 py-0.5 rounded-full inline-block w-fit">
                    {folder.id}
                  </span>
                  <div className="relative z-10 space-y-0.5">
                    <h4 className="font-bold text-xs text-white truncate max-w-[280px]">
                      {folder.name}
                    </h4>
                    <span className="text-[9px] text-slate-300 block">
                      Dibuat: {folder.date}
                    </span>
                  </div>
                </div>

                {/* Sub Metadata info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Drive Subfolder ID:</span>
                      <span className="font-mono text-[10px] text-[#0F4C81] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded max-w-[170px] truncate block">
                        {folder.driveId}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Layout Background:</span>
                      {hasTemplate ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase text-[9px] flex items-center gap-0.5">
                          <Check className="h-2.5 w-2.5" /> AKTIF
                        </span>
                      ) : (
                        <span className="text-[#0F4C81] font-bold bg-[#0F4C81]/5 px-2 py-0.5 rounded border border-[#0F4C81]/15 uppercase text-[9px]">
                          STANDARD IVORY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Operational Toolbar */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 gap-1">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                      <button
                        onClick={() => {
                          setSelectedFolder(folder);
                          setShowTemplateModal(true);
                        }}
                        className="text-[10px] font-bold text-[#0F4C81] hover:text-[#1E88E5] flex items-center gap-1 py-1 px-2 rounded hover:bg-[#0F4C81]/5 transition-colors cursor-pointer shrink-0"
                        title="Atur gambar latar belakang cetak sertifikat"
                      >
                        <ImageIcon className="h-3 w-3" />
                        Background
                      </button>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(folder)}
                        className="p-1 rounded text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit nama pelatihan"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteFolder(folder.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-650 hover:bg-red-50/50 transition-colors cursor-pointer"
                        title="Hapus folder pelatihan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT DIKLAT FOLDER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-[#0F4C81] px-4.5 py-3.5 flex items-center justify-between border-b text-white">
              <h4 className="font-bold text-xs flex items-center gap-2">
                <FolderPlus className="h-4.5 w-4.5 text-[#00ACC1]" />
                {isEditing ? 'Ubah Informasi Folder' : 'Alokasi Program Baru'}
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white hover:opacity-85 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">Nama Program Diklat:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.5 focus:border-[#0F4C81] border border-slate-200 outline-none text-xs rounded-lg text-slate-800 transition-colors"
                  placeholder="Contoh: Pelatihan BTCLS Bencana 2026"
                />
                <span className="text-[10px] text-slate-450 leading-relaxed block">
                  Pendaftaran model ini secara simultan melahirkan token Drive folder acak di Spreadsheet.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-[11px] hover:bg-slate-50 border border-slate-200 rounded-md text-slate-500 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-[11px] bg-[#0F4C81] hover:bg-[#1E88E5] text-white rounded-md font-bold transition-colors cursor-pointer"
                >
                  {isEditing ? 'Ubah Data' : 'Buat Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD / SELECT TEMPLATE */}
      {showTemplateModal && selectedFolder && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-[#00ACC1] px-5 py-3.5 flex items-center justify-between border-b text-white">
              <span className="font-bold text-xs flex items-center gap-2">
                <ImageIcon className="h-4.5 w-4.5 text-white" />
                Upload Background Cetak
              </span>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-white hover:opacity-85 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-4 space-y-4 text-left">
              <div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Pasang lembaran sertifikat (PNG/JPG) untuk <strong className="text-slate-800">{selectedFolder.name}</strong>. Landscape ideal 1920x1080px.
                </p>
              </div>

              {/* Drag and Drop File Input Area */}
              <div className="p-5 border border-dashed border-[#00ACC1]/50 rounded-xl text-center bg-[#00ACC1]/3 hover:bg-[#00ACC1]/8 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileDrop}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <ImageIcon className="h-8 w-8 text-[#00ACC1] mx-auto mb-1.5" />
                <h5 className="font-bold text-[11px] text-slate-700">Tarik / Klik berkas visual background</h5>
                <span className="text-[9px] text-slate-400">PNG atau JPG, up to 2MB</span>
              </div>

              {/* Instants preset */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-wide">Pilihan Preset Instan:</h5>
                <div className="grid grid-cols-2 gap-2">
                  {templatePresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        onUpdateTemplate(selectedFolder.id, preset.url);
                        setShowTemplateModal(false);
                      }}
                      className="border border-slate-250 hover:border-[#00ACC1] rounded-lg p-2.5 text-left hover:bg-slate-50 transition-colors cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-3 h-3 rounded-full ${preset.color} border shrink-0`} />
                        <span className="font-bold text-[10px] text-slate-800 tracking-tight truncate block">{preset.name}</span>
                      </div>
                      <span className="text-[9px] text-[#00ACC1] font-bold self-end">
                        Pilih &gt;
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-[11px] rounded hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
