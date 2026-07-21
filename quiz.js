/**
 * quiz.js — Book Matchmaker
 * Fetches live book catalog from API and matches based on quiz answers.
 */

const API_BASE = '';
let apiBooks = []; // populated from /api/books/

// ── Fetch all books from API ──────────────────────────────
async function loadBooksFromAPI() {
    try {
        let all = [];
        let page = 1;
        while (true) {
            const res = await fetch(`${API_BASE}/api/books/?page=${page}&per_page=100`);
            if (!res.ok) break;
            const data = await res.json();
            all = all.concat(data.items || []);
            if (!data.pagination || !data.pagination.has_next) break;
            page++;
        }
        apiBooks = all.map(b => ({
            id:       Number(b.id),
            title:    b.title || 'Untitled',
            author:   b.author || 'Unknown',
            category: (b.category || 'Fiction').toLowerCase(),
            type:     b.type || 'new',
            price:    Number(b.price || 0),
            pages:    Number(b.pages || 300),
            year:     Number(b.year || 2000),
            image:    b.image || '',
            synopsis: b.synopsis || b.description || '',
        }));
    } catch (_) {
        apiBooks = [];
    }
}

// ── Category normaliser — maps raw DB category to quiz bucket ──
function getQuizCategory(raw) {
    const c = (raw || '').toLowerCase();
    if (['romance'].includes(c)) return 'romance';
    if (['non-fiction', 'self-help', 'business'].includes(c)) return 'nonfiction';
    if (['fiction', 'classics', 'thriller', 'fantasy', 'science-fiction', 'sci-fi', 'other'].includes(c)) return 'fiction';
    // keyword fallback
    if (c.includes('romance')) return 'romance';
    if (c.includes('fiction')) return 'fiction';
    return 'nonfiction';
}

// ── Questions ─────────────────────────────────────────────
const questions = [
    {
        text: "What kind of read are you in the mood for?",
        options: [
            { label: "📖 Stories & Adventures (Fiction)",    pref: { genre: 'fiction'   } },
            { label: "💡 Learn Something New (Non-Fiction)", pref: { genre: 'nonfiction' } },
            { label: "💕 Love & Emotions (Romance)",         pref: { genre: 'romance'   } },
            { label: "🎲 Surprise Me!",                      pref: { genre: 'any'       } },
        ]
    },
    {
        text: "New book or a pre-loved copy?",
        options: [
            { label: "✨ Brand New",          pref: { bookType: 'new' } },
            { label: "📦 Used / Affordable",  pref: { bookType: 'old' } },
            { label: "🤷 Doesn't matter",     pref: { bookType: 'any' } },
        ]
    },
    {
        text: "What's your budget?",
        options: [
            { label: "💸 Under ₹350",          pref: { budget: 'low'    } },
            { label: "💰 ₹350 – ₹650",         pref: { budget: 'medium' } },
            { label: "👑 Above ₹650",           pref: { budget: 'high'   } },
            { label: "🙅 No limit",             pref: { budget: 'any'    } },
        ]
    },
    {
        text: "Classic or modern?",
        options: [
            { label: "🏛️ Timeless Classics (before 2000)", pref: { era: 'classic' } },
            { label: "🚀 Modern Hits (2000 onwards)",       pref: { era: 'modern'  } },
            { label: "⚡ Either works",                     pref: { era: 'any'     } },
        ]
    },
    {
        text: "How long do you want to read?",
        options: [
            { label: "⚡ Quick read (under 250 pages)",      pref: { length: 'short'  } },
            { label: "📚 Standard (250 – 450 pages)",        pref: { length: 'medium' } },
            { label: "🌊 Epic journey (450+ pages)",         pref: { length: 'long'   } },
            { label: "🎯 Doesn't matter",                    pref: { length: 'any'    } },
        ]
    },
];

// ── State ─────────────────────────────────────────────────
let step = 0;
let prefs = { genre: 'any', bookType: 'any', budget: 'any', era: 'any', length: 'any' };

