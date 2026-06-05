import React, { useState } from 'react';
import { appsScriptFiles, AppsScriptFile } from '../appsScriptCode';
import { Clipboard, Check, ChevronRight, FileCode, HelpCircle, Download, BookOpen } from 'lucide-react';

export default function AppsScriptCenter() {
  const [activeFile, setActiveFile] = useState<AppsScriptFile>(appsScriptFiles[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'files' | 'guide'>('files');

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(activeFile.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      alert("Gagal menyalin otomatis. Silakan blokir teks kode di panel kanan lalu tekan Ctrl+C.");
    }
  };

  const handleDownloadFile = (file: AppsScriptFile) => {
    const ext = file.type === 'gs' ? 'gs' : (file.type === 'html' ? 'html' : 'md');
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Code Center Navigation/Instructions */}
      <div className="w-full xl:w-1/3 space-y-6">
        {/* Tab Selection */}
        <div className="bg-white rounded-xl shadow-xs border p-1.5 flex gap-1">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'files'
                ? 'bg-[#0F4C81] text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileCode className="h-4 w-4" />
            File Deploy Terlatih (6)
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'guide'
                ? 'bg-[#0F4C81] text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Panduan Pemasangan
          </button>
        </div>

        {activeTab === 'files' ? (
          /* File Selector List */
          <div className="bg-white rounded-xl shadow-xs border p-5">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Berkas Sumber Google Apps</h3>
            <p className="text-gray-500 text-[13px] leading-relaxed mb-4">
              Semua berkas di bawah dideklasifikasikan siap salin langsung ke panel ekpansi Apps Script untuk meluncurkan sistem Anda.
            </p>
            <div className="space-y-2">
              {appsScriptFiles.map((file) => (
                <button
                  key={file.name}
                  onClick={() => {
                    setActiveFile(file);
                    setCopied(false);
                  }}
                  className={`w-full text-left flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                    activeFile.name === file.name
                      ? 'border-[#0F4C81] bg-[#0F4C81]/5 shadow-2xs'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        file.type === 'gs'
                          ? 'bg-[#0F4C81]/10 text-[#0F4C81]'
                          : file.type === 'html'
                          ? 'bg-[#1E88E5]/10 text-[#1E88E5]'
                          : 'bg-[#00ACC1]/10 text-[#00ACC1]'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase">{file.type}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-gray-800 block">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-gray-400 d-block tracking-tight max-w-[200px] truncate">
                        {file.description}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-gray-400 mt-1 transition-transform ${activeFile.name === file.name ? 'rotate-90 text-[#0F4C81]' : ''}`} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Step by Step Guide Panel */
          <div className="bg-white rounded-xl shadow-xs border p-5 space-y-4">
            <h3 className="font-bold text-gray-800 text-lg border-b pb-2">Langkah Pemasangan Cepat</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                <div>
                  <h4 className="font-semibold text-sm text-gray-950 flex items-center gap-1.5">
                    Folder Google Drive Aktif
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Folder Google Drive penyimpanan sertifikat Anda telah diverifikasi pada ID:
                    <code className="bg-slate-100 text-slate-850 px-1.5 py-0.5 rounded font-mono font-semibold block mt-1.5 mb-1.5 select-all text-[10px] border border-slate-200/50 break-all">1dUcuP_LownZK-q6Cd4ecg94T9ZggHGXX</code>
                    <a 
                      href="https://drive.google.com/drive/folders/1dUcuP_LownZK-q6Cd4ecg94T9ZggHGXX" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[#0F4C81] hover:text-[#1E88E5] font-bold text-[11px] inline-flex items-center gap-1 mt-0.5 group"
                    >
                      Buka Google Drive Anda ↗
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-t pt-3.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1E88E5] text-white flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                <div>
                  <h4 className="font-semibold text-sm text-gray-950 flex items-center gap-1.5">
                    Google Spreadsheet Sinkron
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Sistem basis data terhubung ke fail Google Sheets Anda pada ID:
                    <code className="bg-slate-100 text-slate-850 px-1.5 py-0.5 rounded font-mono font-semibold block mt-1.5 mb-1.5 select-all text-[10px] border border-slate-200/50 break-all">1T8QxUuWna4T-YV7wPiYQendHGhmAgy13tXlYRm7P1mw</code>
                    <a 
                      href="https://docs.google.com/spreadsheets/d/1T8QxUuWna4T-YV7wPiYQendHGhmAgy13tXlYRm7P1mw/edit" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[#1E88E5] hover:text-[#0f4c81] font-bold text-[11px] inline-flex items-center gap-1 mt-0.5 group"
                    >
                      Buka Google Spreadsheet Database ↗
                    </a>
                    <span className="block text-[9.5px] text-slate-400 mt-1.5 italic">
                      *(Pilih menu <strong>Ekstensi</strong> &gt; <strong>Apps Script</strong> di dalam Sheets untuk menempelkan kode)*
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-t pt-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00ACC1] text-white flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">Salin Kode-Kode Program</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Buat file pilar di Apps Script editor dengan nama persis (misal: Code.gs, Index.html, Dashboard.html). Unduh atau salin kode masing-masing dari panel sebelah kanan.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-t pt-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">Jalankan Inisialisasi Database</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Pilih fungsi <code className="bg-gray-100 px-1 rounded">setupDatabase</code> di toolbar Apps Script, klik tombol <strong>Jalankan (Run)</strong>, dan setujui verifikasi izin keamanan akun Anda.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-t pt-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">5</span>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">Deploy Web Apps</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Klik <strong>Deploy</strong> &gt; <strong>New Deployment</strong>. Pilih jenis <strong>Web App</strong>. Setel akses tingkat publik (<code className="bg-gray-100 px-1 rounded">Anyone</code>), klik Deploy, lalu salin tautan Web Apps utama Anda!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Code Editor Preview Panel */}
      <div className="flex-1 bg-slate-900 rounded-xl shadow-md border border-slate-800 overflow-hidden flex flex-col min-h-[550px]">
        {/* Editor Ribbon header */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="flex h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span className="flex h-2.5 w-2.5 rounded-full bg-green-500" />
            <div className="h-4 w-[1px] bg-slate-800 mx-1" />
            <span className="font-mono text-xs text-slate-400 select-none flex items-center gap-1.5">
              <span className="text-[#00ACC1]">&lt;&gt;</span> {activeFile.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download file button */}
            <button
              onClick={() => handleDownloadFile(activeFile)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Unduh File
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0F4C81] hover:bg-[#1E88E5] text-white'
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
              {copied ? 'Tersalin!' : 'Salin Kode'}
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="p-5 flex-1 overflow-auto max-h-[600px] font-mono text-xs sm:text-[13px] leading-relaxed text-slate-300">
          <div className="bg-slate-950/40 p-4 border border-slate-800/40 rounded-lg mb-4 text-slate-400 italic">
            <div className="flex gap-2 items-center text-sm font-semibold text-[#00ACC1] mb-1">
              <HelpCircle className="h-4 w-4" />
              Keterangan File:
            </div>
            {activeFile.description}
          </div>
          <pre className="whitespace-pre overflow-x-auto text-left py-2 font-mono scrollbar-thin select-all">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
