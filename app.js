// ===== ELEMENTS =====
const table = document.getElementById('table');
const container = document.getElementById('container');
const neonSign = document.getElementById('neonSign');
const neonText = document.getElementById('neonText');
const footerHelp = document.getElementById('footerHelp');
const introScreen = document.getElementById('introScreen');
const fireworksCanvas = document.getElementById('fireworksCanvas');
const fCtx = fireworksCanvas.getContext('2d');

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
    "Собирался(лась) открыть чебуречную",
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
let isShifted = false;
let helpVisible = false;
let introVisible = true;
let busy = false; // blocks input during sound + animation

// ===== INTRO =====
function showIntro() {
    introVisible = true;
    introScreen.classList.remove('hidden');
}

function hideIntro() {
    introVisible = false;
    introScreen.classList.add('hidden');
    stopFireworks();
}

// ===== FIREWORKS =====
const FIREWORK_COLORS = [
    '#ff4444', '#ff8844', '#ffdd00', '#44ff88',
    '#44aaff', '#aa44ff', '#ff44aa', '#ffffff',
    '#ffaa44', '#44ffff'
];

let fireworksActive = false;
let fParticles = [];
let fLaunchTimer = null;
let fAnimFrame = null;

class FParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 2;
        this.alpha = 1;
        this.decay = Math.random() * 0.018 + 0.008;
        this.radius = Math.random() * 2.5 + 1;
        this.trail = [];
    }

    update() {
        this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
        if (this.trail.length > 5) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15;
        this.vx *= 0.99;
        this.alpha -= this.decay;
    }

    draw() {
        this.trail.forEach((t, i) => {
            fCtx.save();
            fCtx.globalAlpha = t.alpha * (i / this.trail.length) * 0.4;
            fCtx.fillStyle = this.color;
            fCtx.beginPath();
            fCtx.arc(t.x, t.y, this.radius * 0.6, 0, Math.PI * 2);
            fCtx.fill();
            fCtx.restore();
        });
        fCtx.save();
        fCtx.globalAlpha = Math.max(0, this.alpha);
        fCtx.fillStyle = this.color;
        fCtx.shadowColor = this.color;
        fCtx.shadowBlur = 8;
        fCtx.beginPath();
        fCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        fCtx.fill();
        fCtx.restore();
    }
}

function launchBurst() {
    if (!fireworksActive) return;
    const x = fireworksCanvas.width * (0.15 + Math.random() * 0.7);
    const y = fireworksCanvas.height * (0.08 + Math.random() * 0.5);
    const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
    const count = 60 + Math.floor(Math.random() * 50);
    for (let i = 0; i < count; i++) fParticles.push(new FParticle(x, y, color));
    fLaunchTimer = setTimeout(launchBurst, 400 + Math.random() * 500);
}

function animateFireworks() {
    if (!fireworksActive) return;
    fCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    fParticles = fParticles.filter(p => p.alpha > 0);
    fParticles.forEach(p => { p.update(); p.draw(); });
    fAnimFrame = requestAnimationFrame(animateFireworks);
}

function startFireworks() {
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
    fireworksCanvas.style.display = 'block';
    fireworksActive = true;
    fParticles = [];
    launchBurst();
    animateFireworks();
}

function stopFireworks() {
    if (!fireworksActive) return;
    fireworksActive = false;
    clearTimeout(fLaunchTimer);
    cancelAnimationFrame(fAnimFrame);
    fParticles = [];
    fCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    fireworksCanvas.style.display = 'none';
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
    table.classList.remove('has-selection');
    container.classList.remove('focus-centered');

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
    if (introVisible || busy) return;
    if (row.classList.contains('guessed') || row.classList.contains('dismissed')) return;

    if (selectedRow === row) {
        deselectCurrent();
        return;
    }

    if (selectedRow) deselectCurrent();

    row.classList.remove('blue');
    row.classList.add('red');
    flash(row);
    selectedRow = row;
    table.classList.add('has-selection');
    container.classList.add('focus-centered');
    playSound(sndSelect);
    updateNeonText();
}

function deselectCurrent() {
    if (!selectedRow) return;
    selectedRow.classList.remove('red');
    selectedRow.classList.add('blue');
    flash(selectedRow);
    selectedRow = null;
    table.classList.remove('has-selection');
    container.classList.remove('focus-centered');
    updateNeonText();
}

// ===== AFTER SOUND =====
function afterSound(audio, callback) {
    const fallback = setTimeout(callback, 3000);
    audio.addEventListener('ended', () => {
        clearTimeout(fallback);
        callback();
    }, { once: true });
}

// ===== GUESS =====
function guessCorrect() {
    if (!selectedRow || busy) return;
    busy = true;

    guessedCount++;
    playSound(sndPositive);

    const row = selectedRow;
    selectedRow = null;
    updateNeonText();

    afterSound(sndPositive, () => {
        // Row stays red during sound, now turn green for 3 seconds
        row.classList.add('correct-glow');

        setTimeout(() => {
            row.classList.remove('red', 'correct-glow');
            row.classList.add('dismissed');
            table.classList.remove('has-selection');
            container.classList.remove('focus-centered');
            busy = false;

            if (guessedCount === items.length) {
                setTimeout(() => { startFireworks(); showIntro(); }, 400);
            }
        }, 1500);
    });
}

function guessWrong() {
    if (!selectedRow || busy) return;
    busy = true;

    const row = selectedRow;
    playSound(sndNegative);

    afterSound(sndNegative, () => {
        // Row stays red during sound, now shake for 3 seconds
        row.classList.add('shaking');

        setTimeout(() => {
            row.classList.remove('shaking');
            busy = false;
            deselectCurrent();
        }, 1500);
    });
}

// ===== KEYBOARD =====
document.addEventListener('keydown', (e) => {
    const key = e.key;

    // Esc — show intro (always)
    if (key === 'Escape') {
        e.preventDefault();
        showIntro();
        return;
    }

    const k = key.toLowerCase();

    // R — reset (always works, hides intro)
    if (k === 'r' || k === 'к') {
        busy = false;
        stopFireworks();
        createRows();
        hideIntro();
        return;
    }

    // Any other key while intro visible → just hide intro
    if (introVisible) {
        hideIntro();
        return;
    }

    // Space — shift table
    if (key === ' ') {
        e.preventDefault();
        isShifted = !isShifted;
        container.classList.toggle('shifted', isShifted);
        return;
    }

    // H — help
    if (k === 'h' || k === 'р') {
        helpVisible = !helpVisible;
        footerHelp.classList.toggle('visible', helpVisible);
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
