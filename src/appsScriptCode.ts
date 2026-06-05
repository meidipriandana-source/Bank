export interface AppsScriptFile {
  name: string;
  type: 'gs' | 'html' | 'md';
  description: string;
  code: string;
}

export const appsScriptFiles: AppsScriptFile[] = [
  {
    name: "Code.gs",
    type: "gs",
    description: "Server-side logic for Google Apps Script. Handles database (Google Sheets) initialization, CRUD operations, Google Drive subfolder generation, Base64 image template uploads, generating HTML/CSS-based PDF certificates, and public QR verification API.",
    code: `/**
 * Web Apps Sertifikat Diklat Online
 * Google Apps Script Backend (Code.gs)
 * Developed for professional online certification systems.
 */

// WARNING: Ganti ID_FOLDER_UTAMA dengan ID Folder di Google Drive Anda di mana semua subfolder diklat akan disimpan.
var PARENT_FOLDER_ID = "1dUcuP_LownZK-q6Cd4ecg94T9ZggHGXX"; 

/**
 * Setup data awal dan route doGet.
 * Melayani verifikasi publik (/verify?id=xxxx) atau melayani panel admin utama.
 */
function doGet(e) {
  setupDatabase(); // Pastikan Spreadsheet siap terbuat otomatis jika belum
  
  var id = e.parameter.id || e.parameter.verify || e.parameter.v;
  if (id) {
    var template = HtmlService.createTemplateFromFile('Verify');
    template.certId = id;
    template.appUrl = ScriptApp.getService().getUrl();
    return template.evaluate()
        .setTitle('Verifikasi Sertifikat Valid - Diklat Keperawatan')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  var template = HtmlService.createTemplateFromFile('Index');
  template.appUrl = ScriptApp.getService().getUrl();
  return template.evaluate()
      .setTitle('Sistem Sertifikat Diklat Online')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper untuk menyertakan file html eksternal (Styles, Scripts, dll) ke dalam HTML template.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Inisialisasi awal database di Google Sheets jika sheet belum dibuat.
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet FolderDiklat
  var sheetFolder = ss.getSheetByName("FolderDiklat");
  if (!sheetFolder) {
    sheetFolder = ss.insertSheet("FolderDiklat");
    sheetFolder.appendRow(["ID", "Nama Folder", "Folder Drive ID", "Template Link", "Tanggal"]);
    sheetFolder.getRange("A1:E1").setFontWeight("bold").setBackground("#0F4C81").setFontColor("#FFFFFF");
  }
  
  // 2. Sheet Peserta
  var sheetPeserta = ss.getSheetByName("Peserta");
  if (!sheetPeserta) {
    sheetPeserta = ss.insertSheet("Peserta");
    sheetPeserta.appendRow(["ID", "FolderID", "Nama", "NIP", "Instansi", "Jabatan", "No Sertifikat", "Nilai", "Tanggal"]);
    sheetPeserta.getRange("A1:I1").setFontWeight("bold").setBackground("#0F4C81").setFontColor("#FFFFFF");
  }
  
  // 3. Sheet Sertifikat
  var sheetSertifikat = ss.getSheetByName("Sertifikat");
  if (!sheetSertifikat) {
    sheetSertifikat = ss.insertSheet("Sertifikat");
    sheetSertifikat.appendRow(["ID", "PesertaID", "Link PDF", "QR Link", "Status", "Tanggal Diterbitkan"]);
    sheetSertifikat.getRange("A1:F1").setFontWeight("bold").setBackground("#0F4C81").setFontColor("#FFFFFF");
  }
}

/**
 * Ambil data statistik ringkas untuk halaman Dashboard Admin
 */
function getDashboardStats() {
  setupDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var folders = ss.getSheetByName("FolderDiklat").getDataRange().getValues();
  var participants = ss.getSheetByName("Peserta").getDataRange().getValues();
  var certs = ss.getSheetByName("Sertifikat").getDataRange().getValues();
  
  return {
    totalFolders: Math.max(0, folders.length - 1),
    totalParticipants: Math.max(0, participants.length - 1),
    totalCerts: Math.max(0, certs.length - 1),
    totalPublished: Math.max(0, certs.filter(function(row) { return row[4] === "Aktif" || row[4] === "Terbit"; }).length)
  };
}

/**
 * ========================================================
 * MANAGEMENT FOLDER DIKLAT (GOOGLE DRIVE & SPREADSHEET)
 * ========================================================
 */

function getFolders() {
  setupDatabase();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("FolderDiklat");
  var rows = sheet.getDataRange().getValues();
  var folders = [];
  for (var i = 1; i < rows.length; i++) {
    folders.push({
      id: rows[i][0],
      name: rows[i][1],
      driveId: rows[i][2],
      templateUrl: rows[i][3],
      date: rows[i][4] instanceof Date ? rows[i][4].toLocaleDateString('id-ID') : rows[i][4]
    });
  }
  return folders.reverse(); // Urutan terbaru di atas
}

function createFolder(name) {
  setupDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("FolderDiklat");
  var id = "FLD-" + Utilities.getUuid().substring(0, 8).toUpperCase();
  
  var driveFolderId = "";
  try {
    // Cari folder master. Jika ID_FOLDER_UTAMA tidak valid, gunakan Root Drive
    var parentFolder;
    if (PARENT_FOLDER_ID && PARENT_FOLDER_ID !== "ID_FOLDER_UTAMA_ANDA") {
      parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    } else {
      parentFolder = DriveApp.getRootFolder();
    }
    
    var newDriveFolder = parentFolder.createFolder(name);
    driveFolderId = newDriveFolder.getId();
  } catch (err) {
    Logger.log("Drive folder creation failed, using database records only. Error: " + err);
    // fallback: simpan info error atau buat folder virtual saja
    driveFolderId = "DUMMY-" + Utilities.getUuid().substring(0, 8).toUpperCase();
  }
  
  var formattedDate = new Date().toLocaleDateString('id-ID');
  sheet.appendRow([id, name, driveFolderId, "", formattedDate]);
  return { success: true, folderId: id, driveId: driveFolderId };
}

function renameFolder(folderId, newName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("FolderDiklat");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === folderId) {
      sheet.getRange(i + 1, 2).setValue(newName);
      var driveId = data[i][2];
      try {
        if (driveId && !driveId.startsWith("DUMMY")) {
          DriveApp.getFolderById(driveId).setName(newName);
        }
      } catch (e) {
        Logger.log("Gagal rename di Google Drive: " + e);
      }
      return { success: true };
    }
  }
  return { success: false, message: "Folder ID tidak ditemukan" };
}

function deleteFolder(folderId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Ambil data Drive ID dari sheet Folder
  var sheetFolder = ss.getSheetByName("FolderDiklat");
  var foldersData = sheetFolder.getDataRange().getValues();
  var driveId = "";
  var rowIndex = -1;
  
  for (var i = 1; i < foldersData.length; i++) {
    if (foldersData[i][0] === folderId) {
      driveId = foldersData[i][2];
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) return { success: false, message: "Folder tidak ditemukan" };
  
  // Hapus semua peserta di folder ini terlebih dahulu
  var sheetPeserta = ss.getSheetByName("Peserta");
  var pesertaData = sheetPeserta.getDataRange().getValues();
  // Loop terbalik untuk menghapus baris spreadsheet tanpa mengganggu index
  for (var j = pesertaData.length - 1; j >= 1; j--) {
    if (pesertaData[j][1] === folderId) {
      // Cari juga sertifikat terkait untuk dihapus
      var pesId = pesertaData[j][0];
      var sheetSertifikat = ss.getSheetByName("Sertifikat");
      var certsData = sheetSertifikat.getDataRange().getValues();
      for (var k = certsData.length - 1; k >= 1; k--) {
        if (certsData[k][1] === pesId) {
          sheetSertifikat.deleteRow(k + 1);
        }
      }
      sheetPeserta.deleteRow(j + 1);
    }
  }
  
  // Hapus Folder di Google Drive (pindahkan ke sampah/trash demi keselamatan data)
  try {
    if (driveId && !driveId.startsWith("DUMMY")) {
      DriveApp.getFolderById(driveId).setTrashed(true);
    }
  } catch (e) {
    Logger.log("Gagal memindahkan folder drive ke sampah: " + e);
  }
  
  // Hapus baris folder di spreadsheet
  sheetFolder.deleteRow(rowIndex);
  return { success: true };
}

/**
 * ========================================================
 * DATA PESERTA MANAGEMENT
 * ========================================================
 */

function getPeserta(folderId) {
  setupDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPeserta = ss.getSheetByName("Peserta");
  var pData = sheetPeserta.getDataRange().getValues();
  
  var sheetSertifikat = ss.getSheetByName("Sertifikat");
  var sData = sheetSertifikat.getDataRange().getValues();
  
  // Map sertifikat berdasarkan Peserta ID
  var certMap = {};
  for (var k = 1; k < sData.length; k++) {
    certMap[sData[k][1]] = {
      id: sData[k][0],
      linkPdf: sData[k][2],
      qrLink: sData[k][3],
      status: sData[k][4]
    };
  }
  
  var listPeserta = [];
  for (var i = 1; i < pData.length; i++) {
    if (!folderId || pData[i][1] === folderId) {
      var pId = pData[i][0];
      listPeserta.push({
        id: pId,
        folderId: pData[i][1],
        name: pData[i][2],
        nip: pData[i][3],
        instansi: pData[i][4],
        jabatan: pData[i][5],
        noSertifikat: pData[i][6],
        nilai: pData[i][7],
        tanggal: pData[i][8] instanceof Date ? pData[i][8].toLocaleDateString('id-ID') : pData[i][8],
        sertifikat: certMap[pId] || null
      });
    }
  }
  return listPeserta.reverse();
}

function addPeserta(data) {
  setupDatabase();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Peserta");
  var id = "PES-" + Utilities.getUuid().substring(0, 8).toUpperCase();
  
  sheet.appendRow([
    id,
    data.folderId,
    data.name,
    data.nip,
    data.instansi,
    data.jabatan,
    data.noSertifikat,
    data.nilai,
    data.tanggal
  ]);
  
  return { success: true, id: id };
}

function updatePeserta(id, data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Peserta");
  var rawData = sheet.getDataRange().getValues();
  
  for (var i = 1; i < rawData.length; i++) {
    if (rawData[i][0] === id) {
      var rowNum = i + 1;
      sheet.getRange(rowNum, 3).setValue(data.name);
      sheet.getRange(rowNum, 4).setValue(data.nip);
      sheet.getRange(rowNum, 5).setValue(data.instansi);
      sheet.getRange(rowNum, 6).setValue(data.jabatan);
      sheet.getRange(rowNum, 7).setValue(data.noSertifikat);
      sheet.getRange(rowNum, 8).setValue(data.nilai);
      sheet.getRange(rowNum, 9).setValue(data.tanggal);
      return { success: true };
    }
  }
  return { success: false, message: "Peserta tidak ditemukan" };
}

function deletePeserta(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Hapus dari sheet Peserta
  var sheetPeserta = ss.getSheetByName("Peserta");
  var dataP = sheetPeserta.getDataRange().getValues();
  var found = false;
  
  for (var i = 1; i < dataP.length; i++) {
    if (dataP[i][0] === id) {
      sheetPeserta.deleteRow(i + 1);
      found = true;
      break;
    }
  }
  
  // Hapus sertifikat terkait jika ada
  var sheetSertifikat = ss.getSheetByName("Sertifikat");
  var dataS = sheetSertifikat.getDataRange().getValues();
  for (var j = dataS.length - 1; j >= 1; j--) {
    if (dataS[j][1] === id) {
      var pdfUrl = dataS[j][2];
      // Opsional: hapus file pdf asli di Google Drive jika link berupa file ID
      try {
        var fileId = extractFileIdFromUrl(pdfUrl);
        if (fileId) DriveApp.getFileById(fileId).setTrashed(true);
      } catch (e) {
        Logger.log("Gagal menghapus file sertifikat di Drive: " + e);
      }
      sheetSertifikat.deleteRow(j + 1);
    }
  }
  
  return { success: found };
}

/**
 * Bulk Import dari CSV / Templat Data Table Excel
 */
function importPesertaBulk(folderId, parsedDataArray) {
  setupDatabase();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Peserta");
  var successCount = 0;
  
  for (var i = 0; i < parsedDataArray.length; i++) {
    var p = parsedDataArray[i];
    if (!p.name) continue;
    
    var id = "PES-" + Utilities.getUuid().substring(0, 8).toUpperCase();
    sheet.appendRow([
      id,
      folderId,
      p.name,
      p.nip || "-",
      p.instansi || "-",
      p.jabatan || "-",
      p.noSertifikat || generateRandomCertNum(),
      p.nilai || "80",
      p.tanggal || new Date().toLocaleDateString('id-ID')
    ]);
    successCount++;
  }
  
  return { success: true, count: successCount };
}

/**
 * ========================================================
 * TEMPLATE SERTIFIKAT & GENERATION
 * ========================================================
 */

/**
 * Upload gambar background template untuk Folder Diklat spesifik
 * Disimpan ke Google Drive, lalu ID file / link disimpan dalam sheet FolderDiklat
 */
function uploadTemplate(folderId, fileName, base64Data) {
  setupDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetFolder = ss.getSheetByName("FolderDiklat");
  var folderData = sheetFolder.getDataRange().getValues();
  
  var driveFolderId = "";
  var rowIndex = -1;
  
  for (var i = 1; i < folderData.length; i++) {
    if (folderData[i][0] === folderId) {
      driveFolderId = folderData[i][2];
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) return { success: false, message: "Folder Diklat tidak terdaftar" };
  
  try {
    var folder;
    if (driveFolderId && !driveFolderId.startsWith("DUMMY")) {
      folder = DriveApp.getFolderById(driveFolderId);
    } else if (PARENT_FOLDER_ID && PARENT_FOLDER_ID !== "ID_FOLDER_UTAMA_ANDA") {
      folder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    } else {
      folder = DriveApp.getRootFolder();
    }
    
    // Convert Base64 ke Blob Gambar
    var contentType = base64Data.substring(base64Data.indexOf(":")+1, base64Data.indexOf(";"));
    var rawData = base64Data.substring(base64Data.indexOf(",")+1);
    var imageBlob = Utilities.newBlob(Utilities.base64Decode(rawData), contentType, fileName);
    
    // Simpan file baru di Drive
    var file = folder.createFile(imageBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var downloadUrl = file.getDownloadUrl(); // Link ambil direct image raw
    
    // Simpan url ke FolderDiklat spreadsheet
    sheetFolder.getRange(rowIndex, 4).setValue(downloadUrl);
    
    return { success: true, url: downloadUrl };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * PROSES GENERATE SERTIFIKAT PDF OTOMATIS
 * Menggunakan HTML-to-PDF Apps Script Engine.
 * Membuat file QR Code unik dan menempelkannya ke sertifikat.
 */
function generateSertifikat(pesertaId) {
  setupDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Ambil data Peserta
  var sheetPeserta = ss.getSheetByName("Peserta");
  var rawPeserta = sheetPeserta.getDataRange().getValues();
  var pIndex = -1;
  for (var i = 1; i < rawPeserta.length; i++) {
    if (rawPeserta[i][0] === pesertaId) {
      pIndex = i;
      break;
    }
  }
  if (pIndex === -1) return { success: false, message: "Data peserta tidak ditemukan." };
  
  var pName = rawPeserta[pIndex][2];
  var pNip = rawPeserta[pIndex][3];
  var pInstansi = rawPeserta[pIndex][4];
  var pJabatan = rawPeserta[pIndex][5];
  var pCertNum = rawPeserta[pIndex][6];
  var pNilai = rawPeserta[pIndex][7];
  var pDate = rawPeserta[pIndex][8] instanceof Date ? rawPeserta[pIndex][8].toLocaleDateString('id-ID') : rawPeserta[pIndex][8];
  var fId = rawPeserta[pIndex][1];
  
  // 2. Ambil data Folder dan Template
  var sheetFolder = ss.getSheetByName("FolderDiklat");
  var rawFolder = sheetFolder.getDataRange().getValues();
  var fTitle = "Pelatihan";
  var fTemplate = "";
  var fDriveId = "";
  
  for (var j = 1; j < rawFolder.length; j++) {
    if (rawFolder[j][0] === fId) {
      fTitle = rawFolder[j][1];
      fDriveId = rawFolder[j][2];
      fTemplate = rawFolder[j][3]; // Download URL image background
      break;
    }
  }
  
  // Buat sertifikat ID & Token Verifikasi
  var certId = "CRT-" + Utilities.getUuid().substring(0, 10).toUpperCase();
  var webAppUrl = ScriptApp.getService().getUrl();
  var verifyUrl = webAppUrl + "?id=" + certId;
  
  // Generate QR Code menggunakan QuickChart API / Google Chart API (agar clean di PDF render)
  var qrCodeApiUrl = "https://quickchart.io/chart?cht=qr&chs=150x150&chl=" + encodeURIComponent(verifyUrl);
  
  // 3. Bangun Dokumen HTML Sertifikat Elegan menggunakan Custom Tailwind CSS inline
  // Menggunakan default background jika template diklat belum diupload
  var backgroundCss = fTemplate ? "background-image: url('" + fTemplate + "');" : "background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);";
  
  var htmlContent = "<html>" +
    "<head>" +
    "<link href='https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap' rel='stylesheet'>" +
    "<style>" +
      "body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0; background-color: #ffffff; }" +
      ".cert-container { width: 1120px; height: 790px; position: relative; box-sizing: border-box; padding: 60px; " + backgroundCss + " background-size: cover; background-position: center; border: 15px solid #0F4C81; margin: auto;}" +
      ".cert-decor { position: absolute; border: 2px solid #1E88E5; top: 10px; bottom: 10px; left: 10px; right: 10px; pointer-events: none; }" +
      ".cert-header { text-align: center; margin-top: 40px; text-transform: uppercase; letter-spacing: 2px; }" +
      ".cert-title { color: #0F4C81; font-size: 52px; font-weight: 700; margin: 10px 0; }" +
      ".cert-subtitle { font-size: 18px; color: #555555; text-transform: uppercase; font-weight: 600; letter-spacing: 3px; }" +
      ".cert-issued-to { text-align: center; font-size: 16px; margin-top: 30px; font-style: italic; color: #666; }" +
      ".cert-name { text-align: center; font-size: 38px; font-weight: 700; color: #1E88E5; border-bottom: 2px solid #eeeeee; width: max-content; margin: 15px auto; padding-bottom: 5px; }" +
      ".cert-details { text-align: center; font-size: 16px; line-height: 1.8; color: #444444; width: 80%; margin: 10px auto; }" +
      ".cert-meta-grid { position: absolute; bottom: 60px; left: 60px; right: 60px; }" +
      ".meta-column-left { float: left; width: 40%; line-height: 1.5; color: #555; }" +
      ".meta-column-right { float: right; width: 40%; text-align: right; line-height: 1.5; color: #555; }" +
      ".meta-qr { float: left; width: 20%; text-align: center; margin-top: -10px; }" +
      ".meta-signature-box { text-align: center; display: inline-block; width: 200px; }" +
      ".sig-line { border-bottom: 1px solid #777; margin: 60px auto 5px; width: 100%; }" +
      ".status-badge { background-color: #00ACC1; color: white; display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; margin-top: 8px; font-weight: bold; }" +
    "</style>" +
    "</head>" +
    "<body>" +
      "<div class='cert-container'>" +
        "<div class='cert-decor'></div>" +
        "<div class='cert-header'>" +
          "<div class='cert-subtitle'>Sertifikat Penghargaan & Kelulusan</div>" +
          "<div class='cert-title'>SERTIFIKAT</div>" +
          "<p style='margin: 0; color: #444; font-size: 13px; font-weight: 600;'>Nomor Sertifikat: " + pCertNum + "</p>" +
        "</div>" +
        "<div class='cert-issued-to'>Diberikan secara terhormat kepada:</div>" +
        "<div class='cert-name'>" + pName + "</div>" +
        "<div class='cert-details'>" +
          "NIP / ID: <strong>" + pNip + "</strong> | Instansi: <strong>" + pInstansi + "</strong><br />" +
          "Atas keberhasilan dan prestasi luar biasa dalam menyelesaikan kelas pelatihan:<br />" +
          "<span style='font-size: 20px; color:#0F4C81; font-weight:bold; letter-spacing:0.5px;'>\"" + fTitle + "\"</span><br />" +
          "Diselenggarakan pada tanggal <strong>" + pDate + "</strong> dengan predikat Evaluasi Kelulusan Nilai: <strong>" + pNilai + " / 100</strong>." +
        "</div>" +
        "<div class='cert-meta-grid'>" +
          "<div class='meta-column-left'>" +
            "<strong>Kredensial Verifikasi:</strong><br />" +
            "ID Sertifikat: " + certId + "<br />" +
            "Status Kelayakan: <span class='status-badge'>TERVERIFIKASI ASLI</span><br />" +
            "<span style='font-size:11px; color:#888;'>Pindai QR Code untuk membuktikan otentisitas dokumen ini secara online melalui sistem terpadu.</span>" +
          "</div>" +
          "<div class='meta-qr'>" +
            "<img src='" + qrCodeApiUrl + "' style='width: 110px; height: 110px; border:3px solid #0F4C81; padding:2px; background:white; border-radius: 4px;' />" +
          "</div>" +
          "<div class='meta-column-right'>" +
            "<div class='meta-signature-box'>" +
              "<span>Yogyakarta, " + pDate + "</span><br />" +
              "<span>Direktur Pelaksana Diklat,</span>" +
              "<div class='sig-line'></div>" +
              "<strong>Ners. Meidi Dana, M.Kep</strong>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</body>" +
    "</html>";
  
  try {
    // 4. Ubah HTML Content ke Blob PDF super tajam menggunakan HtmlService
    // Set format landscape ukuran legal/letter ideal (A4 landscape)
    var htmlOutput = HtmlService.createHtmlOutput(htmlContent);
    var pdfBlob = htmlOutput.getAs('application/pdf');
    pdfBlob.setName("Sertifikat_" + pName.replace(/\s+/g, '_') + "_" + certId.substring(0,6) + ".pdf");
    
    // 5. Simpan file PDF ke subfolder diklat di Google Drive
    var outputFolder;
    if (fDriveId && !fDriveId.startsWith("DUMMY")) {
      outputFolder = DriveApp.getFolderById(fDriveId);
    } else if (PARENT_FOLDER_ID && PARENT_FOLDER_ID !== "ID_FOLDER_UTAMA_ANDA") {
      outputFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    } else {
      outputFolder = DriveApp.getRootFolder();
    }
    
    var pdfFile = outputFolder.createFile(pdfBlob);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var pdfUrl = pdfFile.getUrl();
    
    // 6. Tulis data ke Sheet Sertifikat
    var sheetSertifikat = ss.getSheetByName("Sertifikat");
    var certDate = new Date().toLocaleDateString('id-ID');
    
    // Hapus baris lama sertifikat untuk peserta ini jika sudah pernah di-generate sebelumnya
    var sData = sheetSertifikat.getDataRange().getValues();
    for (var k = sData.length - 1; k >= 1; k--) {
      if (sData[k][1] === pesertaId) {
        sheetSertifikat.deleteRow(k + 1);
      }
    }
    
    sheetSertifikat.appendRow([
      certId,
      pesertaId,
      pdfUrl,
      verifyUrl,
      "Aktif",
      certDate
    ]);
    
    return {
      success: true,
      certId: certId,
      pdfUrl: pdfUrl,
      verifyUrl: verifyUrl,
      date: certDate
    };
  } catch (err) {
    return { success: false, message: "Gagal memproses PDF: " + err.toString() };
  }
}

/**
 * Validasi Sertifikat publik berdasarkan ID sertifikat
 */
function verifySertifikat(certId) {
  setupDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Ambil sertifikat
  var sheetS = ss.getSheetByName("Sertifikat");
  var sData = sheetS.getDataRange().getValues();
  var certRow = null;
  
  for (var i = 1; i < sData.length; i++) {
    if (sData[i][0] === certId) {
      certRow = {
        id: sData[i][0],
        pesertaId: sData[i][1],
        pdfUrl: sData[i][2],
        verifyUrl: sData[i][3],
        status: sData[i][4],
        tanggalTerbit: sData[i][5] instanceof Date ? sData[i][5].toLocaleDateString('id-ID') : sData[i][5]
      };
      break;
    }
  }
  
  if (!certRow || certRow.status !== "Aktif") {
    return { valid: false };
  }
  
  // Ambil data peserta
  var sheetP = ss.getSheetByName("Peserta");
  var pData = sheetP.getDataRange().getValues();
  var pRow = null;
  
  for (var j = 1; j < pData.length; j++) {
    if (pData[j][0] === certRow.pesertaId) {
      pRow = {
        name: pData[j][2],
        nip: pData[j][3],
        instansi: pData[j][4],
        jabatan: pData[j][5],
        noCert: pData[j][6],
        nilai: pData[j][7],
        tanggal: pData[j][8] instanceof Date ? pData[j][8].toLocaleDateString('id-ID') : pData[j][8],
        folderId: pData[j][1]
      };
      break;
    }
  }
  
  if (!pRow) return { valid: false };
  
  // Ambil nama diklat
  var sheetF = ss.getSheetByName("FolderDiklat");
  var fData = sheetF.getDataRange().getValues();
  var diklatName = "Pelatihan Diklat";
  for (var k = 1; k < fData.length; k++) {
    if (fData[k][0] === pRow.folderId) {
      diklatName = fData[k][1];
      break;
    }
  }
  
  return {
    valid: true,
    certId: certRow.id,
    nama: pRow.name,
    nip: pRow.nip,
    instansi: pRow.instansi,
    jabatan: pRow.jabatan,
    nomorSertifikat: pRow.noCert,
    nilai: pRow.nilai,
    diklat: diklatName,
    tanggalTerbit: certRow.tanggalTerbit,
    pdfUrl: certRow.pdfUrl
  };
}

/**
 * Helper generator internal data
 */
function generateRandomCertNum() {
  var year = new Date().getFullYear();
  var rand = Math.floor(10437 + Math.random() * 500);
  return "800.2/4.1- " + rand + "/RSUDdrHJSK/" + year;
}

function extractFileIdFromUrl(url) {
  if (!url) return null;
  var match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}
`
  },
  {
    name: "Index.html",
    type: "html",
    description: "The main parent layout shell of the GAS training portal. Houses the full sidebar responsive layout, standard Google fonts, material icons, global modal containers, notification popups, page router templates, and connects the user interface to Apps Script data.",
    code: `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <title>Sistem Sertifikat Diklat Online</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Stylesheets -->
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <!-- CSS Bootstrap 5 -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    :root {
      --primary: #0F4C81;
      --secondary: #1E88E5;
      --accent: #00ACC1;
      --bg: #F5F7FA;
      --text: #2c3e50;
      --sidebar-width: 260px;
    }
    
    body {
      font-family: 'Poppins', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      overflow-x: hidden;
    }
    
    /* Sidebar Layout */
    .sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      width: var(--sidebar-width);
      background-color: var(--primary);
      color: white;
      z-index: 1000;
      box-shadow: 4px 0 10px rgba(0,0,0,0.1);
      transition: all 0.3s;
    }
    
    .sidebar-header {
      padding: 24px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .sidebar-header h5 {
      margin: 0;
      font-weight: 600;
      letter-spacing: 0.5px;
      font-size: 16px;
    }
    
    .sidebar-menu {
      padding: 20px 0;
      list-style: none;
      margin: 0;
    }
    
    .menu-item {
      padding: 12px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 4px solid transparent;
    }
    
    .menu-item:hover {
      background-color: rgba(255,255,255,0.05);
      color: white;
    }
    
    .menu-item.active {
      background-color: rgba(255,255,255,0.1);
      color: white;
      font-weight: 500;
      border-left-color: var(--accent);
    }
    
    .menu-item i {
      font-size: 20px;
    }
    
    /* Main Content Wrapper */
    .content-wrapper {
      margin-left: var(--sidebar-width);
      padding: 30px;
      min-height: 100vh;
      transition: all 0.3s;
    }
    
    .navbar-top {
      background-color: white;
      padding: 15px 30px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      margin-bottom: 30px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    /* Card Styles */
    .custom-card {
      background: white;
      border-radius: 12px;
      border: none;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      padding: 24px;
      margin-bottom: 24px;
    }
    
    .card-title-main {
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .accent-btn {
      background-color: var(--accent);
      color: white;
      border: none;
    }
    
    .primary-btn {
      background-color: var(--primary);
      color: white;
      border: none;
    }
    
    .secondary-btn {
      background-color: var(--secondary);
      color: white;
    }
    
    /* Loading Spinner */
    .loader-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(255,255,255,0.85);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      transition: all 0.3s;
    }
    
    .spinner-border {
      color: var(--primary);
      width: 3rem;
      height: 3rem;
    }
    
    /* Toast alerts */
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 3000;
    }
  </style>
</head>
<body>

  <!-- Loading State Screen -->
  <div id="loader" class="loader-overlay">
    <div class="spinner-border mb-3" role="status"></div>
    <h6 class="text-secondary fw-semibold">Memuat Data Sistem...</h6>
  </div>

  <!-- Main Grid Layout -->
  <div id="app" style="display:none;">
    
    <!-- Sidebar navigation banner -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <i class="material-icons text-info" style="font-size:32px;">verified</i>
        <div>
          <h5>Sertifikat Diklat</h5>
          <span class="text-light" style="font-size:10px; opacity:0.7;">INTEGRASI DRIVE & SHEETS</span>
        </div>
      </div>
      <ul class="sidebar-menu">
        <li>
          <a onclick="switchPage('dashboard')" id="nav-dashboard" class="menu-item active">
            <i class="material-icons">dashboard</i> Dashboard Admin
          </a>
        </li>
        <li>
          <a onclick="switchPage('folder')" id="nav-folder" class="menu-item">
            <i class="material-icons">folder_special</i> Folder Diklat
          </a>
        </li>
        <li>
          <a onclick="switchPage('peserta')" id="nav-peserta" class="menu-item">
            <i class="material-icons">people</i> Kelola Peserta
          </a>
        </li>
        <li>
          <a onclick="openVerificationSearch()" class="menu-item text-warning">
            <i class="material-icons">verified_user</i> Tes Verifikasi
          </a>
        </li>
      </ul>
      <div class="position-absolute bottom-0 w-100 p-3 text-center border-top border-white-50" style="background: rgba(0,0,0,0.1);">
         <span style="font-size: 11px;" class="text-light opacity-75">Admin Panel v2.1</span>
      </div>
    </aside>

    <!-- Content Center -->
    <main class="content-wrapper">
      
      <!-- Top navbar profile -->
      <header class="navbar-top">
        <div>
          <h4 id="page-title" class="mb-0 fw-semibold">Dashboard Utama</h4>
          <span style="font-size: 12px; color:#888;" id="page-subtitle">Rangkuman kinerja diklat dan sertifikasi aktif</span>
        </div>
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onclick="loadAllData()">
            <i class="material-icons" style="font-size:16px;">refresh</i> Segarkan
          </button>
          <div class="d-flex align-items-center gap-2">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" style="width:40px; height:40px; border-radius:50%; border:2px solid var(--accent);" alt="Avatar">
            <div class="d-none d-md-block text-start">
              <strong class="d-block" style="font-size:13px; line-height:1.2;">Meidi Dana</strong>
              <span class="text-muted" style="font-size:10px;">Manager Pelaksana</span>
            </div>
          </div>
        </div>
      </header>

      <!-- View Containers -->
      <div id="view-dashboard" class="page-view animate-fade">
        <?!= include('Dashboard'); ?>
      </div>
      
      <div id="view-folder" class="page-view animate-fade" style="display:none;">
        <?!= include('FolderDiklat'); ?>
      </div>
      
      <div id="view-peserta" class="page-view animate-fade" style="display:none;">
        <?!= include('Peserta'); ?>
      </div>

    </main>

  </div>

  <!-- Notification Toast wrapper -->
  <div class="toast-container"></div>

  <!-- Bootstrap Modal Verifikasi Dummy URL testing -->
  <div class="modal fade" id="modalVerifySearch" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header bg-warning text-dark border-0">
          <h5 class="modal-title d-flex align-items-center gap-2"><i class="material-icons">qr_code_scanner</i> Tes Validasi ID Sertifikat</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4">
          <p class="text-muted" style="font-size:13px;">Masukkan ID sertifikat (misal: CRT-XXXXX) untuk mencoba sistem verifikasi publik yang tersambung database.</p>
          <div class="mb-3">
            <label class="form-label font-sans font-medium">ID Sertifikasi: </label>
            <input type="text" class="form-control" id="search-verify-id" placeholder="CRT-F428AD2A...">
          </div>
          <button onclick="executeVerifySearch()" class="btn btn-warning w-100 text-dark font-medium d-flex align-items-center justify-content-center gap-2">
            <i class="material-icons">arrow_forward</i> Buka Halaman Verifikasi
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Scripts bundle -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  
  <script>
    var globalFolders = [];
    var globalPeserta = [];
    var currentFolderId = null;

    // Awal running
    window.onload = function() {
      loadAllData();
    };

    function loadAllData() {
      showLoading(true);
      google.script.run
        .withSuccessHandler(function(stats) {
          updateStatsDom(stats);
          
          // Muat folders
          google.script.run
            .withSuccessHandler(function(folders) {
              globalFolders = folders;
              renderFolderTable();
              updateFolderDropdowns();
              
              // Muat peserta
              google.script.run
                .withSuccessHandler(function(peserta) {
                  globalPeserta = peserta;
                  renderPesertaTable();
                  showLoading(false);
                  document.getElementById('app').style.display = 'block';
                })
                .withFailureHandler(handleErr)
                .getPeserta();
            })
            .withFailureHandler(handleErr)
            .getFolders();
        })
        .withFailureHandler(handleErr)
        .getDashboardStats();
    }

    function showLoading(status) {
      document.getElementById('loader').style.display = status ? 'flex' : 'none';
    }

    function handleErr(err) {
      showLoading(false);
      showToast('Error: ' + err.toString(), 'danger');
    }

    function updateStatsDom(stats) {
      document.getElementById('stat-total-folder').innerText = stats.totalFolders;
      document.getElementById('stat-total-peserta').innerText = stats.totalParticipants;
      document.getElementById('stat-total-cert').innerText = stats.totalCerts;
      document.getElementById('stat-total-terbit').innerText = stats.totalPublished;
    }

    function showToast(message, type = 'success') {
      var icon = type === 'success' ? 'check_circle' : (type === 'danger' ? 'error' : 'info');
      var bgClass = type === 'success' ? 'bg-success text-white' : (type === 'danger' ? 'bg-danger text-white' : 'bg-info text-dark');
      
      var toastHtml = \`
        <div class="toast align-items-center \${bgClass} border-0 show shadow-sm mb-2" role="alert" aria-live="assertive" aria-atomic="true" style="min-width:250px;">
          <div class="d-flex">
            <div class="toast-body d-flex align-items-center gap-2">
              <i class="material-icons font-size-18">\${icon}</i>
              <span>\${message}</span>
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      \`;
      document.querySelector('.toast-container').insertAdjacentHTML('beforeend', toastHtml);
      setTimeout(function() {
        var first = document.querySelector('.toast-container .toast');
        if (first) first.remove();
      }, 4000);
    }

    function switchPage(page) {
      document.querySelectorAll('.page-view').forEach(p => p.style.display = 'none');
      document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
      
      document.getElementById('view-' + page).style.display = 'block';
      document.getElementById('nav-' + page).classList.add('active');
      
      if (page === 'dashboard') {
        document.getElementById('page-title').innerText = 'Dashboard Utama';
        document.getElementById('page-subtitle').innerText = 'Rangkuman kinerja diklat dan sertifikasi aktif';
      } else if (page === 'folder') {
        document.getElementById('page-title').innerText = 'Folder Diklat';
        document.getElementById('page-subtitle').innerText = 'Kelola penyimpanan Google Drive dan Template per Diklat';
      } else if (page === 'peserta') {
        document.getElementById('page-title').innerText = 'Data Peserta';
        document.getElementById('page-subtitle').innerText = 'Manajemen pendaftaran peserta dan penerbitan sertifikat PDF';
      }
    }

    function openVerificationSearch() {
      var modal = new bootstrap.Modal(document.getElementById('modalVerifySearch'));
      modal.show();
    }

    function executeVerifySearch() {
      var id = document.getElementById('search-verify-id').value.trim();
      if (!id) {
        alert('Masukkan ID Sertifikat dulu!');
        return;
      }
      window.open('<?!= appUrl ?>?id=' + id, '_blank');
    }
  </script>
</body>
</html>
`
  },
  {
    name: "Dashboard.html",
    type: "html",
    description: "The primary administration overview block. Groups total folders count, certificates, participants metrics as modern glowing statistic cards, handles quick-shortcut commands, and includes the recent activity database preview lists.",
    code: `<div class="row">
  <div class="col-md-3">
    <div class="card border-0 shadow-sm p-4 text-white" style="background-color: var(--primary); border-radius: 12px; margin-bottom: 20px;">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h2 id="stat-total-folder" class="fw-bold mb-1">0</h2>
          <span style="font-size: 13px; opacity:0.85;">Total Folder Diklat</span>
        </div>
        <i class="material-icons" style="font-size: 40px; opacity: 0.5;">folder_open</i>
      </div>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card border-0 shadow-sm p-4 text-white" style="background-color: var(--secondary); border-radius: 12px; margin-bottom: 20px;">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h2 id="stat-total-peserta" class="fw-bold mb-1">0</h2>
          <span style="font-size: 13px; opacity:0.85;">Total Peserta</span>
        </div>
        <i class="material-icons" style="font-size: 40px; opacity: 0.5;">school</i>
      </div>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card border-0 shadow-sm p-4 text-white" style="background-color: var(--accent); border-radius: 12px; margin-bottom: 20px;">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h2 id="stat-total-cert" class="fw-bold mb-1">0</h2>
          <span style="font-size: 13px; opacity:0.85;">Sertifikat Terdaftar</span>
        </div>
        <i class="material-icons" style="font-size: 40px; opacity: 0.5;">assignment_turned_in</i>
      </div>
    </div>
  </div>
  <div class="col-md-3">
    <div class="card border-0 shadow-sm p-4 text-white" style="background-color: #2e7d32; border-radius: 12px; margin-bottom: 20px;">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h2 id="stat-total-terbit" class="fw-bold mb-1">0</h2>
          <span style="font-size: 13px; opacity:0.85;">Sertifikat Terbit</span>
        </div>
        <i class="material-icons" style="font-size: 40px; opacity: 0.5;">verified</i>
      </div>
    </div>
  </div>
</div>

<div class="row">
  <div class="col-lg-8">
    <div class="custom-card">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-semibold text-primary m-0">Alur Penerbitan Sertifikat</h5>
        <span class="badge bg-light text-primary border px-2 py-1">Otomatisasi Cloud</span>
      </div>
      <div class="row text-center my-3">
        <div class="col-md-3">
          <div class="p-3 bg-light rounded-3 shadow-2xs">
            <span class="badge bg-primary text-white mb-2">1</span>
            <p class="fw-semibold mb-1" style="font-size:12px;">Buat Folder</p>
            <span class="text-muted" style="font-size:10px;">Otomatis membuat subfolder di Google Drive utama</span>
          </div>
        </div>
        <div class="col-md-3">
          <div class="p-3 bg-light rounded-3 shadow-2xs">
            <span class="badge bg-secondary mb-2">2</span>
            <p class="fw-semibold mb-1" style="font-size:12px;">Upload Template</p>
            <span class="text-muted" style="font-size:10px;">Upload file template background JPG/PNG/PDF</span>
          </div>
        </div>
        <div class="col-md-3">
          <div class="p-3 bg-light rounded-3 shadow-2xs">
            <span class="badge bg-info text-white mb-2">3</span>
            <p class="fw-semibold mb-1" style="font-size:12px;">Tambah Peserta</p>
            <span class="text-muted" style="font-size:10px;">Input manual atau drop file Excel/CSV massal</span>
          </div>
        </div>
        <div class="col-md-3">
          <div class="p-3 bg-light rounded-3 shadow-2xs" style="border: 1px dashed var(--accent);">
            <span class="badge bg-success mb-2">4</span>
            <p class="fw-semibold mb-1" style="font-size:12px;">Penerbitan</p>
            <span class="text-muted" style="font-size:10px;">Satu klik generates PDF, QR Code & simpan ke Drive</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="col-lg-4">
    <div class="custom-card flex-grow-1">
      <h5 class="fw-semibold text-primary mb-3">Menu Cepat</h5>
      <div class="d-grid gap-2">
        <button onclick="switchPage('folder')" class="btn btn-outline-primary d-flex align-items-center justify-content-between p-2">
          <span class="d-flex align-items-center gap-2"><i class="material-icons">create_new_folder</i> Folder Baru</span>
          <i class="material-icons" style="font-size:16px;">chevron_right</i>
        </button>
        <button onclick="switchPage('peserta')" class="btn btn-outline-info text-dark d-flex align-items-center justify-content-between p-2">
          <span class="d-flex align-items-center gap-2"><i class="material-icons">person_add</i> Tambah Peserta</span>
          <i class="material-icons" style="font-size:16px;">chevron_right</i>
        </button>
      </div>
    </div>
  </div>
</div>
`
  },
  {
    name: "FolderDiklat.html",
    type: "html",
    description: "Training directory control view. Allows cataloging folders, configuring templates per folder via cloud file imports, managing metadata, editing names, and displaying active Drive resources.",
    code: `<div class="custom-card">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h5 class="card-title-main m-0"><i class="material-icons">folder</i> Manajemen Folder Diklat</h5>
    <button onclick="openAddFolderModal()" class="btn primary-btn d-flex align-items-center gap-2 px-3 py-2">
      <i class="material-icons">add_box</i> Buat Folder Baru
    </button>
  </div>
  
  <!-- Alert empty state -->
  <div id="no-folder-alert" class="alert alert-info text-center py-5 border-0 shadow-2xs" style="display:none; border-radius:12px;">
    <i class="material-icons" style="font-size: 48px; color: var(--primary);">folder_open</i>
    <p class="mt-2 text-dark font-semibold">Belum Ada Folder Diklat Terbuat</p>
    <p class="text-muted" style="font-size:12px;">Silakan klik tombol 'Buat Folder Baru' untuk mulai mengorganisasi diklat pelatihan Anda.</p>
  </div>
  
  <div class="table-responsive">
    <table class="table table-hover align-middle shadow-2xs" id="folder-table">
      <thead class="text-light" style="background: var(--primary);">
        <tr>
          <th style="border-radius: 8px 0 0 0;">ID</th>
          <th>Nama Folder Pelatihan</th>
          <th>Drive ID</th>
          <th>Status Template Background</th>
          <th style="border-radius: 0 8px 0 0;" class="text-end">Aksi</th>
        </tr>
      </thead>
      <tbody id="folder-table-body">
        <!-- Renders dynamically -->
      </tbody>
    </table>
  </div>
</div>

<!-- Modal Tambah/Ubah Folder -->
<div class="modal fade" id="modalFolder" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow">
      <div class="modal-header bg-primary text-white border-0">
        <h5 class="modal-title" id="folderModalTitle">Buat Folder Diklat Baru</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body p-4">
        <input type="hidden" id="folder-form-id">
        <div class="mb-3">
          <label class="form-label font-medium">Nama Pelatihan / Diklat:</label>
          <input type="text" class="form-control" id="folder-form-name" placeholder="misal: Pelatihan BTCLS Keperawatan 2026">
          <div class="form-text">Secara otomatis akan membuatkan Subfolder baru di file Google Drive utama Anda.</div>
        </div>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
          <button onclick="saveFolder()" class="btn primary-btn px-4">Simpan Folder</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Modal Upload Template -->
<div class="modal fade" id="modalTemplate" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow">
      <div class="modal-header bg-accent text-white border-0">
        <h5 class="modal-title d-flex align-items-center gap-2"><i class="material-icons">landscape</i> Upload Template Sertifikat</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body p-4">
        <input type="hidden" id="upload-folder-id">
        <p class="text-muted" style="font-size:12px;">Upload file background sertifikat (format PNG / JPG, dimensi lanskap A4 ideal 1920x1080 piksel). Peserta pada folder ini akan menggunakan template ini.</p>
        
        <div id="dropzone" class="border border-secondary border-dashed rounded-3 p-5 text-center cursor-pointer" onclick="triggerFileSelect()" style="border-style:dashed !important; background: #fafafa; border-width: 2px !important; border-color: var(--accent) !important;">
          <i class="material-icons mb-2 text-info" style="font-size:48px;">cloud_upload</i>
          <h6>Klik atau Tarik File Template ke Sini</h6>
          <span style="font-size:10px;" class="text-muted d-block">Maksimal resolusi 2000px, JPEG/PNG</span>
          <input type="file" id="template-file-input" style="display:none;" onchange="handleFileSelect(event)">
        </div>
        <div id="file-upload-status" class="mt-3" style="display:none;"></div>
      </div>
    </div>
  </div>
</div>

<script>
  function renderFolderTable() {
    var tbody = document.getElementById('folder-table-body');
    tbody.innerHTML = '';
    
    if (globalFolders.length === 0) {
      document.getElementById('no-folder-alert').style.display = 'block';
      document.getElementById('folder-table').style.display = 'none';
      return;
    }
    
    document.getElementById('no-folder-alert').style.display = 'none';
    document.getElementById('folder-table').style.display = 'table';
    
    globalFolders.forEach(function(f) {
      var templateStatus = f.templateUrl ? 
        '<span class="badge bg-success-subtle text-success border border-success-subtle font-weight-bold">✓ Tersedia</span>' : 
        '<span class="badge bg-warning-subtle text-warning border border-warning-subtle font-weight-bold">⚠ Default Gradient</span>';
      
      var row = \`
        <tr>
          <td class="font-mono text-xs fw-semibold text-secondary">\${f.id}</td>
          <td class="fw-medium text-dark">\${f.name}</td>
          <td class="font-mono text-xs" style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${f.driveId}</td>
          <td>\${templateStatus}</td>
          <td class="text-end">
            <button onclick="openUploadTemplateModal('\${f.id}')" class="btn btn-sm text-white" style="background-color: var(--accent);" title="Upload Template BG"><i class="material-icons">landscape</i></button>
            <button onclick="openEditFolderModal('\${f.id}', '\${encodeURIComponent(f.name)}')" class="btn btn-sm btn-outline-secondary" title="Edit Nama Folder"><i class="material-icons">edit</i></button>
            <button onclick="deleteFolderConfirm('\${f.id}')" class="btn btn-sm btn-outline-danger" title="Hapus Folder"><i class="material-icons">delete</i></button>
          </td>
        </tr>
      \`;
      tbody.insertAdjacentHTML('beforeend', row);
    });
  }

  function openAddFolderModal() {
    document.getElementById('folderModalTitle').innerText = 'Buat Folder Diklat Baru';
    document.getElementById('folder-form-id').value = '';
    document.getElementById('folder-form-name').value = '';
    var modal = new bootstrap.Modal(document.getElementById('modalFolder'));
    modal.show();
  }

  function openEditFolderModal(id, encodedName) {
    document.getElementById('folderModalTitle').innerText = 'Ubah Nama Folder Diklat';
    document.getElementById('folder-form-id').value = id;
    document.getElementById('folder-form-name').value = decodeURIComponent(encodedName);
    var modal = new bootstrap.Modal(document.getElementById('modalFolder'));
    modal.show();
  }

  function saveFolder() {
    var id = document.getElementById('folder-form-id').value;
    var name = document.getElementById('folder-form-name').value.trim();
    if (!name) {
      alert('Nama Folder Pelatihan wajib diisi!');
      return;
    }
    
    bootstrap.Modal.getInstance(document.getElementById('modalFolder')).hide();
    showLoading(true);
    
    if (id) {
      google.script.run
        .withSuccessHandler(function(res) {
          showToast('Nama folder berhasil diubah.');
          loadAllData();
        })
        .withFailureHandler(handleErr)
        .renameFolder(id, name);
    } else {
      google.script.run
        .withSuccessHandler(function(res) {
          showToast('Folder pelatihan beserta Google Drive subfolder berhasil dibuat.');
          loadAllData();
        })
        .withFailureHandler(handleErr)
        .createFolder(name);
    }
  }

  function deleteFolderConfirm(id) {
    if (confirm('PERINGATAN: Menghapus folder diklat akan menghapus data semua peserta dan sertifikasi terkait di dalamnya secara permanen, serta membuang folder di Drive ke sampah. Yakin lanjutkan?')) {
      showLoading(true);
      google.script.run
        .withSuccessHandler(function() {
          showToast('Folder berhasil dihapus beserta seluruh relasi data peserta.', 'danger');
          loadAllData();
        })
        .withFailureHandler(handleErr)
        .deleteFolder(id);
    }
  }

  function openUploadTemplateModal(folderId) {
    document.getElementById('upload-folder-id').value = folderId;
    document.getElementById('file-upload-status').style.display = 'none';
    var modal = new bootstrap.Modal(document.getElementById('modalTemplate'));
    modal.show();
  }

  function triggerFileSelect() {
    document.getElementById('template-file-input').click();
  }

  function handleFileSelect(e) {
    var file = e.target.files[0];
    if (!file) return;
    
    uploadTemplateRaw(file);
  }

  function uploadTemplateRaw(file) {
    var folderId = document.getElementById('upload-folder-id').value;
    var uploadStatus = document.getElementById('file-upload-status');
    
    uploadStatus.style.display = 'block';
    uploadStatus.innerHTML = \`<div class="progress mb-2"><div class="progress-bar progress-bar-striped progress-bar-animated bg-info" style="width: 100%"></div></div><span class="text-info font-medium d-block text-center mb-1">Sedang mengunggah dan mengonversi template...</span>\`;
    
    var reader = new FileReader();
    reader.onload = function(evt) {
      var base64Data = evt.target.result;
      
      google.script.run
        .withSuccessHandler(function(res) {
          if (res.success) {
            uploadStatus.innerHTML = \`<span class="text-success fw-bold">✓ Template berhasil diperbarui dan dipasang!</span>\`;
            bootstrap.Modal.getInstance(document.getElementById('modalTemplate')).hide();
            showToast('Template sertifikat berhasil diunggah.');
            loadAllData();
          } else {
            uploadStatus.innerHTML = \`<span class="text-danger fw-bold">Gagal: \${res.message}</span>\`;
          }
        })
        .withFailureHandler(function(err) {
          uploadStatus.innerHTML = \`<span class="text-danger fw-bold">Error: \${err.toString()}</span>\`;
        })
        .uploadTemplate(folderId, file.name, base64Data);
    };
    reader.readAsDataURL(file);
  }
</script>
`
  },
  {
    name: "Peserta.html",
    type: "html",
    description: "Detailed participant management roster. Controls manual creation and spreadsheet CSV bulk drops, dynamic searchable filters (Name, NIP, Certificate Code, Diklat category), and PDF rendering triggers inside the GAS workspace.",
    code: `<div class="custom-card mb-4 mb-4">
  <div class="row align-items-center g-3">
    <div class="col-md-4">
      <label class="form-label font-medium text-primary">Saring Folder Pelatihan:</label>
      <select onchange="onFolderFilterChanged()" id="filter-folder-select" class="form-select border-info font-medium">
        <option value="">-- Semua Folder Diklat --</option>
      </select>
    </div>
    <div class="col-md-5">
      <label class="form-label font-medium text-primary">Pencarian Cepat:</label>
      <div class="input-group">
        <span class="input-group-text bg-light"><i class="material-icons font-size-18">search</i></span>
        <input oninput="onPesertaSearch()" type="text" id="peserta-search-input" class="form-control" placeholder="Cari berdasarkan nama, NIP, instansi, No Sertifikat...">
      </div>
    </div>
    <div class="col-md-3 text-end d-flex align-items-end justify-content-end gap-2 mt-auto" style="height:100%;">
      <button onclick="openImportModal()" class="btn btn-outline-secondary d-flex align-items-center gap-1">
        <i class="material-icons">cloud_upload</i> Import CSV
      </button>
      <button onclick="openAddPesertaModal()" class="btn primary-btn d-flex align-items-center gap-1">
        <i class="material-icons">person_add</i> Tambah
      </button>
    </div>
  </div>
</div>

<div class="custom-card">
  <div class="table-responsive">
    <table class="table table-hover align-middle shadow-2xs">
      <thead class="text-white" style="background-color: var(--secondary);">
        <tr>
          <th style="border-radius: 8px 0 0 0;">ID Peserta</th>
          <th>Nama Lengkap & NIP</th>
          <th>Instansi / Jabatan</th>
          <th>Pelatihan Diklat</th>
          <th>No Sertifikat (Nilai)</th>
          <th>Status Dokumen</th>
          <th style="border-radius: 0 8px 0 0;" class="text-end">Aksi Penerbitan</th>
        </tr>
      </thead>
      <tbody id="peserta-table-body">
        <!-- Renders dynamically -->
      </tbody>
    </table>
  </div>
</div>

<!-- Modal Tambah / Edit Peserta -->
<div class="modal fade" id="modalPeserta" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content border-0 shadow">
      <div class="modal-header bg-secondary text-white border-0">
        <h5 class="modal-title" id="pesertaModalTitle">Pendaftaran Peserta Diklat</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body p-4">
        <input type="hidden" id="peserta-form-id">
        <div class="row g-3">
          <div class="col-md-12">
            <label class="form-label font-medium">Pilih Folder Diklat Pelaksanaan:</label>
            <select id="peserta-form-folder" class="form-select"></select>
          </div>
          <div class="col-md-6">
            <label class="form-label font-medium">Nama Lengkap & Gelar:</label>
            <input type="text" class="form-control" id="peserta-form-name" placeholder="dr. Ahmad Sucipto, Sp.An">
          </div>
          <div class="col-md-6">
            <label class="form-label font-medium">NIP / ID Kepegawaian:</label>
            <input type="text" class="form-control" id="peserta-form-nip" placeholder="198327484392434...">
          </div>
          <div class="col-md-6">
            <label class="form-label font-medium">Instansi:</label>
            <input type="text" class="form-control" id="peserta-form-instansi" placeholder="RSUP Dr. Sardjito">
          </div>
          <div class="col-md-6">
            <label class="form-label font-medium">Jabatan / Profesi:</label>
            <input type="text" class="form-control" id="peserta-form-jabatan" placeholder="Kepala Ruang ICU, Perawat Pelaksana">
          </div>
          <div class="col-md-6">
            <label class="form-label font-medium">Nomor Sertifikat:</label>
            <input type="text" class="form-control" id="peserta-form-cert-num" placeholder="800.2/4.1- 10437/RSUDdrHJSK/2026 (Kosongkan jika auto)">
          </div>
          <div class="col-md-3">
            <label class="form-label font-medium">Nilai Evaluasi (0-100):</label>
            <input type="number" class="form-control" id="peserta-form-score" min="0" max="100" placeholder="85">
          </div>
          <div class="col-md-3">
            <label class="form-label font-medium">Tanggal Selesai Diklat:</label>
            <input type="text" class="form-control" id="peserta-form-date" placeholder="04/06/2026">
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
          <button onclick="savePeserta()" class="btn btn-primary px-4 bg-secondary border-0">Simpan Data</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Modal Bulk Import -->
<div class="modal fade" id="modalImport" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow">
      <div class="modal-header bg-dark text-white border-0">
        <h5 class="modal-title d-flex align-items-center gap-2"><i class="material-icons">library_add</i> Import Peserta (File CSV / Excel)</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body p-4">
        <div class="mb-3">
          <label class="form-label font-medium">Pilih Folder Diklat Tujuan:</label>
          <select id="import-folder-select" class="form-select border-info"></select>
        </div>
        <p class="text-muted" style="font-size:11px;">Format File CSV harus memiliki baris header persis seperti di bawah atau dipisah koma:<br />
        <code class="d-block p-2 bg-light border text-primary">name,nip,instansi,jabatan,noSertifikat,nilai,tanggal</code>
        </p>
        <div class="mt-3 border border-dashed rounded-3 p-4 text-center cursor-pointer" onclick="triggerCsvSelect()" style="background:#fafafa;">
          <i class="material-icons text-muted" style="font-size:36px;">table_chart</i>
          <h6 class="mt-2" style="font-size:14px;">Klik untuk Memilih File .csv</h6>
          <input type="file" id="csv-file-input" style="display:none;" onchange="handleCsvFile(event)" accept=".csv">
        </div>
        <div id="import-status-area" class="mt-3" style="display:none;"></div>
      </div>
    </div>
  </div>
</div>

<!-- Modal Sertifikat Terbit Info -->
<div class="modal fade" id="modalCertSuccess" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow text-center">
      <div class="modal-body p-5">
        <i class="material-icons text-success" style="font-size:72px;">verified</i>
        <h4 class="mt-3 text-success fw-bold">Sertifikat Berhasil Diterbitkan!</h4>
        <p class="text-muted" style="font-size:13px;">File cetak PDF telah otomatis di-generate, diunggah ke Google Drive di folder diklat terkait, dan validasi QR Code publik telah aktif aman.</p>
        
        <div class="d-grid gap-2 mt-4">
          <a id="success-pdf-link" href="#" target="_blank" class="btn btn-success d-flex align-items-center justify-content-center gap-2 font-medium">
            <i class="material-icons">cloud_download</i> Unduh PDF Sertifikat
          </a>
          <a id="success-verify-link" href="#" target="_blank" class="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2 font-medium">
            <i class="material-icons">verified_user</i> Buka Verifikasi QR Link
          </a>
          <button type="button" class="btn btn-light border mt-2" data-bs-dismiss="modal">Selesai</button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  function updateFolderDropdowns() {
    var dropFilter = document.getElementById('filter-folder-select');
    var dropForm = document.getElementById('peserta-form-folder');
    var dropImport = document.getElementById('import-folder-select');
    
    // reset
    dropFilter.innerHTML = '<option value="">-- Semua Folder Diklat --</option>';
    dropForm.innerHTML = '';
    dropImport.innerHTML = '';
    
    globalFolders.forEach(function(f) {
      var itemHtml = \`<option value="\${f.id}">\${f.name}</option>\`;
      dropFilter.insertAdjacentHTML('beforeend', itemHtml);
      dropForm.insertAdjacentHTML('beforeend', itemHtml);
      dropImport.insertAdjacentHTML('beforeend', itemHtml);
    });
  }

  function renderPesertaTable(filteredData = null) {
    var tbody = document.getElementById('peserta-table-body');
    tbody.innerHTML = '';
    
    var dataToRender = filteredData !== null ? filteredData : globalPeserta;
    
    if (dataToRender.length === 0) {
      tbody.innerHTML = \`
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="material-icons d-block font-size-36 text-muted">people_outline</i>
            Tidak ada data peserta ditemukan pada kriteria pencarian ini.
          </td>
        </tr>
      \`;
      return;
    }
    
    dataToRender.forEach(function(p) {
      var folderName = "Unknown";
      var matchingFolder = globalFolders.find(f => f.id === p.folderId);
      if (matchingFolder) folderName = matchingFolder.name;
      
      var certBadge = '';
      var actionBtnHtml = '';
      
      if (p.sertifikat) {
        certBadge = \`<span class="badge bg-success-subtle text-success border border-success-subtle d-inline-block font-weight-bold mb-1">✓ Terbit (\${p.sertifikat.id.substring(0,8)})</span><br />
                    <span style="font-size:10px;" class="text-muted">PDF di Google Drive</span>\`;
        actionBtnHtml = \`
          <a href="\${p.sertifikat.linkPdf}" target="_blank" class="btn btn-sm btn-success text-white" title="Download PDF"><i class="material-icons">cloud_download</i></a>
          <a href="\${p.sertifikat.qrLink}" target="_blank" class="btn btn-sm btn-outline-info" title="Halaman Verifikasi"><i class="material-icons">verified_user</i></a>
          <button onclick="triggerGenerateSertifikat('\${p.id}')" class="btn btn-sm btn-outline-secondary" title="Re-Generate Cetakan Baru"><i class="material-icons">replay</i></button>
        \`;
      } else {
        certBadge = \`<span class="badge bg-danger-subtle text-danger border border-danger-subtle font-weight-bold">⚠ Belum Rilis</span>\`;
        actionBtnHtml = \`
          <button onclick="triggerGenerateSertifikat('\${p.id}')" class="btn btn-sm text-white font-medium px-2 py-1 bg-success border-0 d-flex align-items-center gap-1" title="Generate PDF & QR Sekarang"><i class="material-icons">auto_awesome</i> Rilis Sertifikat</button>
        \`;
      }
      
      var pRow = \`
        <tr>
          <td class="font-mono text-xs fw-semibold text-secondary">\${p.id}</td>
          <td>
            <strong class="d-block text-dark">\${p.name}</strong>
            <span style="font-size:11px;" class="text-muted">NIP: \${p.nip || '-'}</span>
          </td>
          <td>
            <span class="d-block fw-medium text-dark">\${p.instansi}</span>
            <span style="font-size:11px;" class="text-muted">\${p.jabatan}</span>
          </td>
          <td class="small" style="max-width:180px; overflow:hidden; font-weight:500;">\${folderName}</td>
          <td>
            <span class="font-mono text-xs text-dark fw-medium d-block">\${p.noSertifikat}</span>
            <span style="font-size:10px;" class="text-muted">Nilai: <strong>\${p.nilai}</strong> | Tanggal: \${p.tanggal}</span>
          </td>
          <td>\${certBadge}</td>
          <td class="text-end">
            <div class="d-flex justify-content-end gap-1">
              \${actionBtnHtml}
              <button onclick="openEditPesertaModal('\${p.id}')" class="btn btn-sm btn-outline-secondary" title="Edit Data"><i class="material-icons">edit</i></button>
              <button onclick="deletePesertaConfirm('\${p.id}')" class="btn btn-sm btn-outline-danger" title="Hapus"><i class="material-icons">delete_sweep</i></button>
            </div>
          </td>
        </tr>
      \`;
      tbody.insertAdjacentHTML('beforeend', pRow);
    });
  }

  function onFolderFilterChanged() {
    var val = document.getElementById('filter-folder-select').value;
    currentFolderId = val || null;
    applySearchFilter();
  }

  function onPesertaSearch() {
    applySearchFilter();
  }

  function applySearchFilter() {
    var query = document.getElementById('peserta-search-input').value.trim().toLowerCase();
    
    var filtered = globalPeserta.filter(function(p) {
      var matchFolder = !currentFolderId || p.folderId === currentFolderId;
      var matchQuery = !query || 
         p.name.toLowerCase().includes(query) || 
         p.nip.toLowerCase().includes(query) || 
         p.instansi.toLowerCase().includes(query) || 
         p.noSertifikat.toLowerCase().includes(query) || 
         p.jabatan.toLowerCase().includes(query);
         
      return matchFolder && matchQuery;
    });
    
    renderPesertaTable(filtered);
  }

  function openAddPesertaModal() {
    document.getElementById('pesertaModalTitle').innerText = 'Pendaftaran Peserta Diklat';
    document.getElementById('peserta-form-id').value = '';
    document.getElementById('peserta-form-name').value = '';
    document.getElementById('peserta-form-nip').value = '';
    document.getElementById('peserta-form-instansi').value = '';
    document.getElementById('peserta-form-jabatan').value = '';
    document.getElementById('peserta-form-cert-num').value = '';
    document.getElementById('peserta-form-score').value = '85';
    document.getElementById('peserta-form-date').value = new Date().toLocaleDateString('id-ID');
    
    var modal = new bootstrap.Modal(document.getElementById('modalPeserta'));
    modal.show();
  }

  function openEditPesertaModal(id) {
    var p = globalPeserta.find(x => x.id === id);
    if (!p) return;
    
    document.getElementById('pesertaModalTitle').innerText = 'Edit Data Peserta';
    document.getElementById('peserta-form-id').value = p.id;
    document.getElementById('peserta-form-folder').value = p.folderId;
    document.getElementById('peserta-form-name').value = p.name;
    document.getElementById('peserta-form-nip').value = p.nip;
    document.getElementById('peserta-form-instansi').value = p.instansi;
    document.getElementById('peserta-form-jabatan').value = p.jabatan;
    document.getElementById('peserta-form-cert-num').value = p.noSertifikat;
    document.getElementById('peserta-form-score').value = p.nilai;
    document.getElementById('peserta-form-date').value = p.tanggal;
    
    var modal = new bootstrap.Modal(document.getElementById('modalPeserta'));
    modal.show();
  }

  function savePeserta() {
    var id = document.getElementById('peserta-form-id').value;
    var name = document.getElementById('peserta-form-name').value.trim();
    if (!name) { alert('Nama Lengkap wajib diisi!'); return; }
    
    var data = {
      folderId: document.getElementById('peserta-form-folder').value,
      name: name,
      nip: document.getElementById('peserta-form-nip').value.trim() || '-',
      instansi: document.getElementById('peserta-form-instansi').value.trim() || '-',
      jabatan: document.getElementById('peserta-form-jabatan').value.trim() || '-',
      noSertifikat: document.getElementById('peserta-form-cert-num').value.trim() || 'AUTO-GENERATED',
      nilai: document.getElementById('peserta-form-score').value || '80',
      tanggal: document.getElementById('peserta-form-date').value || new Date().toLocaleDateString('id-ID')
    };
    
    bootstrap.Modal.getInstance(document.getElementById('modalPeserta')).hide();
    showLoading(true);
    
    if (id) {
      google.script.run
        .withSuccessHandler(function() {
          showToast('Data peserta berhasil diperbarui.');
          loadAllData();
        })
        .withFailureHandler(handleErr)
        .updatePeserta(id, data);
    } else {
      google.script.run
        .withSuccessHandler(function() {
          showToast('Peserta baru berhasil ditambahkan.');
          loadAllData();
        })
        .withFailureHandler(handleErr)
        .addPeserta(data);
    }
  }

  function deletePesertaConfirm(id) {
    if (confirm('Yakin ingin menghapus data peserta beserta file sertifikat terkait di Drive?')) {
      showLoading(true);
      google.script.run
        .withSuccessHandler(function() {
          showToast('Data peserta terhapus.', 'danger');
          loadAllData();
        })
        .withFailureHandler(handleErr)
        .deletePeserta(id);
    }
  }

  function triggerGenerateSertifikat(pId) {
    showLoading(true);
    google.script.run
      .withSuccessHandler(function(res) {
        showLoading(false);
        if (res.success) {
          document.getElementById('success-pdf-link').href = res.pdfUrl;
          document.getElementById('success-verify-link').href = res.verifyUrl;
          
          var modal = new bootstrap.Modal(document.getElementById('modalCertSuccess'));
          modal.show();
          
          loadAllData();
        } else {
          alert('Gagal menerbitkan sertifikat: ' + res.message);
        }
      })
      .withFailureHandler(handleErr)
      .generateSertifikat(pId);
  }

  function openImportModal() {
    var modal = new bootstrap.Modal(document.getElementById('modalImport'));
    modal.show();
  }

  function triggerCsvSelect() {
    document.getElementById('csv-file-input').click();
  }

  function handleCsvFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    
    var fId = document.getElementById('import-folder-select').value;
    var statusDiv = document.getElementById('import-status-area');
    
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = '<div class="spinner-border spinner-border-sm text-secondary"></div> Sedang mengolah data...';
    
    var reader = new FileReader();
    reader.onload = function(evt) {
      var text = evt.target.result;
      var rows = text.split('\\n');
      var parsedData = [];
      
      // Ambil header di baris 0
      var headers = rows[0].replace('\\r', '').split(',');
      for (var i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        var cols = rows[i].replace('\\r', '').split(',');
        
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          var hName = headers[j].trim();
          obj[hName] = cols[j] ? cols[j].trim() : '';
        }
        parsedData.push(obj);
      }
      
      // Kirim via GAS
      google.script.run
        .withSuccessHandler(function(res) {
          bootstrap.Modal.getInstance(document.getElementById('modalImport')).hide();
          showToast('Berhasil mengimpor ' + res.count + ' data peserta!');
          loadAllData();
        })
        .withFailureHandler(function(err) {
          statusDiv.innerHTML = '<span class="text-danger">Gagal proses: ' + err.toString() + '</span>';
        })
        .importPesertaBulk(fId, parsedData);
    };
    reader.readAsText(file);
  }
</script>
`
  },
  {
    name: "Verify.html",
    type: "html",
    description: "Public certificate credential verification portal. Renders full training details, scores, issuance dates, validation state, and allows participants or institutions to download the database PDF copy.",
    code: `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <title>Verifikasi Keaslian Sertifikat Diklat</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #0f4c8112 0%, #1e88e51a 100%);
      color: #2c3e50;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .verify-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(15, 76, 129, 0.12);
      border: 1px solid rgba(15, 76, 129, 0.1);
      overflow: hidden;
      width: 100%;
      max-width: 600px;
    }
    .verify-status {
      padding: 30px;
      text-align: center;
    }
    .status-ok {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    .status-fail {
      background-color: #ffebee;
      color: #c62828;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 24px;
      border-bottom: 1px solid #f0f4f8;
    }
    .data-lbl {
      color: #8293a6;
      font-size: 13px;
      font-weight: 500;
    }
    .data-val {
      font-weight: 600;
      font-size: 14px;
      color: #0f4c81;
      text-align: right;
    }
    .verify-brand {
      padding: 16px;
      background-color: #0F4C81;
      color: white;
      text-align: center;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>

  <div class="verify-card">
    
    <div id="loader" class="text-center p-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-3 text-muted" style="font-size:13px;">Menghubungkan ke Server Cloud Database...</p>
    </div>

    <!-- Tampilan Valid -->
    <div id="layout-ok" style="display:none;">
      <div class="verify-status status-ok">
        <i class="material-icons mb-2" style="font-size:56px;">verified</i>
        <h4 class="fw-bold mb-1">SENTRAL SERTIFIKAT VALID</h4>
        <span style="font-size: 12px;" class="fw-semibold text-secondary">ID Kredensial: <span id="cert-id-lbl">CRT-XXXXXX</span></span>
      </div>
      
      <div class="bg-light p-3 border-bottom border-top text-center">
        <span class="badge bg-success px-3 py-1 font-sans">100% TERVERIFIKASI ASLI</span>
        <p class="text-muted mb-0 mt-2" style="font-size:11px;">Kredensial sertifikat di bawah ini terdaftar secara sah dalam database sistem diklat resmi pelaksana keperawatan.</p>
      </div>

      <div>
        <div class="data-row">
          <span class="data-lbl">Nama Peserta:</span>
          <span class="data-val" id="val-nama">-</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">NIP / ID:</span>
          <span class="data-val" id="val-nip">-</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">Instansi Pemilik:</span>
          <span class="data-val" id="val-instansi">-</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">Jabatan:</span>
          <span class="data-val" id="val-jabatan">-</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">Pelatihan Diklat:</span>
          <span class="data-val text-primary" id="val-diklat">-</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">Nomor Sertifikat:</span>
          <span class="data-val" id="val-nomor">-</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">Predikat Nilai Evaluasi:</span>
          <span class="data-val" id="val-nilai">-</span>
        </div>
        <div class="data-row">
          <span class="data-lbl">Tanggal Terbit Kelulusan:</span>
          <span class="data-val" id="val-tgl">-</span>
        </div>
      </div>

      <div class="p-4 d-grid gap-2 border-top">
        <a id="btn-download-pdf" href="#" target="_blank" class="btn btn-primary bg-primary border-0 d-flex align-items-center justify-content-center gap-2">
          <i class="material-icons">cloud_download</i> Unduh PDF Sertifikat Asli
        </a>
      </div>
    </div>

    <!-- Tampilan Tidak Valid -->
    <div id="layout-err" style="display:none;">
      <div class="verify-status status-fail py-5">
        <i class="material-icons mb-3" style="font-size:64px;">gpp_maybe</i>
        <h4 class="fw-bold mb-2">SERTIFIKAT TIDAK VALID</h4>
        <p class="text-muted px-4" style="font-size:13px;">ID sertifikat yang Anda masukkan tidak terdaftar dalam pangkalan database kami, atau status sertifikat telah ditangguhkan sementara.</p>
        <div class="mt-4">
          <button onclick="window.close()" class="btn btn-outline-danger px-4">Tutup Halaman</button>
        </div>
      </div>
    </div>

    <!-- Footer brand -->
    <div class="verify-brand">
       SISTEM SERTIFIKAT DIKLAT ONLINE © 2026
    </div>

  </div>

  <script>
    var certId = "<?= certId ?>";
    
    window.onload = function() {
      if (!certId) {
        showErrorView();
        return;
      }
      
      google.script.run
        .withSuccessHandler(function(res) {
          document.getElementById('loader').style.display = 'none';
          if (res && res.valid) {
            showSuccessView(res);
          } else {
            showErrorView();
          }
        })
        .withFailureHandler(function(err) {
          document.getElementById('loader').style.display = 'none';
          showErrorView();
        })
        .verifySertifikat(certId);
    };

    function showSuccessView(data) {
      document.getElementById('cert-id-lbl').innerText = data.certId;
      document.getElementById('val-nama').innerText = data.nama;
      document.getElementById('val-nip').innerText = data.nip;
      document.getElementById('val-instansi').innerText = data.instansi;
      document.getElementById('val-jabatan').innerText = data.jabatan;
      document.getElementById('val-diklat').innerText = data.diklat;
      document.getElementById('val-nomor').innerText = data.nomorSertifikat;
      document.getElementById('val-nilai').innerText = data.nilai + ' / 100';
      document.getElementById('val-tgl').innerText = data.tanggalTerbit;
      
      document.getElementById('btn-download-pdf').href = data.pdfUrl;
      
      document.getElementById('layout-ok').style.display = 'block';
    }

    function showErrorView() {
      document.getElementById('loader').style.display = 'none';
      document.getElementById('layout-err').style.display = 'block';
    }
  </script>
</body>
</html>
`
  },
  {
    name: "Dokumentasi Lengkap.md",
    type: "md",
    description: "Full configuration and step-by-step instructions (in Indonesian) explaining how to construct the sheet tables, set up folder permissions, copy-paste the Apps Script files, and deploy successfully in less than 5 minutes.",
    code: `# Petunjuk Pemasangan Sistem Sertifikat Diklat Online

Sistem ini didesain beroperasi secara penuh menggunakan ekosistem Google:
*   **Google Apps Script (GAS)** sebagai Web Application Engine & API Serverless.
*   **Google Sheets** sebagai Cloud Database penampung Metadata.
*   **Google Drive** sebagai Cloud Storage berkas cetak sertifikat PDF & Upload Template.

---

## Langkah 1: Persiapan Google Sheets & Drive

1.  Buka **Google Drive** Anda.
2.  Buat Folder baru bernama, contoh: \`DIKLAT UTAMA\` (atau apa pun pilihan Anda).
3.  Buka folder tersebut, lalu salin **ID Folder** dari tautan peramban Anda.
    *   *Contoh tautan:* \`https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ\`
    *   *ID Folder Anda adalah:* \`1aBcDeFgHiJkLmNoPqRsTuVwXyZ\`
4.  Di dalam folder tersebut, buatlah berkas **Google Sheets** baru dengan nama bebas (misal: \`Database Sertifikat Diklat\`).

---

## Langkah 2: Memasang Kode Google Apps Script

1.  Di dalam Google Sheets Anda, klik menu **Ekstensi (Extensions)** > **Apps Script**.
2.  Hapus berkas kode default kosong di editor Apps Script.
3.  Buat berkas kode pendukung dengan struktur nama persis seperti di bawah ini, lalu salin berkas dari aplikasi simulator kami:
    
    *   Buat berkas script: **\`Code\`** (otomatis bertipe \`.gs\`) -> masukkan isi dari **Code.gs**
        *   **Penting**: Baris \`var PARENT_FOLDER_ID = "1dUcuP_LownZK-q6Cd4ecg94T9ZggHGXX";\` di bagian paling atas sudah kami isi secara otomatis dengan ID Folder Drive Anda. Anda dapat langsung menggunakannya!
    *   Buat berkas HTML: **\`Index\`** -> masukkan isi dari **Index.html**
    *   Buat berkas HTML: **\`Dashboard\`** -> masukkan isi dari **Dashboard.html**
    *   Buat berkas HTML: **\`FolderDiklat\`** -> masukkan isi dari **FolderDiklat.html**
    *   Buat berkas HTML: **\`Peserta\`** -> masukkan isi dari **Peserta.html**
    *   Buat berkas HTML: **\`Verify\`** -> masukkan isi dari **Verify.html**

---

## Langkah 3: Menjalankan Fungsi Awal & Keamanan

1.  Pada dropdown fungsi di bagian atas aplikasi Apps Script, pilih fungsi **\`setupDatabase\`** kemudian klik tombol **Run** (Jalankan).
2.  Google akan meminta perizinan keamanan (OAuth):
    *   Klik **Tinjau Izin (Review Permissions)**.
    *   Pilih akun Google Anda.
    *   Klik **Lanjutan (Advanced)** di bagian bawah sebelah kiri.
    *   Klik **Buka Database Sertifikat Diklat (tidak aman)**.
    *   Klik **Izinkan (Allow)**.
3.  Fungsi ini akan otomatis mendeteksi dan membangun Google Sheets Anda dengan struktur kolom (\`FolderDiklat\`, \`Peserta\`, dan \`Sertifikat\`) lengkap beserta pewarnaan tajam secara otomatis.

---

## Langkah 4: Publikasi sebagai Web App

1.  Klik tombol biru **Terapkan (Deploy)** di bagian kanan atas > pilih **Penerapan Baru (New Deployment)**.
2.  Klik ikon roda gigi (Select type) > pilih **Aplikasi Web (Web App)**.
3.  Konfigurasikan setelan:
    *   **Deskripsi (Description):** \`Rilis v1.0.0\`
    *   **Jalankan sebagai (Execute as):** \`Saya / Me (Email Anda)\` (Ini agar aplikasi dapat membuat folder & menulis sheet menggunakan kredensial Anda)
    *   **Siapa yang memiliki akses (Who has access):** \`Siapa saja / Anyone\` (Ini adalah wajib agar pihak luar / publik dapat mengakses halaman verifikasi QR Code secara langsung tanpa perlu login akun Google Anda)
4.  Klik tombol **Terapkan (Deploy)**.
5.  Salin tautan **Aplikasi Web (URL Web App)** yang diberikan.
    *   *Tipe tautan:* \`https://script.google.com/macros/s/AKfycbz.../exec\`
6.  Selesai! Buka tautan tersebut di peramban Anda untuk menggunakan admin panel online Anda yang sangat canggih dan profesional.
`
  }
];
