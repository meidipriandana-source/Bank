export interface TemplateConfig {
  showBorder: boolean;
  showDecorations: boolean;
  showHeaderEmblem: boolean;
  showSalutation: boolean;
  showPelatihanBox: boolean;
  showSignatureLabel: boolean;
  
  // Additional switches for fine-grained coordinate mapping over uploaded background files:
  showSignatureBlock?: boolean;
  showVerificationCredits?: boolean;
  showPelatihanContainer?: boolean;
  showPelatihanStaticText?: boolean;
  showPelatihanName?: boolean;
  
  fontSizeName: number;
  colorName: string;
  yOffsetName: number; // Y-percent from top (0-100)

  fontSizeNumber: number;
  colorNumber: string;
  yOffsetNumber: number;

  fontSizeDetails: number;
  colorDetails: string;
  yOffsetDetails: number;

  fontSizePelatihan: number;
  colorPelatihan: string;
  yOffsetPelatihan: number;

  sizeQrCode: number;
  xOffsetQrCode: number; // X-percent from left (0-100)
  yOffsetQrCode: number; // Y-percent from top (0-100)

  xOffsetSignature: number; // X-percent from left (0-100)
  yOffsetSignature: number; // Y-percent from top (0-100)

  yOffsetExpiry: number; // Y-percent from top (0-100)
}

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  showBorder: true,
  showDecorations: true,
  showHeaderEmblem: true,
  showSalutation: true,
  showPelatihanBox: true,
  showSignatureLabel: true,
  
  showSignatureBlock: true,
  showVerificationCredits: true,
  showPelatihanContainer: true,
  showPelatihanStaticText: true,
  showPelatihanName: true,
  
  fontSizeName: 24,
  colorName: '#1E88E5',
  yOffsetName: 34,

  fontSizeNumber: 11,
  colorNumber: '#0F4C81',
  yOffsetNumber: 26,

  fontSizeDetails: 12,
  colorDetails: '#374151',
  yOffsetDetails: 45,

  fontSizePelatihan: 16,
  colorPelatihan: '#0F4C81',
  yOffsetPelatihan: 55,

  sizeQrCode: 75,
  xOffsetQrCode: 50,
  yOffsetQrCode: 76,

  xOffsetSignature: 82,
  yOffsetSignature: 75,

  yOffsetExpiry: 65,
};

export interface FolderDiklat {
  id: string; // FLD-XXXXXX
  name: string;
  driveId: string;
  templateUrl: string; // Custom base64 or link
  date: string;
  templateConfig?: TemplateConfig; // Live-adjustable positioning parameters
}

export interface Certificate {
  id: string; // CRT-XXXXXX
  pesertaId: string;
  linkPdf: string;
  qrLink: string;
  status: 'Aktif' | 'Ditangguhkan';
  tanggalTerbit: string;
}

export interface Peserta {
  id: string; // PES-XXXXXX
  folderId: string;
  name: string;
  nip: string;
  instansi: string;
  jabatan: string;
  noSertifikat: string;
  nilai: string;
  tanggal: string;
  tanggalExpired: string; // Expiry date format
  pdfData?: string; // Custom uploaded PDF base64/dataURL
  pdfName?: string; // File name
  sertifikat: Certificate | null;
}

export interface DashboardStats {
  totalFolders: number;
  totalParticipants: number;
  totalCerts: number;
  totalPublished: number;
}

export interface SuratDokumen {
  rowIndex: number;
  id: string; // DOC-XXXXXX
  docName: string;
  suratType: 'Surat Masuk' | 'Surat Keluar';
  suratNo: string;
  entryDate: string;
  uploadDate: string;
  employee: string;
  division: string;
  desc: string;
  link: string; // Base64 data url or generic link
  fileName?: string;
}