// ── DOM refs ──────────────────────────────────────────────
const questionEl        = document.getElementById('questionText');
const optionsEl         = document.getElementById('optionsContainer');
const progressBar       = document.getElementById('progressBar');
const questionContainer = document.getElementById('questionContainer');
const resultContainer   = document.getElementById('resultContainer');

// ── Render question ───────────────────────────────────────
function loadQuestion() {
    const q = questions[step];
    questionEl.textContent = `${step + 1}. ${q.text}`;
    optionsEl.innerHTML = '';
    progressBar.style.width = `${(step / questions.length) * 100}%`;

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt.label;
        btn.onclick = () => handleAnswer(opt.pref);
        optionsEl.appendChild(btn);
    });
}

function handleAnswer(pref) {
    Object.assign(prefs, pref);
    step++;
    if (step < questions.length) {
        loadQuestion();
    } else {
        progressBar.style.width = '100%';
        showResult();
    }
}

// ── Matching algorithm ────────────────────────────────────
function scoreBook(book) {
    let score = 0;

    // Genre
    if (prefs.genre !== 'any') {
        if (getQuizCategory(book.category) === prefs.genre) score += 40;
        else return -1; // hard filter
    }

    // Type
    if (prefs.bookType !== 'any') {
        if (book.type === prefs.bookType) score += 20;
        else score -= 10;
    }

    // Budget
    if (prefs.budget === 'low'    && book.price < 350)                    score += 15;
    if (prefs.budget === 'medium' && book.price >= 350 && book.price <= 650) score += 15;
    if (prefs.budget === 'high'   && book.price > 650)                    score += 15;
    if (prefs.budget === 'any')                                            score += 5;

    // Era
    if (prefs.era === 'classic' && book.year < 2000)  score += 10;
    if (prefs.era === 'modern'  && book.year >= 2000) score += 10;
    if (prefs.era === 'any')                          score += 5;

    // Length
    if (prefs.length === 'short'  && book.pages < 250)                      score += 10;
    if (prefs.length === 'medium' && book.pages >= 250 && book.pages <= 450) score += 10;
    if (prefs.length === 'long'   && book.pages > 450)                       score += 10;
    if (prefs.length === 'any')                                              score += 5;

    return score;
}

function showResult() {
    // Score every book
    let scored = apiBooks
        .map(b => ({ book: b, score: scoreBook(b) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score);

    // Fallback: relax genre filter
    if (!scored.length) {
        scored = apiBooks
            .map(b => ({ book: b, score: Math.random() * 10 }))
            .sort((a, b) => b.score - a.score);
    }

    // Pick from top 5 randomly so repeat quizzes feel fresh
    const pool = scored.slice(0, 5);
    const pick = pool[Math.floor(Math.random() * pool.length)].book;

    // Render result
    questionContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');

    document.getElementById('resultTitle').textContent  = pick.title;
    document.getElementById('resultAuthor').textContent = `by ${pick.author}`;
    document.getElementById('resultDesc').textContent   = pick.synopsis || 'A great read waiting for you!';
    document.getElementById('resultImage').src          = pick.image || 'https://via.placeholder.com/200x300?text=No+Cover';
    document.getElementById('resultImage').onerror      = function() { this.src = 'https://via.placeholder.com/200x300?text=No+Cover'; };

    // Price tag
    const priceEl = document.getElementById('resultPrice');
    if (priceEl) priceEl.textContent = `₹${pick.price}`;

    window.matchedBookId = pick.id;
}

function goToBook() {
    if (window.matchedBookId) {
        window.location.href = `book.html?id=${window.matchedBookId}`;
    }
}

// ── Init ──────────────────────────────────────────────────
(async () => {
    // Show loading state
    questionEl.textContent = 'Loading books...';
    optionsEl.innerHTML = '<p style="color:#94a3b8;font-size:14px;">Fetching catalog from server...</p>';

    await loadBooksFromAPI();

    if (!apiBooks.length) {
        optionsEl.innerHTML = '<p style="color:#ef4444;">Could not load books. Make sure the server is running.</p>';
        return;
    }

    loadQuestion();
})();
