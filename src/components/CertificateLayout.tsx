import React from 'react';
import { Peserta, FolderDiklat, TemplateConfig, DEFAULT_TEMPLATE_CONFIG } from '../types';

interface CertificateLayoutProps {
  peserta: Peserta;
  folder: FolderDiklat;
  verifyUrl: string;
}

// Resilient parsing helper to check if date has expired
export const isCertExpired = (expiryStr: string | undefined): boolean => {
  if (!expiryStr) return false;
  try {
    // Check if YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(expiryStr)) {
      const expiry = new Date(expiryStr);
      expiry.setHours(23, 59, 59, 999);
      return expiry < new Date();
    }
    // Check if DD/MM/YYYY
    const parts = expiryStr.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0-indexed
      const y = parseInt(parts[2], 10);
      const expiry = new Date(y, m, d, 23, 59, 59, 999);
      return expiry < new Date();
    }
  } catch (e) {
    console.error('Error parsing expiry date:', e);
  }
  return false;
};

export interface ValidityInfo {
  isValid: boolean;
  percentRemaining: number;
  timeLeftString: string;
}

export const getValidityInfo = (issueStr: string | undefined, expiryStr: string | undefined): ValidityInfo => {
  if (!expiryStr) {
    return { isValid: true, percentRemaining: 100, timeLeftString: 'Masa Berlaku Tidak Terbatas' };
  }
  try {
    let issueDate = new Date();
    if (issueStr) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(issueStr)) {
        issueDate = new Date(issueStr);
      } else {
        const parts = issueStr.split('/');
        if (parts.length === 3) {
          issueDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      }
    }

    let expiryDate = new Date();
    if (/^\d{4}-\d{2}-\d{2}$/.test(expiryStr)) {
      expiryDate = new Date(expiryStr);
    } else {
      const parts = expiryStr.split('/');
      if (parts.length === 3) {
        expiryDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
    expiryDate.setHours(23, 59, 59, 999);

    const now = new Date();
    const isValid = expiryDate >= now;

    if (!isValid) {
      return { isValid: false, percentRemaining: 0, timeLeftString: 'Telah Kedaluwarsa' };
    }

    const totalDuration = expiryDate.getTime() - issueDate.getTime();
    const remainingDuration = expiryDate.getTime() - now.getTime();

    let percentRemaining = 100;
    if (totalDuration > 0) {
      percentRemaining = Math.max(0, Math.min(100, Math.round((remainingDuration / totalDuration) * 100)));
    }

    // Compute remaining time
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let timeLeftString = '';
    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      timeLeftString = months > 0 ? `${years} tahun ${months} bulan lagi` : `${years} tahun lagi`;
    } else if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      timeLeftString = days > 0 ? `${months} bulan ${days} hari lagi` : `${months} bulan lagi`;
    } else {
      timeLeftString = `${diffDays} hari lagi`;
    }

    return { isValid: true, percentRemaining, timeLeftString };
  } catch (e) {
    return { isValid: true, percentRemaining: 100, timeLeftString: 'Sertifikat Aktif' };
  }
};

/**
 * Returns a layout configuration with clean defaults if a template url is uploaded.
 * Automatically toggles off overlapping template static text, borders, crests, and signatures,
 * while maintaining backward-compatible merge policies for existing user-adjusted slider parameters.
 */
export const getEffectiveConfig = (folder: FolderDiklat): TemplateConfig => {
  const hasUploadedTemplate = !!folder.templateUrl;

  const customDefault: TemplateConfig = {
    showBorder: !hasUploadedTemplate,
    showDecorations: !hasUploadedTemplate,
    showHeaderEmblem: !hasUploadedTemplate,
    showSalutation: !hasUploadedTemplate,
    showPelatihanBox: !hasUploadedTemplate,
    showSignatureLabel: !hasUploadedTemplate,

    showSignatureBlock: !hasUploadedTemplate,
    showVerificationCredits: !hasUploadedTemplate,
    showPelatihanContainer: !hasUploadedTemplate,
    showPelatihanStaticText: !hasUploadedTemplate,
    showPelatihanName: true,

    fontSizeName: 28,
    colorName: '#1E88E5',
    yOffsetName: 36,

    fontSizeNumber: 12,
    colorNumber: '#0F4C81',
    yOffsetNumber: 22,

    fontSizeDetails: 12,
    colorDetails: '#374151',
    yOffsetDetails: 48,

    fontSizePelatihan: 20,
    colorPelatihan: '#0F4C81',
    yOffsetPelatihan: 58,

    sizeQrCode: 80,
    xOffsetQrCode: 50,
    yOffsetQrCode: 74,

    xOffsetSignature: 82,
    yOffsetSignature: 73,

    yOffsetExpiry: 63,
  };

  const baseConfig = hasUploadedTemplate ? customDefault : DEFAULT_TEMPLATE_CONFIG;

  return {
    ...baseConfig,
    ...(folder.templateConfig || {}),
  };
};

