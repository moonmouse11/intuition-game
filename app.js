// ===== ELEMENTS =====
const table = document.getElementById('table');
const toastEl = document.getElementById('toast');
const container = document.getElementById('container');
const neonSign = document.getElementById('neonSign');
const neonText = document.getElementById('neonText');
const footerHelp = document.getElementById('footerHelp');

// ===== SOUNDS =====
const sndSelect = document.getElementById('sndSelect');
const sndPositive = document.getElementById('sndPositive');
const sndNegative = document.getElementById('sndNegative');

function playSound(audio) {
    audio.currentTime = 0;
    audio.play().catch(() => { });
}

// ===== DATA =====
const items = [
    "Собирался открыть чебуречную",
    "Цветочник(ца)",
    "Может 45 минут простоять на гвоздях",
    "Кормит коллег тортами",
    "Крутит пои",
    "Снимался(лась) у Бутусова",
    "Печатался(лась) в литературном альманахе",
    "Смотрит аниме",
    "Всю зарплату тратит на подарки"
];

// ===== STATE =====
let selectedRow = null;
let guessedCount = 0;
let toastTimer = null;
let isShifted = false;
let helpVisible = false;

// ===== TOAST =====
function showToast(text, type) {
    clearTimeout(toastTimer);
    toastEl.textContent = text;
    toastEl.className = 'toast ' + type + ' show';
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1500);
}

// ===== NEON TEXT =====
function updateNeonText() {
    if (selectedRow) {
        neonText.textContent = selectedRow.querySelector('.row-text').textContent;
        neonText.classList.add('item-mode');
    } else {
        neonText.textContent = 'ИНТУИЦИЯ';
        neonText.classList.remove('item-mode');
    }
}

// ===== CREATE ROWS =====
function createRows() {
    table.innerHTML = '';
    selectedRow = null;
    guessedCount = 0;

    items.forEach((text, i) => {
        const row = document.createElement('div');
        row.className = 'row blue entering';
        row.dataset.index = i + 1;
        row.innerHTML = `
      <div class="flash"></div>
      <div class="row-number">${i + 1}</div>
      <div class="row-text">${text}</div>
    `;
        row.addEventListener('click', () => selectRow(row));
        const delay = 80 + i * 60 + 450;
        setTimeout(() => row.classList.remove('entering'), delay);
        table.appendChild(row);
    });

    updateNeonText();
}

// ===== FLASH EFFECT =====
function flash(row) {
    row.classList.remove('clicked');
    void row.offsetWidth;
    row.classList.add('clicked');
}

// ===== SELECT / DESELECT =====
function selectRow(row) {
    if (row.classList.contains('guessed')) return;

    if (selectedRow === row) {
        deselectCurrent();
        return;
    }

    if (selectedRow) deselectCurrent();

    row.classList.remove('blue');
    row.classList.add('red');
    flash(row);
    selectedRow = row;
    playSound(sndSelect);
    updateNeonText();
}

function deselectCurrent() {
    if (!selectedRow) return;
    selectedRow.classList.remove('red');
    selectedRow.classList.add('blue');
    flash(selectedRow);
    selectedRow = null;
    updateNeonText();
}

// ===== GUESS =====
function guessCorrect() {
    if (!selectedRow) return;

    const name = selectedRow.querySelector('.row-text').textContent;
    selectedRow.classList.remove('red');
    selectedRow.classList.add('guessed');
    guessedCount++;
    playSound(sndPositive);
    showToast('✓ ' + name, 'green');

    const row = selectedRow;
    selectedRow = null;
    updateNeonText();

    setTimeout(() => { row.style.display = 'none'; }, 700);

    if (guessedCount === items.length) {
        setTimeout(() => showToast('Все угаданы!', 'green'), 900);
    }
}

function guessWrong() {
    if (!selectedRow) return;
    playSound(sndNegative);
    showToast('✗ Не угадал', 'neutral');
    deselectCurrent();
}

// ===== KEYBOARD =====
document.addEventListener('keydown', (e) => {
    const key = e.key;

    // Space — shift table
    if (key === ' ') {
        e.preventDefault();
        isShifted = !isShifted;
        container.classList.toggle('shifted', isShifted);
        neonSign.classList.toggle('visible', isShifted);
        return;
    }

    const k = key.toLowerCase();

    // H — help
    if (k === 'h' || k === 'р') {
        helpVisible = !helpVisible;
        footerHelp.classList.toggle('visible', helpVisible);
        return;
    }

    // R — reset
    if (k === 'r' || k === 'к') {
        createRows();
        showToast('Игра сброшена', 'neutral');
        return;
    }

    // 1-9 — select row
    if (k >= '1' && k <= '9') {
        const num = parseInt(k);
        for (const row of table.querySelectorAll('.row')) {
            if (row.dataset.index == num && !row.classList.contains('guessed')) {
                selectRow(row);
                return;
            }
        }
    }

    // Y — correct
    if (k === 'y' || k === 'н') guessCorrect();

    // N — wrong
    if (k === 'n' || k === 'т') guessWrong();
});

// ===== INIT =====
createRows();
