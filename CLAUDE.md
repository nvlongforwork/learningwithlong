# Learning With Long - Project Notes

## Project Overview
- Single HTML file SPA deployed on Vercel
- English Language Materials app for Cambridge exam preparation
- Hash-based routing: `#/material/{id}/{folderId}/{subfolderId}/{skillId}`
- Tech: Tailwind CSS, Font Awesome, SweetAlert2, Google Fonts Inter, html2canvas

## Development
- Feature branch: `claude/sleepy-carson-t3dt1u`
- Deploy branch: `main` (Vercel auto-deploy)
- Always merge to main and push after changes
- Validate JS syntax with Python+node before committing

## Student Code Verification
- ACTIVATED — students must enter code before any test
- Teacher code: `123`, session storage key: `elm_teacher_logged_in`
- Student code input: NO placeholder text (empty input field)

## Listening Test Layout (Collins for Movers format — apply to ALL future tests)

### Part 1 (drag-match: "Listen and draw lines")
- Large image displayed prominently
- Names listed above/below image
- Students drag names to match actions
- Image referenced in JSON `"image"` field

### Part 2 (fill-blank: "Listen and write")
- **Side-by-side layout**: Image LEFT (40%), Form RIGHT (60%)
- Image uses `sticky top-4` positioning
- Uses `resp-row`/`resp-col` classes for mobile responsive
- Image referenced in JSON `"image"` field
- Form has `formTitle` header, example row, then input rows

### Part 3 (drag-match-letters: "Listen and write a letter")
- Two images: `peopleImage` (left) and `activitiesImage` (right)
- Side-by-side layout with people on left, activity options A-H on right
- Students type a letter (A-H) for each person

### Part 4 (multiple-choice-abc: "Listen and tick the box")
- Multiple choice with images for each option (A, B, C)
- Images array in JSON `"images"` field (can be multiple pages)
- Each question shows 3 image options

### Part 5 (color-write: "Listen and colour and write")
- Large coloring image displayed
- Students select colors or type words
- Image referenced in JSON `"image"` field

## Reading Test Layout (apply to ALL future tests)

### Part 1 (definition-match): Word bank with images (w-32 h-24), type answers
### Part 2 (conversation-choice): Clickable multiple choice (NOT typing)
### Part 3 (story-fill): Word bank with images, type answers, plus title question
### Part 4 (grammar-cloze): Side-by-side — passage LEFT (65%), options RIGHT (35%)
### Part 5 (story-write): Story segments with fill-in-the-blank typing (1-3 words)
### Part 6 (picture-write): Image + questions, Q3-4 worth 2 points each

## Result Card
- Shared `buildResultCard()` function for all result types
- **Landscape 4:3 ratio**, max-width 1020px
- Gradient header with material level name (e.g., "A1 Movers")
- SVG circular progress ring (180px) on LEFT, score table on RIGHT
- Shield display below ring (for Starters/Movers/Flyers)
- SweetAlert2 popup width: 90%, max-width: 1080px
- Buttons: "Xem lại bài làm" + "Lưu kết quả" (gradient styled)
- Full Test mode: combined listening+reading scores, dual shield cards

## Responsive Design
- `.resp-row` / `.resp-col` classes for all side-by-side layouts
- `@media (max-width: 768px)` converts to vertical stacking
- All test views must use these classes for mobile support

## Audio Scripts
- Only show parts containing answer choices (not full transcripts)

## JSON Data Files
- Path format: `./data/${materialId}_${folderId.replace(/\//g, '_')}.json`
- Two types: `"type": "listening-test"` and `"type": "reading-test"`
- Full Test loads both listening + reading JSON files

## Image Files
- Path: `images/collins-movers/test{N}/`
- Word bank images in `words/` subfolder
- Prefer .webp format for smaller file size
