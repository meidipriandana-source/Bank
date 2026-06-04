import React, { useState, useEffect } from 'react';
import { Peserta, FolderDiklat } from '../types';
import { ShieldCheck, ShieldAlert, Download, AlertTriangle } from 'lucide-react';
import CertificateLayout, { isCertExpired, getValidityInfo } from './CertificateLayout';

interface PublicVerifyViewProps {
  peserta: Peserta[];
  folders: FolderDiklat[];
  prefilledId?: string;
}

export default function PublicVerifyView({ peserta, folders, prefilledId }: PublicVerifyViewProps) {
  const [searchId, setSearchId] = useState<string>(prefilledId || '');
  const [verifiedPeserta, setVerifiedPeserta] = useState<Peserta | null>(null);
  const [tried, setTried] = useState<boolean>(false);
  const [appUrl, setAppUrl] = useState<string>('https://script.google.com/macros/s/AKfycbx_placeholder/exec');

  useEffect(() => {
    if (window.location.origin) {
      setAppUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (prefilledId) {
      handleVerify(prefilledId);
    }
  }, [prefilledId, peserta]);

  const handleVerify = (idToVerify: string) => {
    setTried(true);
    if (!idToVerify.trim()) {
      setVerifiedPeserta(null);
      return;
    }

    const found = peserta.find((p) => p.sertifikat?.id.toUpperCase() === idToVerify.trim().toUpperCase());
    if (found && found.sertifikat) {
      setVerifiedPeserta(found);
    } else {
      setVerifiedPeserta(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(searchId);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 text-left">
      {/* SEARCH CARD INPUT */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-lg bg-[#0F4C81]/10 text-[#0F4C81] flex items-center justify-center border border-[#0F4C81]/25">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 text-sm">
            Verifikasi Kredensial Publik
          </h3>
          <p className="text-slate-400 text-[11px] max-w-sm mx-auto leading-relaxed">
            Periksa keabsahan lembaran sertifikat hasil pelatihan secara real-time tersambung langsung database terenkripsi
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            required
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-slate-200 focus:border-[#0F4C81] outline-none text-xs rounded-lg font-mono text-center tracking-wider"
            placeholder="ID Sertifikat (misal: CRT-F428AD2A)"
          />
          <button
            type="submit"
            className="bg-[#0F4C81] hover:bg-[#1E88E5] text-white px-4 rounded-lg font-bold transition-colors text-xs cursor-pointer"
          >
            Saring Data
          </button>
        </form>
      </div>

      {tried && (
        <div className="animate-fade-in">
          {verifiedPeserta && verifiedPeserta.sertifikat ? (
            (() => {
              const expired = isCertExpired(verifiedPeserta.tanggalExpired);
              return (
                /* VERIFIED SUCCESS CARD */
                <div className={`bg-white rounded-xl overflow-hidden border ${expired ? 'border-rose-450 shadow-md' : 'border-emerald-500/30'}`}>
                  {/* Glowing header banner */}
                  <div className={`${expired ? 'bg-rose-50 text-rose-900 border-rose-100' : 'bg-emerald-50/50 text-emerald-800 border-emerald-100'} p-5 text-center flex flex-col items-center justify-center border-b`}>
                    {expired ? (
                      <ShieldAlert className="h-10 w-10 text-rose-600 mb-1.5 animate-bounce" />
                    ) : (
                      <ShieldCheck className="h-10 w-10 text-emerald-600 mb-1.5 animate-bounce" />
                    )}
                    <h4 className={`font-extrabold text-xs uppercase tracking-widest ${expired ? 'text-rose-800' : 'text-[#0F4C81]'}`}>
                      {expired ? 'SERTIFIKAT HABIS MASA BERLAKU (EXPIRED)' : 'SERTIFIKAT TERDAFTAR RESMI'}
                    </h4>
                    <span className={`font-mono text-xs font-bold mt-0.5 ${expired ? 'text-rose-600' : 'text-[#1E88E5]'}`}>
                      ID: {verifiedPeserta.sertifikat.id}
                    </span>

                    <div className={`mt-2 inline-block ${expired ? 'bg-rose-600 border border-rose-400 shadow-[0_0_8px_rgba(225,29,72,0.4)] animate-pulse' : 'bg-emerald-600'} text-white rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider`}>
                      {expired ? 'Masa Berlaku Habis' : 'Sertifikat Aktif'}
                    </div>
                    <p className="text-[10px] text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                      {expired ? (
                        <strong className="text-rose-750">Perhatian: Kredensial ini terdata resmi di sistem, tetapi masa berlakunya telah kedaluwarsa pada {verifiedPeserta.tanggalExpired}.</strong>
                      ) : (
                        'Lembaran kredensial di bawah ini dinyatakan sah dan autentik sesuai dengan hasil kepesertaan diklat terkait.'
                      )}
                    </p>
                  </div>

                  {/* Verified Metadata rows */}
                  <div className="divide-y divide-slate-100 text-xs text-slate-700">
                    <div className="px-4.5 py-2.5 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[9px]">Penerima Sertifikat:</span>
                      <strong className="text-[#0F4C81] font-bold text-right">{verifiedPeserta.name}</strong>
                    </div>
                    <div className="px-4.5 py-2.5 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[9px]">NIP Kepegawaian:</span>
                      <span className="font-mono text-slate-700 font-medium">{verifiedPeserta.nip}</span>
                    </div>
                    <div className="px-4.5 py-2.5 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[9px]">Unit Kerja:</span>
                      <span className="text-slate-700 font-medium text-right">{verifiedPeserta.instansi}</span>
                    </div>
                    <div className="px-4.5 py-2.5 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[9px]">Kualifikasi / Jabatan:</span>
                      <span className="text-slate-700 font-medium text-right">{verifiedPeserta.jabatan}</span>
                    </div>
                    <div className="px-4.5 py-2.5 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[9px]">Program Pelatihan:</span>
                      <span className="text-[#1E88E5] font-semibold text-right max-w-xs truncate">
                        {folders.find((f) => f.id === verifiedPeserta.folderId)?.name}
                      </span>
                    </div>
                    <div className="px-4.5 py-2.5 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[9px]">Nomor Registrasi:</span>
                      <code className="bg-slate-50 px-2 py-0.5 rounded border border-slate-150 text-[#00ACC1] font-bold font-mono text-xs">
                        {verifiedPeserta.noSertifikat}
                      </code>
                    </div>
                    <div className="px-4.5 py-2.5 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[9px]">Evaluasi Kelulusan:</span>
                      <strong className="text-[#0F4C81] font-bold">PREDIKAT {verifiedPeserta.nilai} / 100</strong>
                    </div>
                    <div className="px-4.5 py-2.5 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[9px]">Tanggal Terbit Dokumen:</span>
                      <span className="text-slate-800 font-semibold">{verifiedPeserta.sertifikat.tanggalTerbit}</span>
                    </div>
                    {verifiedPeserta.tanggalExpired && (() => {
                      const valInfo = getValidityInfo(verifiedPeserta.tanggal, verifiedPeserta.tanggalExpired);
                      return (
                        <div className="px-4.5 py-3 bg-slate-50/55 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t">
                          <div>
                            <span className="text-slate-400 font-bold uppercase text-[9px] block">Masa Berlaku Sertifikat:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-extrabold text-slate-850 font-mono text-xs">{verifiedPeserta.tanggalExpired}</span>
                              {expired ? (
                                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-extrabold uppercase text-[9px] animate-pulse">
                                  ● EXPIRED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold uppercase text-[9px] animate-pulse">
                                  ● AKTIF (VALID)
                                </span>
                              )}
                            </div>
                          </div>
                          {!expired && valInfo.percentRemaining < 100 && (
                            <div className="w-full sm:w-52">
                              <div className="flex justify-between text-[9px] text-slate-500 font-extrabold mb-1 leading-none">
                                <span>Sisa: {valInfo.timeLeftString}</span>
                                <span>{valInfo.percentRemaining}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    valInfo.percentRemaining > 30 ? 'bg-gradient-to-r from-emerald-500 to-[#1E88E5]' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                                  }`}
                                  style={{ width: `${valInfo.percentRemaining}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Primary action downholder */}
                  <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Informasi ini dicetak langsung dari cloud terintegrasi.
                    </span>
                    <button
                      onClick={() => {
                        const printContents = document.getElementById(`certificate-print-${verifiedPeserta.id}`)?.outerHTML;
                        if (printContents) {
                          const printWindow = window.open('', '', 'width=950,height=670');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Cetak Sertifikat ${verifiedPeserta.name}</title>
                                  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
                                  <script src="https://cdn.tailwindcss.com"></script>
                                </head>
                                <body onload="window.print();">
                                  <div style="width:100%; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#fff;">
                                    ${printContents}
                                  </div>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }
                        }
                      }}
                      className="bg-[#0F4C81] hover:bg-[#1E88E5] text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors w-full sm:w-auto cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      Cetak / Simpan PDF
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            /* REJECTED / INVALID CREDENTIAL NOTIFICATION */
            <div className="bg-white rounded-xl border border-red-500/30 p-5 text-center space-y-3.5">
              <div className="flex justify-center">
                <ShieldAlert className="h-10 w-10 text-red-500 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-red-650 text-xs uppercase tracking-widest">
                  Kredensial Tidak Ditemukan
                </h4>
                <p className="text-slate-500 text-[11px] max-w-sm mx-auto leading-relaxed">
                  ID sertifikat <strong className="text-slate-800 font-mono">“{searchId}”</strong> tidak terdaftar dalam database atau telah dinonaktifkan oleh administrator.
                </p>
              </div>
              <div className="bg-red-50/50 text-red-800 p-2.5 rounded-lg text-[10px] max-w-md mx-auto leading-normal">
                Catatan: Pencarian ID bersifat case-sensitive. Pastikan ejaan huruf, angka, dan tanda hubung sesuai pada lembaran printout.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Embedded hidden validator block so pdf generation printable targets exist across views */}
      <div className="absolute opacity-0 select-none pointer-events-none -left-full -top-full">
        {verifiedPeserta && (
          <CertificateLayout
            peserta={verifiedPeserta}
            folder={folders.find((f) => f.id === verifiedPeserta.folderId) as FolderDiklat}
            verifyUrl={`${appUrl}?v=${verifiedPeserta.sertifikat?.id}`}
          />
        )}
      </div>
    </div>
  );
}
