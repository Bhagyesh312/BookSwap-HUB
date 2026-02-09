// quiz.js - Logic for Book Matchmaker

// Full Book Database (Synced with buy.html) - Added 'year' for Era logic
const allBooks = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', type: 'new', pages: 218, price: 569, year: 1925, image: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg', desc: "A tragic tale of Jay Gatsby's obsession with Daisy Buchanan, exploring wealth, illusion, and the American Dream." },
    { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', type: 'new', pages: 281, price: 599, year: 1960, image: 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg', desc: "Scout Finch recounts her childhood in the racially divided American South as her father defends a Black man falsely accused of a crime." },
    { id: 3, title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Romance', type: 'new', pages: 432, price: 479, year: 1813, image: 'https://covers.openlibrary.org/b/isbn/9780141199078-L.jpg', desc: "Elizabeth Bennet navigates love, class, and societal expectations while clashing with the proud Mr. Darcy." },
    { id: 4, title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction', type: 'new', pages: 214, price: 559, year: 1951, image: 'https://covers.openlibrary.org/b/isbn/9780316769488-L.jpg', desc: "Holden Caulfield wanders New York City after expulsion, questioning adulthood and authenticity." },
    { id: 5, title: 'Educated', author: 'Tara Westover', category: 'Non-Fiction', type: 'new', pages: 334, price: 479, year: 2018, image: 'https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg', desc: "A woman raised in a survivalist family pursues education and self-discovery." },
    { id: 6, title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', category: 'Non-Fiction', type: 'new', pages: 499, price: 809, year: 2011, image: 'https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg', desc: "Two systems of thinking that drive decisions." },
    { id: 7, title: 'The Midnight Library', author: 'Matt Haig', category: 'Romance', type: 'new', pages: 304, price: 519, year: 2020, image: 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg', desc: "A magical library lets Nora explore alternate versions of her life." },
    { id: 8, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Non-Fiction', type: 'new', pages: 443, price: 879, year: 2011, image: 'https://covers.openlibrary.org/b/isbn/9780062316110-L.jpg', desc: "History of humankind from evolution to modern society." },
    { id: 9, title: '1984', author: 'George Orwell', category: 'Fiction', type: 'new', pages: 328, price: 479, year: 1949, image: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg', desc: "Big Brother, surveillance, and totalitarian control." },
    { id: 10, title: 'The Alchemist', author: 'Paulo Coelho', category: 'Other', type: 'new', pages: 208, price: 449, year: 1988, image: 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg', desc: "A shepherd follows his dreams in a spiritual journey." },
    { id: 11, title: 'Atomic Habits', author: 'James Clear', category: 'Non-Fiction', type: 'new', pages: 320, price: 809, year: 2018, image: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg', desc: "Tiny habits lead to massive life improvements." },
    { id: 12, title: 'Six of Crows', author: 'Leigh Bardugo', category: 'Romance', type: 'new', pages: 465, price: 599, year: 2015, image: 'https://covers.openlibrary.org/b/isbn/9781627792127-L.jpg', desc: "Six criminals attempt an impossible magical heist." },
    { id: 13, title: 'The Silent Patient', author: 'Alex Michaelides', category: 'Fiction', type: 'new', pages: 336, price: 479, year: 2019, image: 'media/silent_patient.jpg', desc: "A therapist uncovers the truth behind a woman who shot her husband and never speaks again." },
    { id: 14, title: 'It Ends with Us', author: 'Colleen Hoover', category: 'Romance', type: 'new', pages: 376, price: 439, year: 2016, image: 'https://covers.openlibrary.org/b/isbn/9781476753188-L.jpg', desc: "A romance confronting domestic abuse and difficult life choices." },
    { id: 15, title: 'Verity', author: 'Colleen Hoover', category: 'Fiction', type: 'new', pages: 336, price: 479, year: 2018, image: 'media/verity.jpg', desc: "A writer discovers disturbing secrets while finishing another author's manuscript." },
    { id: 16, title: 'Dune', author: 'Frank Herbert', category: 'Fiction', type: 'new', pages: 412, price: 509, year: 1965, image: 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg', desc: "Epic desert-planet politics, prophecy, and survival." },
    { id: 17, title: 'Project Hail Mary', author: 'Andy Weir', category: 'Fiction', type: 'new', pages: 496, price: 509, year: 2021, image: 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg', desc: "A lone astronaut must save humanity through science and ingenuity." },
    { id: 18, title: 'Klara and the Sun', author: 'Kazuo Ishiguro', category: 'Fiction', type: 'new', pages: 320, price: 439, year: 2021, image: 'media/klara_and_the_sun.jpg', desc: "An Artificial Friend observes human love and loneliness." },
    { id: 19, title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer', category: 'Non-Fiction', type: 'new', pages: 390, price: 519, year: 2013, image: 'media/braiding.jpg', desc: "Indigenous wisdom and ecological science combined." },
    { id: 20, title: 'The Body Keeps the Score', author: 'Bessel van der Kolk', category: 'Non-Fiction', type: 'new', pages: 464, price: 559, year: 2014, image: 'media/body_keeps_score.jpg', desc: "How trauma affects the brain and body, with healing approaches." },
    // OLD BOOKS (Prices lower)
    { id: 21, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', type: 'old', pages: 218, price: 299, year: 1925, image: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg', desc: "Classic tragedy of the American Dream." },
    { id: 22, title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', type: 'old', pages: 281, price: 349, year: 1960, image: 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg', desc: "A timeless story of justice and childhood." },
    { id: 23, title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Romance', type: 'old', pages: 432, price: 279, year: 1813, image: 'https://covers.openlibrary.org/b/isbn/9780141199078-L.jpg', desc: "The ultimate classic romance." },
    { id: 24, title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction', type: 'old', pages: 214, price: 319, year: 1951, image: 'https://covers.openlibrary.org/b/isbn/9780316769488-L.jpg', desc: "The defining novel of teenage rebellion." },
    { id: 25, title: '1984', author: 'George Orwell', category: 'Fiction', type: 'old', pages: 328, price: 289, year: 1949, image: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg', desc: "A chilling dystopian classic." },
    { id: 26, title: 'The Alchemist', author: 'Paulo Coelho', category: 'Other', type: 'old', pages: 208, price: 249, year: 1988, image: 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg', desc: "A modern classic about destiny." },
    { id: 27, title: 'The Midnight Library', author: 'Matt Haig', category: 'Romance', type: 'old', pages: 304, price: 299, year: 2020, image: 'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg', desc: "Explore infinite lives in this magical library." },
    { id: 28, title: 'Educated', author: 'Tara Westover', category: 'Non-Fiction', type: 'old', pages: 334, price: 399, year: 2018, image: 'https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg', desc: "A powerful memoir of self-invention." },
    { id: 29, title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', category: 'Non-Fiction', type: 'old', pages: 499, price: 449, year: 2011, image: 'https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg', desc: "Understand how your mind really works." },
    { id: 30, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Non-Fiction', type: 'old', pages: 443, price: 499, year: 2011, image: 'https://covers.openlibrary.org/b/isbn/9780062316110-L.jpg', desc: "A brief history of humankind." },
    { id: 31, title: 'Atomic Habits', author: 'James Clear', category: 'Non-Fiction', type: 'old', pages: 320, price: 449, year: 2018, image: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg', desc: "Build good habits, break bad ones." },
    { id: 32, title: 'Six of Crows', author: 'Leigh Bardugo', category: 'Romance', type: 'old', pages: 465, price: 349, year: 2015, image: 'https://covers.openlibrary.org/b/isbn/9781627792127-L.jpg', desc: "A dangerous heist in a magical world." },
    { id: 33, title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', category: 'Non-Fiction', type: 'old', pages: 355, price: 279, year: 1997, image: 'media/RCPD.jpg', desc: "Financial wisdom about building wealth." },
    { id: 34, title: 'The Lean Startup', author: 'Eric Ries', category: 'Non-Fiction', type: 'old', pages: 336, price: 319, year: 2011, image: 'https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg', desc: "How constant innovation creates radically successful businesses." },
    { id: 35, title: 'Zero to One', author: 'Peter Thiel', category: 'Non-Fiction', type: 'old', pages: 368, price: 289, year: 2014, image: 'https://covers.openlibrary.org/b/isbn/9780804139298-L.jpg', desc: "Notes on startups, or how to build the future." }
];

const questions = [
    {
        id: 1,
        text: "1. What vibe are you looking for?",
        options: [
            { text: "Escape Reality (Fiction)", category: "Fiction" },
            { text: "Learn & Grow (Non-Fiction)", category: "Non-Fiction" },
            { text: "Love & Emotions (Romance)", category: "Romance" },
            { text: "Something Different (Other)", category: "Other" }
        ]
    },
    {
        id: 2,
        text: "2. Do you prefer brand new or pre-loved books?",
        options: [
            { text: "Fresh & New", type: "new" },
            { text: "Vintage / Affordable", type: "old" }
        ]
    },
    {
        id: 3,
        text: "3. What is your budget?",
        options: [
            { text: "Under ₹450", budget: "low" },
            { text: "₹450 - ₹700", budget: "medium" },
            { text: "No limit / Premium", budget: "high" }
        ]
    },
    {
        id: 4,
        text: "4. Do you prefer Classics or Modern hits?",
        options: [
            { text: "Time-tested Classics (Pre-2000)", era: "classic" },
            { text: "Modern Hits (Post-2000)", era: "modern" },
            { text: "Doesn't matter", era: "any" }
        ]
    },
    {
        id: 5,
        text: "5. How much time do you have to read?",
        options: [
            { text: "Quick Read (< 300 pages)", length: "short" },
            { text: "Standard Read (300-500 pages)", length: "medium" },
            { text: "Epic Journey (500+ pages)", length: "long" }
        ]
    }
];

let currentStep = 0;
let userPreferences = { category: '', type: '', budget: '', era: '', length: '' };

const questionEl = document.getElementById('questionText');
const optionsEl = document.getElementById('optionsContainer');
const progressBar = document.getElementById('progressBar');
const questionContainer = document.getElementById('questionContainer');
const resultContainer = document.getElementById('resultContainer');

function loadQuestion() {
    const q = questions[currentStep];
    questionEl.textContent = q.text;
    optionsEl.innerHTML = '';

    // Update progress
    const progress = ((currentStep) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt.text;
        btn.onclick = () => handleAnswer(opt);
        optionsEl.appendChild(btn);
    });
}

function handleAnswer(choice) {
    // Store preference
    if (choice.category) userPreferences.category = choice.category;
    if (choice.type) userPreferences.type = choice.type;
    if (choice.budget) userPreferences.budget = choice.budget;
    if (choice.era) userPreferences.era = choice.era;
    if (choice.length) userPreferences.length = choice.length;

    currentStep++;

    if (currentStep < questions.length) {
        loadQuestion();
    } else {
        showResult();
    }
}

function showResult() {
    progressBar.style.width = '100%';
    questionContainer.style.display = 'none';
    resultContainer.style.display = 'block';

    // MATCHING LOGIC (Progressive Filtering)

    // 1. Category (Strict)
    let matches = allBooks.filter(b => b.category === userPreferences.category);

    // 2. Type (Strict - New vs Old)
    if (matches.length > 0) {
        const typeMatches = matches.filter(b => b.type === userPreferences.type);
        if (typeMatches.length > 0) matches = typeMatches;
    }

    // 3. Budget (Flexible)
    // Low: < 450, Medium: 450-700, High: > 700
    let budgetMatches = matches.filter(b => {
        if (userPreferences.budget === 'low') return b.price < 450;
        if (userPreferences.budget === 'medium') return b.price >= 450 && b.price <= 700;
        if (userPreferences.budget === 'high') return b.price > 700;
        return true;
    });
    if (budgetMatches.length > 0) matches = budgetMatches; // Update pool only if we found specific matches

    // 4. Era (Flexible)
    // Classic: < 2000, Modern: >= 2000
    if (userPreferences.era !== 'any') {
        let eraMatches = matches.filter(b => {
            if (userPreferences.era === 'classic') return b.year < 2000;
            if (userPreferences.era === 'modern') return b.year >= 2000;
            return true;
        });
        if (eraMatches.length > 0) matches = eraMatches;
    }

    // 5. Length (Flexible)
    let lengthMatches = matches.filter(b => {
        if (userPreferences.length === 'short') return b.pages < 300;
        if (userPreferences.length === 'medium') return b.pages >= 300 && b.pages <= 500;
        if (userPreferences.length === 'long') return b.pages > 500;
        return true;
    });
    if (lengthMatches.length > 0) matches = lengthMatches;


    // Fallback: If 0 matches, reset to Category + Type
    if (matches.length === 0) {
        matches = allBooks.filter(b => b.category === userPreferences.category && b.type === userPreferences.type);
    }
    // Fallback 2: Just Category
    if (matches.length === 0) {
        matches = allBooks.filter(b => b.category === userPreferences.category);
    }

    // Pick Random
    const finalBook = matches[Math.floor(Math.random() * matches.length)];

    if (!finalBook) return alert("No book found! Try again.");

    // Populate UI
    document.getElementById('resultTitle').textContent = finalBook.title;
    document.getElementById('resultAuthor').textContent = finalBook.author;
    document.getElementById('resultDesc').textContent = finalBook.desc || finalBook.synopsis;
    document.getElementById('resultImage').src = finalBook.image || 'https://via.placeholder.com/200x300';

    // Create 'Tags' text for context
    // document.getElementById('resultDesc').innerHTML += `<br><small style="color:#primary">Matched: ${userPreferences.category} • ${userPreferences.type} • ${userPreferences.era}</small>`;

    // Store for "Buy Now" link
    window.matchedBookId = finalBook.id;
}

function goToBook() {
    if (window.matchedBookId) {
        localStorage.setItem('viewBookId', window.matchedBookId);
        window.location.href = 'buy.html';
    }
}

// Init
loadQuestion();
