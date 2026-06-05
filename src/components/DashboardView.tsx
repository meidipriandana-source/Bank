import React from 'react';
import { DashboardStats, FolderDiklat, Peserta, SuratDokumen } from '../types';
import { Folder, Award, Users, BookOpen, ChevronRight, Activity, Cpu, Palette, Inbox } from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats;
  onNavigate: (view: 'folders' | 'participants' | 'apps_script' | 'verify' | 'telaah_masuk') => void;
  recentFolders: FolderDiklat[];
  recentPeserta: Peserta[];
  suratList: SuratDokumen[];
  primaryColor: string;
  onPrimaryColorChange: (color: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Classic Blue', value: '#0F4C81', label: 'Biru RSUD' },
  { name: 'Teal Medic', value: '#008080', label: 'Hijau Toska' },
  { name: 'Government Green', value: '#15803D', label: 'Hijau Dinas' },
  { name: 'Emergency Orange', value: '#D97706', label: 'Oranye' },
  { name: 'Crimson Red', value: '#B91C1C', label: 'Merah' },
  { name: 'Modern Indigo', value: '#6366F1', label: 'Indigo' },
  { name: 'Slate Gray', value: '#475569', label: 'Abu-Abu' }
];

export default function DashboardView({ 
  stats, 
  onNavigate, 
  recentFolders, 
  recentPeserta,
  suratList,
  primaryColor,
  onPrimaryColorChange
}: DashboardViewProps) {
  const percentPublished = stats.totalParticipants > 0 ? Math.round((stats.totalPublished / stats.totalParticipants) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* HIGH DENSITY STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0 text-left">
        {/* STAT 1: FOLDERS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Folder Diklat</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F4C81] dark:text-sky-400 mt-1">{stats.totalFolders}</h3>
            </div>
            <div className="bg-[#0F4C81]/10 dark:bg-sky-500/10 p-2.5 rounded-lg text-[#0F4C81] dark:text-sky-400">
              <Folder className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-semibold mt-3 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sinkron Google Drive
          </p>
        </div>

        {/* STAT 2: PARTICIPANTS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Peserta</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1E88E5] dark:text-blue-400 mt-1">{stats.totalParticipants}</h3>
            </div>
            <div className="bg-[#1E88E5]/10 dark:bg-blue-500/10 p-2.5 rounded-lg text-[#1E88E5] dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-[#00ACC1] dark:text-cyan-400 font-semibold mt-3 uppercase tracking-wider">Terdaftar Aktif</p>
        </div>

        {/* STAT 3: REGISTERED CERTS (REPLACED WITH CORRESPONDENCE) */}
        <div 
          onClick={() => onNavigate('telaah_masuk')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all hover:shadow-md cursor-pointer text-left"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-405 text-xs font-semibold uppercase tracking-wider">Surat Masuk & Keluar</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{suratList.length} Berkas</h3>
            </div>
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-2.5 rounded-lg text-emerald-600 dark:text-emerald-420">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-3 uppercase tracking-wider">
            ✉️ {suratList.filter(s => s.suratType === 'Surat Masuk').length} Masuk | 📤 {suratList.filter(s => s.suratType === 'Surat Keluar').length} Keluar
          </p>
        </div>

        {/* STAT 4: PUBLISHED CERTS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Sertifikat Terbit</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-orange-500 dark:text-orange-400 mt-1">{percentPublished}%</h3>
            </div>
            <div className="bg-orange-50 dark:bg-orange-500/10 p-2.5 rounded-lg text-orange-500 dark:text-orange-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4">
            <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${percentPublished}%` }}></div>
          </div>
        </div>
      </div>

      {/* CORE DOUBLE COLUMNS MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: FOLDER TABLE AND ALUR */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          
          {/* HIGH DENSITY FOLDER TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col min-h-0 text-left transition-colors duration-300">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Folder Pelatihan Terbaru</h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-505">Direktori program belajar terhubung awan google cloud</span>
              </div>
              <button
                onClick={() => onNavigate('folders')}
                className="bg-[#0F4C81] dark:bg-[#1E88E5] hover:bg-[#1E88E5] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>+</span> Buat Baru
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-850/50">
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Program Pelatihan</th>
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Google Drive ID</th>
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-2.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentFolders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-xs text-slate-400">
                        Belum ada folder diklat teralokasikan.
                      </td>
                    </tr>
                  ) : (
                    recentFolders.map((folder) => (
                      <tr key={folder.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">📁</span>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{folder.name}</p>
                              <p className="text-[10px] text-slate-400">Dibuat: {folder.date}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-[10px] text-[#0F4C81] dark:text-sky-400 max-w-[120px] truncate">
                          {folder.driveId}
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-full text-[9px] font-bold uppercase">
                            CONNECTED
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => onNavigate('participants')}
                            className="text-[#1E88E5] dark:text-sky-400 hover:text-[#0F4C81] dark:hover:text-sky-300 hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            Kelola
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROADMAP ALUR PENERBITAN */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 text-left transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-[#0F4C81] dark:text-sky-450" />
                <h4 className="font-bold text-slate-800 dark:text-slate-105 text-sm">Alur Penerbitan Berkas Kredensial</h4>
              </div>
              <span className="text-[10px] font-bold bg-[#1E88E5]/10 dark:bg-blue-500/15 text-[#1E88E5] dark:text-blue-400 px-2 py-0.5 rounded-full uppercase">
                Otomatisasi Cloud
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/65 border border-slate-100 dark:border-slate-800/50 rounded-lg flex flex-col items-center justify-center">
                <span className="w-5.5 h-5.5 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[11px] font-bold mb-2 shadow-xs">1</span>
                <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 mb-0.5">Buat Folder</p>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                  Alokasi folder penyimpanan utama
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/65 border border-slate-100 dark:border-slate-800/50 rounded-lg flex flex-col items-center justify-center">
                <span className="w-5.5 h-5.5 rounded-full bg-[#1E88E5] text-white flex items-center justify-center text-[11px] font-bold mb-2 shadow-xs">2</span>
                <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 mb-0.5">Template</p>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                  Simpan visual background custom
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/65 border border-slate-100 dark:border-slate-800/50 rounded-lg flex flex-col items-center justify-center">
                <span className="w-5.5 h-5.5 rounded-full bg-[#00ACC1] text-white flex items-center justify-center text-[11px] font-bold mb-2 shadow-xs">3</span>
                <p className="font-bold text-[11px] text-slate-800 dark:text-slate-200 mb-0.5">Add Peserta</p>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                  Input manual / bulk upload CSV
                </span>
              </div>

              <div className="p-3 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-lg flex flex-col items-center justify-center">
                <span className="w-5.5 h-5.5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[11px] font-bold mb-2 shadow-xs">4</span>
                <p className="font-bold text-[11px] text-orange-850 dark:text-orange-300 mb-0.5">Rilis Ke Atas</p>
                <span className="text-[9px] text-orange-600 dark:text-orange-400 leading-tight">
                  Satu klik terbitkan lembaran valid
                </span>
              </div>
            </div>

            <div className="bg-[#0F4C81]/5 dark:bg-[#0F4C81]/15 rounded-xl p-3.5 flex gap-3 items-center">
              <span className="text-lg">💡</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                <strong>Tips Apps Script:</strong> Tempatkan file <code className="bg-[#0F4C81]/10 dark:bg-[#1E88E5]/20 px-1 rounded text-[#0F4C81] dark:text-[#1E88E5] font-bold font-mono">Code.gs</code> di Editor Ekstensi Sheets Anda untuk singkronisasi subfolder Drive yang ultra responsif secara instan.
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: NAV MENU, ACTIVITY LOG, & VERIFICATION COMPONENT */}
        <div className="space-y-6 flex flex-col justify-start">
          
          {/* BRANDING COLOR PICKER PANEL */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col text-left transition-colors duration-300">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
              <Palette className="h-4.5 w-4.5 text-[#0F4C81]" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Tema & Branding Kustom</h3>
                <p className="text-[9px] text-slate-400 dark:text-slate-550 font-semibold uppercase tracking-wider">Visual Identity Setting</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Presets Grid */}
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Preset Warna Instansi:</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isActive = primaryColor.toLowerCase() === preset.value.toLowerCase();
                    return (
                      <button
                        key={preset.value}
                        onClick={() => onPrimaryColorChange(preset.value)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750'
                        }`}
                        title={preset.name}
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0 shadow-xs" 
                          style={{ backgroundColor: preset.value }}
                        />
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom hex selector using native inputs */}
              <div className="pt-3 border-t border-dashed border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Pilih Warna Kustom:</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none">Masukkan kode warna institusi Anda</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] font-bold text-slate-500 border border-slate-200 bg-slate-50/50 px-1.5 py-0.5 rounded shadow-3xs select-all uppercase">
                    {primaryColor}
                  </span>
                  
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-3xs shrink-0 cursor-pointer hover:scale-105 transition-transform">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => onPrimaryColorChange(e.target.value)}
                      className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer opacity-100 scale-150"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK NAV MENU */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 flex flex-col text-left transition-colors duration-300">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
              <Activity className="h-4.5 w-4.5 text-[#1E88E5] dark:text-blue-400" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Navigasi Cepat Portal</h3>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('folders')}
                className="w-full text-left p-2.5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-[#0F4C81]/5 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between transition-all group cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-1.5 bg-[#0F4C81]/10 dark:bg-[#0F4C81]/25 text-[#0F4C81] dark:text-sky-400 rounded-md">
                    <Folder className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold text-[11px] sm:text-xs text-slate-800 dark:text-slate-200">
                    Manajemen Folder Diklat
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 group-hover:text-[#0F4C81] dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('participants')}
                className="w-full text-left p-2.5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-[#1E88E5]/5 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between transition-all group cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-1.5 bg-[#1E88E5]/10 dark:bg-[#1E88E5]/25 text-[#1E88E5] dark:text-blue-400 rounded-md">
                    <Users className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold text-[11px] sm:text-xs text-slate-800 dark:text-slate-200">
                    Sertifikasi & Peserta Roster
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 group-hover:text-[#1E88E5] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('apps_script')}
                className="w-full text-left p-2.5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-[#00ACC1]/5 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between transition-all group cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-1.5 bg-[#00ACC1]/10 dark:bg-[#00ACC1]/25 text-[#00ACC1] dark:text-cyan-400 rounded-md">
                    <Cpu className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold text-[11px] sm:text-xs text-slate-800 dark:text-slate-200">
                    Dapatkan Berkas Integrasi GAS
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 group-hover:text-[#00ACC1] dark:group-hover:text-cyan-305 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('telaah_masuk')}
                className="w-full text-left p-2.5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-emerald-500/5 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between transition-all group cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <span className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-md">
                    <Inbox className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-semibold text-[11px] sm:text-xs text-slate-800 dark:text-slate-200">
                    Telaah Surat Masuk / Keluar
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-emerald-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* LIVE ACTIVITY LOGGER */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs text-left space-y-3 transition-colors duration-300">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-800 pb-2">Log Aktivitas Kepegawaian</h3>
            <div className="space-y-3.5">
              {recentPeserta.slice(0, 3).map((p) => {
                const isIssued = p.sertifikat !== null;
                return (
                  <div key={p.id} className="flex space-x-3 text-xs leading-normal">
                    <div className={`w-2 h-2 rounded-full ${isIssued ? 'bg-emerald-500' : 'bg-amber-400'} mt-1.5 shrink-0`}></div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {isIssued ? 'Sertifikat Diterbitkan' : 'Pendaftaran Roster'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{p.name}</p>
                      <code className="text-[9px] text-[#0F4C81] dark:text-sky-400 font-mono break-all font-semibold block">{p.noSertifikat}</code>
                    </div>
                  </div>
                );
              })}
              {recentPeserta.length === 0 && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Belum ada aktivitas kepegawaian terekam.</p>
              )}
            </div>
          </div>

          {/* BLUE CALLOUT BOX: VERIFICATION AD */}
          <div className="bg-[#0F4C81] dark:bg-slate-900 border dark:border-slate-800 text-white p-5 rounded-xl shadow-md relative overflow-hidden text-left shrink-0">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 dark:bg-slate-800/10 rounded-full pointer-events-none"></div>
            <h3 className="font-bold text-sm relative z-10 flex items-center gap-2">
              <span>🛡️</span> Link Verifikasi Cepat
            </h3>
            <p className="text-[10px] text-white/70 dark:text-slate-300 mt-1 mb-4 relative z-10 leading-relaxed">
              Gunakan simulator pembaca QR Code validator kami untuk pengujian integritas sertifikat.
            </p>
            
            <div
              onClick={() => onNavigate('verify')}
              className="bg-white dark:bg-slate-800 p-2.5 rounded-lg inline-block relative z-10 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <div className="w-20 h-20 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <div className="grid grid-cols-4 gap-1">
                  <div className="w-3.5 h-3.5 bg-slate-850 dark:bg-slate-200"></div>
                  <div className="w-3.5 h-3.5 bg-transparent"></div>
                  <div className="w-3.5 h-3.5 bg-slate-850 dark:bg-slate-200"></div>
                  <div className="w-3.5 h-3.5 bg-slate-850 dark:bg-slate-200"></div>
                  
                  <div className="w-3.5 h-3.5 bg-transparent"></div>
                  <div className="w-3.5 h-3.5 bg-slate-850 dark:bg-slate-200"></div>
                  <div className="w-3.5 h-3.5 bg-transparent"></div>
                  <div className="w-3.5 h-3.5 bg-transparent"></div>
                  
                  <div className="w-3.5 h-3.5 bg-slate-850 dark:bg-slate-200"></div>
                  <div className="w-3.5 h-3.5 bg-transparent"></div>
                  <div className="w-3.5 h-3.5 bg-slate-850 dark:bg-slate-200"></div>
                  <div className="w-3.5 h-3.5 bg-slate-850 dark:bg-slate-200"></div>
                  
                  <div className="w-3.5 h-3.5 bg-slate-850 dark:bg-slate-200"></div>
                  <div className="w-3.5 h-3.5 bg-slate-850 dark:bg-slate-200"></div>
                  <div className="w-3.5 h-3.5 bg-transparent"></div>
                  <div className="w-3.5 h-3.5 bg-slate-850 dark:bg-slate-200"></div>
                </div>
              </div>
            </div>
            
            <p className="text-[9px] mt-3.5 font-mono opacity-80 block tracking-tight">
              uji-sim.link/validator-secure
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
