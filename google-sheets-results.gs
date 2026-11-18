// Paste this entire file into the Apps Script project for the results spreadsheet.
const SPREADSHEET_ID = '1w4Wn6B9SPEVziTepnkNaXFkc9QQ25rAnmKy2l31k1jc';
const SHEET_GID = 0;
const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const SCRIPT_VERSION = 'results-sheets-10-columns-2026-11-18';

const HEADERS = [
  'STT',
  'TÊN BÀI THI',
  'KỸ NĂNG',
  'TÊN HỌC SINH',
  'LỚP',
  'SỐ CÂU ĐÚNG LISTENING/ TỔNG SỐ CÂU',
  'SỐ CÂU ĐÚNG READING/ TỔNG SỐ CÂU',
  'TỔNG ĐIỂM (FULL TEST)',
  'THỜI GIAN LÀM BÀI',
  'NGÀY GIỜ LÀM BÀI'
];

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function getResultsSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetById(SHEET_GID);
  if (!sheet) throw new Error('Không tìm thấy tab Google Sheets có gid=0.');
  return sheet;
}

// Open the /exec URL to verify the deployment without creating a result.
function doGet() {
  try {
    getResultsSheet_();
    return json_({ ok: true, version: SCRIPT_VERSION, columns: HEADERS.length, gid: SHEET_GID });
  } catch (error) {
    return json_({ ok: false, version: SCRIPT_VERSION, error: String(error.message || error) });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const stt = addResult_(data);
    return json_({ ok: true, stt: stt });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error.message || error) });
  }
}

function scoreText_(correct, total, required) {
  if (correct === null || correct === undefined ||
      total === null || total === undefined) {
    if (required) throw new Error('Thiếu điểm của một kỹ năng.');
    return '';
  }
  const c = Number(correct);
  const t = Number(total);
  if (!Number.isInteger(c) || !Number.isInteger(t) ||
      t <= 0 || c < 0 || c > t) {
    throw new Error('Điểm số không hợp lệ.');
  }
  return `${c}/${t}`;
}

function ensureHeaders_(sheet) {
  const missingColumns = HEADERS.length - sheet.getMaxColumns();
  if (missingColumns > 0) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), missingColumns);
  }

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length);
  const existing = firstRow.getValues()[0];
  const isBlank = existing.every(value => value === '');
  const isHeader = String(existing[0]).trim().toUpperCase() === 'STT';
  if (!isBlank && !isHeader) sheet.insertRowBefore(1);

  sheet.getRange(1, 1, 1, HEADERS.length)
    .setValues([HEADERS])
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function addResult_(data) {
  const examName = String(data.examName || '').trim().toUpperCase();
  const skill = String(data.skill || '').trim().toUpperCase();
  const studentName = String(data.name || '').trim();
  const className = String(data.className || '').trim();
  const seconds = Number(data.durationSeconds);
  const eventType = data.eventType || 'result';
  const violationCount = Number(data.violationCount || 0);

  if (!['MOVERS', 'FLYERS', 'KET'].includes(examName) ||
      !studentName || !className ||
      !['LISTENING', 'READING', 'FULL TEST'].includes(skill) ||
      !['result', 'violation'].includes(eventType) ||
      !Number.isFinite(seconds) || seconds < 0 ||
      !Number.isInteger(violationCount) || violationCount < 0 ||
      (eventType === 'violation' && violationCount === 0)) {
    throw new Error('Thiếu hoặc sai thông tin bài làm.');
  }

  const isViolation = eventType === 'violation';
  const listening = isViolation ? '' : scoreText_(
    data.listeningCorrect, data.listeningTotal,
    skill === 'LISTENING' || skill === 'FULL TEST'
  );
  const reading = isViolation ? '' : scoreText_(
    data.readingCorrect, data.readingTotal,
    skill === 'READING' || skill === 'FULL TEST'
  );
  const fullTestTotal = !isViolation && skill === 'FULL TEST'
    ? scoreText_(data.score, data.total, true)
    : '';

  let skillLabel = skill;
  if (violationCount > 0) {
    skillLabel += ` - VI PHẠM ${violationCount}/3`;
    if (data.autoSubmitted) skillLabel += ' (TỰ NỘP)';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const duration = `${minutes} phút ${String(remainingSeconds).padStart(2, '0')} giây`;
  const submittedAt = Utilities.formatDate(new Date(), TIME_ZONE, 'dd/MM/yyyy HH:mm:ss');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getResultsSheet_();
    ensureHeaders_(sheet);
    const lastRow = sheet.getLastRow();
    let nextStt = 1;
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 1).getValues().forEach(row => {
        const number = Number(row[0]);
        if (Number.isInteger(number) && number >= nextStt) nextStt = number + 1;
      });
    }

    const values = [
      nextStt, examName, skillLabel, studentName, className,
      listening, reading, fullTestTotal, duration, submittedAt
    ];
    const destination = sheet.getRange(lastRow + 1, 1, 1, HEADERS.length);
    destination.setValues([values]);
    SpreadsheetApp.flush();
    return nextStt;
  } finally {
    lock.releaseLock();
  }
}
