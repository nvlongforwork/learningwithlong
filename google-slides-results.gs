// Copy this file into the Apps Script project attached to your Google Slides.
// Replace this ID with the ID between /d/ and /edit in the Slides URL.
const PRESENTATION_ID = 'DAN_ID_GOOGLE_SLIDES_VAO_DAY';
const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const ROWS_PER_SLIDE = 3;
const TABLE_TAG = 'APP_RESULTS_10_COLUMNS_V2';
const SCRIPT_VERSION = 'results-10-columns-2026-11-18';

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

// Open the /exec URL in a browser to check the deployed version and Slides access.
// This check does not insert a slide or a student result.
function doGet() {
  try {
    if (PRESENTATION_ID === 'DAN_ID_GOOGLE_SLIDES_VAO_DAY') {
      throw new Error('Chưa điền PRESENTATION_ID của Google Slides.');
    }
    SlidesApp.openById(PRESENTATION_ID);
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      version: SCRIPT_VERSION,
      columns: HEADERS.length
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      version: SCRIPT_VERSION,
      error: String(error.message || error)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const stt = addResult_(data);
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, stt: stt })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(error);
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(error.message || error) })
    ).setMimeType(ContentService.MimeType.JSON);
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

function addResult_(data) {
  if (PRESENTATION_ID === 'DAN_ID_GOOGLE_SLIDES_VAO_DAY') {
    throw new Error('Chưa điền PRESENTATION_ID của Google Slides.');
  }
  const examName = String(data.examName || '').trim().toUpperCase();
  const skill = String(data.skill || '').trim().toUpperCase();
  const studentName = String(data.name || '').trim();
  const className = String(data.className || '').trim();
  const seconds = Number(data.durationSeconds);
  const eventType = data.eventType || 'result';
  const violationCount = Number(data.violationCount || 0);

  if (!examName || !studentName || !className ||
      !['LISTENING', 'READING', 'FULL TEST'].includes(skill) ||
      !['result', 'violation'].includes(eventType) ||
      !Number.isFinite(seconds) || seconds < 0 ||
      !Number.isInteger(violationCount) || violationCount < 0 ||
      (eventType === 'violation' && violationCount === 0)) {
    throw new Error('Thiếu hoặc sai thông tin bài làm.');
  }

  const isViolation = eventType === 'violation';
  const listening = isViolation ? '' : scoreText_(
    data.listeningCorrect,
    data.listeningTotal,
    skill === 'LISTENING' || skill === 'FULL TEST'
  );
  const reading = isViolation ? '' : scoreText_(
    data.readingCorrect,
    data.readingTotal,
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
  const duration =
    `${minutes} phút ${String(remainingSeconds).padStart(2, '0')} giây`;
  const submittedAt = Utilities.formatDate(
    new Date(), TIME_ZONE, 'dd/MM/yyyy HH:mm:ss'
  );

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const presentation = SlidesApp.openById(PRESENTATION_ID);
    let nextStt = 1;
    let targetTable = null;
    let targetRow = -1;

    presentation.getSlides().forEach(slide => {
      slide.getTables().forEach(table => {
        if (table.getTitle() !== TABLE_TAG ||
            table.getNumColumns() !== HEADERS.length) return;

        for (let row = 1; row < table.getNumRows(); row++) {
          const value = table.getCell(row, 0).getText().asString().trim();
          if (value) {
            const number = Number(value);
            if (Number.isInteger(number)) {
              nextStt = Math.max(nextStt, number + 1);
            }
          } else if (!targetTable) {
            targetTable = table;
            targetRow = row;
          }
        }
      });
    });

    if (!targetTable) {
      const slide = presentation.appendSlide(
        SlidesApp.PredefinedLayout.BLANK
      );
      const width = presentation.getPageWidth();
      const height = presentation.getPageHeight();

      const title = slide.insertTextBox(
        'KẾT QUẢ BÀI THI', 12, 16, width - 24, 38
      );
      title.getText().getTextStyle().setFontSize(20).setBold(true);

      targetTable = slide.insertTable(
        ROWS_PER_SLIDE + 1, HEADERS.length,
        12, 68, width - 24, height - 88
      );
      targetTable.setTitle(TABLE_TAG);

      HEADERS.forEach((header, column) => {
        const text = targetTable.getCell(0, column).getText();
        text.setText(header);
        text.getTextStyle().setFontSize(7).setBold(true);
      });
      targetRow = 1;
    }

    const values = [
      nextStt,
      examName,
      skillLabel,
      studentName,
      className,
      listening,
      reading,
      fullTestTotal,
      duration,
      submittedAt
    ];

    values.forEach((value, column) => {
      const text = targetTable.getCell(targetRow, column).getText();
      text.setText(String(value));
      text.getTextStyle().setFontSize(8);
    });

    presentation.saveAndClose();
    return nextStt;
  } finally {
    lock.releaseLock();
  }
}