export default function CertificateLayout({ peserta, folder, verifyUrl }: CertificateLayoutProps) {
  // If the participant has a custom PDF/image upload (pdfData), render it directly as the certificate content
  // without any of the synthetic/default certificate template elements.
  if (peserta.pdfData) {
    const isPdf = peserta.pdfData.startsWith('data:application/pdf');

    return (
      <div
        id={`certificate-print-${peserta.id}`}
        className="relative w-full aspect-[297/210] max-w-[950px] mx-auto bg-white shadow-xl overflow-hidden font-sans select-none flex items-center justify-center"
      >
        {isPdf ? (
          <embed
            src={peserta.pdfData}
            type="application/pdf"
            className="w-full h-full border-0"
            style={{ width: '100%', height: '100%', minHeight: '350px' }}
          />
        ) : (
          <img
            src={peserta.pdfData}
            className="w-full h-full object-contain"
            alt={`Sertifikat ${peserta.name}`}
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    );
  }

  // Use custom layout config with adaptive defaults for template uploads
  const config = getEffectiveConfig(folder);

  const backgroundStyle: React.CSSProperties = folder.templateUrl
    ? { backgroundImage: `url(${folder.templateUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {
        background: 'linear-gradient(135deg, #ffffff 0%, #fdfdfd 50%, #f5f7f9 100%)',
      };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
  const expired = isCertExpired(peserta.tanggalExpired);

  return (
    <div
      id={`certificate-print-${peserta.id}`}
      className={`relative w-full aspect-[297/210] max-w-[950px] mx-auto bg-white shadow-xl overflow-hidden font-sans select-none ${
        config.showBorder ? 'border-[16px] border-[#0F4C81]' : 'border-0'
      }`}
      style={backgroundStyle}
    >
      {/* Absolute Thin Blue Inner Border */}
      {config.showBorder && (
        <>
          <div className="absolute inset-2 border border-[#1E88E5]/35 pointer-events-none" />
          <div className="absolute inset-4 border-[2px] border-[#00ACC1]/50 pointer-events-none" />
        </>
      )}

      {/* Decorative Golden Corner Accents */}
      {config.showBorder && config.showDecorations && (
        <>
          <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-[#00ACC1] pointer-events-none" />
          <div className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-[#00ACC1] pointer-events-none" />
          <div className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-[#00ACC1] pointer-events-none" />
          <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-[#00ACC1] pointer-events-none" />
        </>
      )}

      {/* Expired Overlay Animation (stays on top of everything) */}
      {expired && (
        <div className="absolute inset-x-8 inset-y-8 z-40 bg-red-900/10 pointer-events-none flex items-center justify-center border-[8px] border-red-600/40">
          <div className="transform -rotate-12 bg-red-650 text-white font-extrabold uppercase text-xl sm:text-2xl py-3.5 px-8 rounded-xl shadow-2xl tracking-widest border-4 border-white animate-pulse flex flex-col items-center gap-1">
            <span>KEDALUWARSA / EXPIRED</span>
            <span className="text-xs tracking-normal normal-case opacity-90 font-mono">
              Masa berlaku habis pada: {peserta.tanggalExpired}
            </span>
          </div>
        </div>
      )}

      {/* Header Emblem & Badges - ABSOLUTELY POSITIONED */}
      {config.showHeaderEmblem && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center w-[80%] pointer-events-none"
          style={{ top: '6%' }}
        >
          {/* Medical Education/Training Authority Logo Seal */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#0F4C81] text-[#00ACC1] mb-1.5 p-1 px-1.5 shadow-md border-2 border-[#FFE082] bg-gradient-to-tr from-[#0F4C81] to-[#1E88E5]">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Laurel wreaths for academic achievement */}
              <path d="M4 14C3.2 12.5 3 10.5 3.5 9C4 7.5 5.2 6.5 6.5 6" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
              <path d="M20 14C20.8 12.5 21 10.5 20.5 9C20 7.5 18.8 6.5 17.5 6" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
              {/* Hospital Building Silhouette inside seal */}
              <path d="M5 19H19" stroke="#FFE082" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M8 19V11C8 10.45 8.45 10 9 10H15C15.55 10 16 10.45 16 11V19" stroke="#FFE082" strokeWidth="1.2" strokeLinejoin="round" fill="rgba(255,255,255,0.05)" />
              {/* Clinical Cross on building wall */}
              <path d="M12 12V16M10 14H14" stroke="#00ACC1" strokeWidth="1.8" strokeLinecap="round" />
              {/* Tiny windows */}
              <rect x="10" y="11.5" width="1" height="1" fill="#FFE082" />
              <rect x="13" y="11.5" width="1" height="1" fill="#FFE082" />
              {/* Hospital roof-top antenna cross */}
              <path d="M12 7V10M10.5 8.5H13.5" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[3px] text-gray-500">
            Sertifikat Penghargaan & Kelulusan
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[4px] text-[#0F4C81] my-0.5 font-serif">
            SERTIFIKAT
          </h1>
          <div className="w-32 h-[3px] bg-gradient-to-r from-transparent via-[#1E88E5] to-transparent" />
        </div>
      )}

      {/* Nomor Sertifikat - ABSOLUTELY POSITIONED */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 text-center w-[80%] pointer-events-none"
        style={{ top: `${config.yOffsetNumber}%` }}
      >
        <p 
          className="font-mono font-medium"
          style={{ fontSize: `${config.fontSizeNumber}px`, color: config.colorNumber }}
        >
          Nomor Sertifikat: <span className="font-bold">{peserta.noSertifikat}</span>
        </p>
      </div>

      {/* Salutation - ABSOLUTELY POSITIONED */}
      {config.showSalutation && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 text-center w-[80%] pointer-events-none"
          style={{ top: `${config.yOffsetName - 6.5}%` }}
        >
          <p className="text-xs sm:text-sm italic text-gray-500 font-serif">
            Dengan penuh rasa hormat, sertifikat ini diberikan kepada:
          </p>
        </div>
      )}

      {/* Nama Lengkap Peserta - ABSOLUTELY POSITIONED */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 text-center w-[85%] pointer-events-none"
        style={{ top: `${config.yOffsetName}%` }}
      >
        <h2 
          className="font-bold tracking-wide inline-block border-b-2 border-gray-100/85 px-8 py-0.5 mt-0 font-sans"
          style={{ fontSize: `${config.fontSizeName}px`, color: config.colorName }}
        >
          {peserta.name}
        </h2>
      </div>

      {/* Detail Metadata (NIP, Unit Kerja, Jabatan) - ABSOLUTELY POSITIONED */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 text-center w-[80%] pointer-events-none"
        style={{ top: `${config.yOffsetDetails}%` }}
      >
        <p 
          className="leading-relaxed font-sans"
          style={{ fontSize: `${config.fontSizeDetails}px`, color: config.colorDetails }}
        >
          NIP/ID: <strong className="text-gray-900">{peserta.nip}</strong> &bull; Unit Kerja:{' '}
          <strong className="text-gray-900">{peserta.instansi}</strong> &bull; Jabatan:{' '}
          <strong className="text-gray-900">{peserta.jabatan}</strong>
          {config.showSignatureLabel && (
            <>
              <br />
              <span className="opacity-95 text-[11px] sm:text-xs">
                Atas dedikasi, batasan aktif, serta pencapaian akademik istimewa dalam menyelesaikan kelas pelatihan:
              </span>
            </>
          )}
        </p>
      </div>

      {/* Pelatihan Box - ABSOLUTELY POSITIONED */}
      {(config.showPelatihanName || config.showPelatihanStaticText) && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 text-center w-[85%] pointer-events-none"
          style={{ top: `${config.yOffsetPelatihan}%` }}
        >
          {config.showPelatihanName && (
            <span 
              className={config.showPelatihanContainer 
                ? "inline-block font-bold tracking-wide bg-[#0F4C81]/5 px-5 py-1 rounded border border-[#0F4C81]/10 shadow-3xs"
                : "inline-block font-extrabold tracking-wide"
              }
              style={{ fontSize: `${config.fontSizePelatihan}px`, color: config.colorPelatihan }}
            >
              &ldquo;{folder.name}&rdquo;
            </span>
          )}
          
          {config.showPelatihanStaticText && (
            <>
              {config.showPelatihanName && <br />}
              <span className="text-[10px] sm:text-[11px] text-gray-500 mt-1 block">
                Diselenggarakan pada tanggal <strong className="text-gray-800">{peserta.tanggal}</strong> dengan Hasil Predikat Kelulusan Akademik Nilai:{' '}
                <strong className="text-emerald-700">{peserta.nilai} / 100</strong>.
              </span>
            </>
          )}
        </div>
      )}

      {/* Expiry dynamic banner - ABSOLUTELY POSITIONED */}
      {peserta.tanggalExpired && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 text-center w-[80%] pointer-events-none flex flex-col items-center"
          style={{ top: `${config.yOffsetExpiry}%` }}
        >
          {(() => {
            const valInfo = getValidityInfo(peserta.tanggal, peserta.tanggalExpired);
            return (
              <div className="inline-flex flex-col items-center p-1.5 px-3 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200/85 dark:border-slate-800 shadow-3xs max-w-sm mx-auto text-center">
                <div className="flex flex-wrap items-center justify-center gap-2 text-[9px] sm:text-[10px] text-slate-700 dark:text-slate-200 font-semibold">
                  <span>Masa Berlaku s.d. <strong className="font-extrabold text-slate-900 dark:text-white">{peserta.tanggalExpired}</strong></span>
                  {valInfo.isValid ? (
                    <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-100/65 uppercase tracking-wide animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[8px] bg-rose-50 text-rose-700 font-extrabold px-1.5 py-0.5 rounded-full border border-rose-200 uppercase tracking-wide animate-bounce shadow-3xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span> Expired
                    </span>
                  )}
                </div>
                {valInfo.isValid && valInfo.percentRemaining < 100 && (
                  <div className="w-40 mt-1 mx-auto">
                    <div className="flex justify-between text-[7px] sm:text-[8px] text-slate-500 dark:text-slate-400 font-semibold mb-0.5 leading-none">
                      <span>Sisa: {valInfo.timeLeftString}</span>
                      <span>{valInfo.percentRemaining}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          valInfo.percentRemaining > 30 ? 'bg-gradient-to-r from-[#1E88E5] to-[#00ACC1]' : 'bg-gradient-to-r from-amber-400 to-rose-500'
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
      )}

      {/* Verification Credential block (Left Side bottom alignment) - ABSOLUTELY POSITIONED */}
      {config.showVerificationCredits && (
        <div 
          className="absolute text-left pointer-events-none"
          style={{ 
            left: '8%', 
            top: `${config.yOffsetSignature}%`,
            width: '32%',
          }}
        >
          <p className="text-[8.5px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Kredensial Verifikasi:
          </p>
          <div className="text-[9px] font-mono text-gray-500 bg-gray-50/90 border border-gray-150 p-1.5 rounded space-y-0.5">
            <div className="flex justify-between">
              <span>ID:</span>
              <strong className="text-gray-800">{peserta.sertifikat?.id || 'PROTOTYPE-1'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`${expired ? 'text-red-650' : 'text-emerald-700'} font-bold uppercase text-[8px] flex items-center gap-0.5`}>
                ● {expired ? 'Kadaluwarsa' : 'Terverifikasi Asli'}
              </span>
            </div>
          </div>
          <span className="text-[7.5px] leading-tight text-gray-400 block mt-1">
            Pindai QR Code untuk membuktikan kredensial asli online.
          </span>
        </div>
      )}

      {/* QR Code block (Centered bottom area) - ABSOLUTELY POSITIONED */}
      <div 
        className="absolute -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none"
        style={{ 
          left: `${config.xOffsetQrCode}%`, 
          top: `${config.yOffsetQrCode}%`
        }}
      >
        <div className="p-1 bg-white border-2 border-[#1E88E5] rounded shadow-3xs">
          <img
            src={qrCodeUrl}
            className="object-contain"
            style={{ width: `${config.sizeQrCode}px`, height: `${config.sizeQrCode}px` }}
            alt="Security QR Code"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Executive Director Signature block (Right Side bottom alignment) - ABSOLUTELY POSITIONED */}
      {config.showSignatureBlock && (
        <div 
          className="absolute text-center"
          style={{ 
            right: `${100 - config.xOffsetSignature}%`, 
            top: `${config.yOffsetSignature}%`,
            width: '32%',
            transform: 'translateX(50%)'
          }}
        >
          <span className="text-[9.5px] text-[#334155] block">Yogyakarta, {peserta.tanggal}</span>
          <p className="text-[9.5px] font-medium text-gray-700 mb-6 leading-tight">Direktur Pelaksana Diklat,</p>

          {/* Signature stamp graphic overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-8 select-none opacity-85 pointer-events-none">
            {/* Signature Scribble Art */}
            <svg className="w-full h-full text-[#1E88E5]/90" viewBox="0 0 100 30" fill="none">
              <path
                d="M10 15 C30 5, 20 25, 45 15 C70 5, 60 25, 90 10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Stamp circle overlay */}
            <div className="absolute -left-1 -bottom-2 w-9 h-9 border-2 border-dashed border-[#00ACC1]/55 rounded-full flex items-center justify-center text-[5.5px] text-[#00ACC1]/80 font-bold rotate-12 bg-white/10">
              DIKLAT OK
            </div>
          </div>

          <div className="w-full border-t border-gray-300 my-1 pointer-events-none" />
          <strong className="text-[10.5px] text-gray-800 block leading-tight pointer-events-none">Ners. Meidi Dana, M.Kep</strong>
          <span className="text-[8.5px] text-gray-500 font-sans block pointer-events-none">NIP. 19821215 200801 1 004</span>
        </div>
      )}
    </div>
  );
}
