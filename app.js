/**
 * MILIONERZY - Core Game Engine
 * Podstawy Techniki Cyfrowej
 */

(function () {
    'use strict';

    // Game Configuration & Prize Ladder definitions (Points scale 1-10)
    const GUARANTEED_LEVELS = [2, 7, 12];
    const PRIZES = {
        1: 1,
        2: 1,
        3: 2,
        4: 2,
        5: 3,
        6: 3,
        7: 4,
        8: 5,
        9: 6,
        10: 7,
        11: 8,
        12: 10
    };

    // Storage key for persistent asked questions
    const STORAGE_KEY = 'swb_milionerzy_used_questions';

    // Game State
    const state = {
        allQuestions: [],
        questionsByLevel: {},
        usedQuestionIds: new Set(),
        currentLevel: 1,
        currentQuestion: null,
        revealedCount: 0,
        selectedAnswer: null,
        isAnswerConfirmed: false,
        isSuspenseRunning: false,
        isGameOver: false,
        lifelines: {
            fiftyFifty: true,
            phone: true,
            audience: true
        },
        eliminatedKeys: new Set()
    };

    // DOM Elements Cache
    const dom = {
        // Top Bar & Lifelines
        lifeline5050: document.getElementById('lifeline-5050'),
        lifelinePhone: document.getElementById('lifeline-phone'),
        lifelineAudience: document.getElementById('lifeline-audience'),
        btnSound: document.getElementById('btn-sound'),
        soundIcon: document.getElementById('sound-icon'),
        btnWalkaway: document.getElementById('btn-walkaway'),
        btnRestart: document.getElementById('btn-restart'),
        btnResetPool: document.getElementById('btn-reset-pool'),
        usedQuestionsCount: document.getElementById('used-questions-count'),
        totalQuestionsCount: document.getElementById('total-questions-count'),

        // Stage Header
        currentQuestionNum: document.getElementById('current-question-num'),
        currentQuestionPrize: document.getElementById('current-question-prize'),
        currentCategory: document.getElementById('current-category'),
        questionText: document.getElementById('question-text'),

        // Reveal Controls
        revealDots: {
            A: document.getElementById('dot-A'),
            B: document.getElementById('dot-B'),
            C: document.getElementById('dot-C'),
            D: document.getElementById('dot-D')
        },
        revealTextStatus: document.getElementById('reveal-text-status'),
        btnRevealNext: document.getElementById('btn-reveal-next'),
        btnRevealAll: document.getElementById('btn-reveal-all'),

        // Answer Boxes
        answersGrid: document.getElementById('answers-grid'),
        answerBoxes: {
            A: document.getElementById('answer-box-A'),
            B: document.getElementById('answer-box-B'),
            C: document.getElementById('answer-box-C'),
            D: document.getElementById('answer-box-D')
        },
        answerTexts: {
            A: document.getElementById('answer-text-A'),
            B: document.getElementById('answer-text-B'),
            C: document.getElementById('answer-text-C'),
            D: document.getElementById('answer-text-D')
        },

        // Stage Footer & Actions
        btnConfirmAnswer: document.getElementById('btn-confirm-answer'),
        btnNextQuestion: document.getElementById('btn-next-question'),
        explanationBox: document.getElementById('explanation-box'),
        explanationContent: document.getElementById('explanation-content'),

        // Ladder & Stats
        ladderList: document.getElementById('ladder-list'),
        statCurrentWin: document.getElementById('stat-current-win'),
        statGuaranteedWin: document.getElementById('stat-guaranteed-win'),

        // Modals
        modalContainer: document.getElementById('modal-container'),
        modalIcon: document.getElementById('modal-icon'),
        modalTitle: document.getElementById('modal-title'),
        modalPrize: document.getElementById('modal-prize'),
        modalDesc: document.getElementById('modal-desc'),
        modalBtnRestart: document.getElementById('modal-btn-restart'),

        // Confetti Canvas
        confettiCanvas: document.getElementById('confetti-canvas')
    };

    /**
     * Format points string: e.g. 10 pkt
     */
    function formatPoints(amount) {
        return amount + ' pkt';
    }

    /**
     * Initialize Application
     */
    async function init() {
        renderLadder();
        attachEventListeners();
        await loadQuestionsData();
        loadUsedQuestions();
        startNewGame();
    }

    /**
     * Load persistent used questions from localStorage
     */
    function loadUsedQuestions() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    state.usedQuestionIds = new Set(parsed);
                }
            }
        } catch (e) {
            console.warn('Could not read localStorage:', e);
            state.usedQuestionIds = new Set();
        }
        updateUsedQuestionsDisplay();
    }

    /**
     * Save used questions to localStorage
     */
    function saveUsedQuestions() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(state.usedQuestionIds)));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
        updateUsedQuestionsDisplay();
    }

    /**
     * Update counter badge in the header
     */
    function updateUsedQuestionsDisplay() {
        if (dom.usedQuestionsCount) {
            dom.usedQuestionsCount.textContent = state.usedQuestionIds.size;
        }
        if (dom.totalQuestionsCount) {
            dom.totalQuestionsCount.textContent = state.allQuestions.length || 200;
        }
    }

    /**
     * Reset session / uncross all used questions
     */
    function resetSessionQuestions() {
        const count = state.usedQuestionIds.size;
        const total = state.allQuestions.length || 200;

        if (!confirm(`Czy na pewno chcesz zresetować pulę pytań?\nWykorzystano już: ${count} z ${total} pytań.\nWszystkie pytania zostaną odkreślone i znów będą mogły być wylosowane.`)) {
            return;
        }

        state.usedQuestionIds.clear();
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}

        updateUsedQuestionsDisplay();
        alert('Pula pytań została pomyślnie zresetowana!');
    }

    /**
     * Load questions from JSON file with fallback to bundled window.MILIONERZY_DATA
     */
    async function loadQuestionsData() {
        try {
            const response = await fetch('milionerzy.json');
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            processQuestions(data.pytania);
        } catch (e) {
            console.warn('Direct fetch failed, falling back to window.MILIONERZY_DATA:', e);
            if (window.MILIONERZY_DATA && window.MILIONERZY_DATA.pytania) {
                processQuestions(window.MILIONERZY_DATA.pytania);
            } else {
                console.error('Błąd ładowania pytań z pliku JSON.');
            }
        }
    }

    /**
     * Group questions by level
     */
    function processQuestions(questionsList) {
        state.allQuestions = questionsList || [];
        state.questionsByLevel = {};

        for (let i = 1; i <= 12; i++) {
            state.questionsByLevel[i] = [];
        }

        state.allQuestions.forEach(q => {
            if (state.questionsByLevel[q.poziom]) {
                state.questionsByLevel[q.poziom].push(q);
            }
        });

        updateUsedQuestionsDisplay();
    }

    /**
     * Start a fresh new game session for the player
     * (used questions are preserved across games until manually reset)
     */
    function startNewGame() {
        stopConfetti();
        state.currentLevel = 1;
        state.isGameOver = false;
        state.lifelines = {
            fiftyFifty: true,
            phone: true,
            audience: true
        };

        // Reset lifeline button states
        resetLifelineBtn(dom.lifeline5050);
        resetLifelineBtn(dom.lifelinePhone);
        resetLifelineBtn(dom.lifelineAudience);

        hideModal();
        loadQuestionForLevel(1);
    }

    function resetLifelineBtn(btn) {
        btn.disabled = false;
        btn.classList.remove('used');
    }

    /**
     * Pick and load a random unused question for the given level
     */
    function loadQuestionForLevel(level) {
        state.currentLevel = level;
        state.revealedCount = 0;
        state.selectedAnswer = null;
        state.isAnswerConfirmed = false;
        state.isSuspenseRunning = false;
        state.eliminatedKeys.clear();

        // Filter out questions already used in this session/localStorage
        let availablePool = (state.questionsByLevel[level] || []).filter(q => !state.usedQuestionIds.has(q.id));

        // If all questions for this specific level were already used, auto-release this level's questions
        if (availablePool.length === 0 && (state.questionsByLevel[level] || []).length > 0) {
            (state.questionsByLevel[level] || []).forEach(q => state.usedQuestionIds.delete(q.id));
            saveUsedQuestions();
            availablePool = state.questionsByLevel[level] || [];
        }

        if (availablePool.length === 0) {
            alert('Brak pytań dla poziomu ' + level);
            return;
        }

        const randomIndex = Math.floor(Math.random() * availablePool.length);
        const question = availablePool[randomIndex];
        state.usedQuestionIds.add(question.id);
        saveUsedQuestions();
        state.currentQuestion = question;

        // Update UI
        dom.currentQuestionNum.textContent = level;
        dom.currentQuestionPrize.textContent = formatPoints(PRIZES[level]);
        dom.currentCategory.textContent = question.kategoria || 'Ogólne';
        dom.questionText.textContent = question.pytanie;

        // Reset answers display
        ['A', 'B', 'C', 'D'].forEach(key => {
            const box = dom.answerBoxes[key];
            const textEl = dom.answerTexts[key];

            box.className = 'hexagon-box answer-box hidden';
            box.disabled = true;
            textEl.textContent = question.odpowiedzi[key] || '';
        });

        // Reset reveal status dots
        updateRevealStatus();

        // Hide explanation and action buttons
        dom.explanationBox.classList.add('hidden');
        dom.btnConfirmAnswer.classList.add('hidden');
        dom.btnNextQuestion.classList.add('hidden');
        dom.btnRevealNext.disabled = false;
        dom.btnRevealAll.disabled = false;

        updateLadderDisplay();
    }

    /**
     * Reveal next hidden answer (A -> B -> C -> D)
     */
    function revealNextAnswer() {
        if (state.revealedCount >= 4 || state.isSuspenseRunning || state.isAnswerConfirmed) return;

        const keys = ['A', 'B', 'C', 'D'];
        const keyToReveal = keys[state.revealedCount];
        state.revealedCount++;

        const box = dom.answerBoxes[keyToReveal];
        box.classList.remove('hidden');
        box.classList.add('revealed');
        box.disabled = false;

        // Check if previously eliminated by 50:50
        if (state.eliminatedKeys.has(keyToReveal)) {
            box.classList.add('eliminated');
            box.disabled = true;
        }

        if (window.soundEngine) {
            window.soundEngine.playReveal();
        }

        updateRevealStatus();

        if (state.revealedCount === 4) {
            dom.btnRevealNext.disabled = true;
            dom.btnRevealAll.disabled = true;
        }
    }

    /**
     * Reveal all 4 answers at once
     */
    function revealAllAnswers() {
        if (state.revealedCount >= 4 || state.isSuspenseRunning || state.isAnswerConfirmed) return;

        while (state.revealedCount < 4) {
            const keys = ['A', 'B', 'C', 'D'];
            const keyToReveal = keys[state.revealedCount];
            state.revealedCount++;

            const box = dom.answerBoxes[keyToReveal];
            box.classList.remove('hidden');
            box.classList.add('revealed');
            box.disabled = false;

            if (state.eliminatedKeys.has(keyToReveal)) {
                box.classList.add('eliminated');
                box.disabled = true;
            }
        }

        if (window.soundEngine) {
            window.soundEngine.playReveal();
        }

        updateRevealStatus();
        dom.btnRevealNext.disabled = true;
        dom.btnRevealAll.disabled = true;
    }

    /**
     * Update reveal dots and text indicator
     */
    function updateRevealStatus() {
        const keys = ['A', 'B', 'C', 'D'];
        keys.forEach((key, index) => {
            if (index < state.revealedCount) {
                dom.revealDots[key].classList.add('active');
            } else {
                dom.revealDots[key].classList.remove('active');
            }
        });

        dom.revealTextStatus.textContent = `Odkryte: ${state.revealedCount} / 4`;
    }

    /**
     * Handle Answer Selection by Player
     */
    function selectAnswer(key) {
        if (state.isAnswerConfirmed || state.isSuspenseRunning) return;

        const box = dom.answerBoxes[key];
        if (box.classList.contains('hidden') || box.classList.contains('eliminated')) {
            return;
        }

        // If clicking another answer, deselect previous
        ['A', 'B', 'C', 'D'].forEach(k => {
            dom.answerBoxes[k].classList.remove('selected');
        });

        state.selectedAnswer = key;
        box.classList.add('selected');

        if (window.soundEngine) {
            window.soundEngine.playSelect();
        }

        // Show confirmation button
        dom.btnConfirmAnswer.classList.remove('hidden');
    }

    /**
     * Confirm Selected Answer & Run Suspense Sequence
     */
    function confirmAnswer() {
        if (!state.selectedAnswer || state.isAnswerConfirmed || state.isSuspenseRunning) return;

        state.isSuspenseRunning = true;
        dom.btnConfirmAnswer.classList.add('hidden');

        if (window.soundEngine) {
            window.soundEngine.playSuspense();
        }

        // Disable changing answer during suspense
        ['A', 'B', 'C', 'D'].forEach(k => {
            dom.answerBoxes[k].disabled = true;
        });

        // Suspense duration: 1.5 seconds of classic Milionerzy tension
        setTimeout(() => {
            evaluateAnswer();
        }, 1500);
    }

    /**
     * Evaluate Answer correctness
     */
    function evaluateAnswer() {
        state.isSuspenseRunning = false;
        state.isAnswerConfirmed = true;

        const correctKey = state.currentQuestion.poprawna;
        const isCorrect = (state.selectedAnswer === correctKey);

        const selectedBox = dom.answerBoxes[state.selectedAnswer];
        const correctBox = dom.answerBoxes[correctKey];

        // Reveal explanation
        dom.explanationContent.textContent = state.currentQuestion.wyjasnienie || 'Brak dodatkowego wyjaśnienia.';
        dom.explanationBox.classList.remove('hidden');

        if (isCorrect) {
            selectedBox.classList.remove('selected');
            selectedBox.classList.add('correct');

            if (window.soundEngine) {
                window.soundEngine.playCorrect();
            }

            // If player won 1 000 000 zł (10 pkt)
            if (state.currentLevel === 12) {
                setTimeout(() => {
                    handleGameVictory();
                }, 1000);
            } else {
                dom.btnNextQuestion.classList.remove('hidden');
            }
        } else {
            // Wrong answer
            selectedBox.classList.remove('selected');
            selectedBox.classList.add('wrong');

            // Show correct answer in green
            correctBox.classList.remove('hidden');
            correctBox.classList.add('revealed');
            correctBox.classList.add('correct');

            if (window.soundEngine) {
                window.soundEngine.playWrong();
            }

            setTimeout(() => {
                handleGameOver(false);
            }, 1800);
        }

        updateLadderDisplay();
    }

    /**
     * Handle Next Question advance
     */
    function advanceToNextLevel() {
        if (!state.isAnswerConfirmed) return;
        if (state.currentLevel < 12) {
            loadQuestionForLevel(state.currentLevel + 1);
        }
    }

    /**
     * Calculate guaranteed points won so far
     */
    function calculateGuaranteedPrize() {
        const completedLevel = state.isAnswerConfirmed && (state.selectedAnswer === state.currentQuestion.poprawna)
            ? state.currentLevel
            : state.currentLevel - 1;

        if (completedLevel >= 12) return 10;
        if (completedLevel >= 7) return 4;
        if (completedLevel >= 2) return 1;
        return 0;
    }

    /**
     * Calculate accumulated points (value of the last passed level)
     */
    function calculateCurrentPrize() {
        const completedLevel = state.isAnswerConfirmed && (state.selectedAnswer === state.currentQuestion.poprawna)
            ? state.currentLevel
            : state.currentLevel - 1;

        return PRIZES[completedLevel] || 0;
    }

    /**
     * Render the prize ladder in the sidebar (Levels 12 down to 1)
     */
    function renderLadder() {
        dom.ladderList.innerHTML = '';

        for (let lvl = 12; lvl >= 1; lvl--) {
            const li = document.createElement('li');
            li.className = 'ladder-item';
            li.id = 'ladder-level-' + lvl;

            if (GUARANTEED_LEVELS.includes(lvl)) {
                li.classList.add('guaranteed');
            }

            const numSpan = document.createElement('span');
            numSpan.className = 'ladder-level-num';
            numSpan.textContent = lvl;

            const diamondSpan = document.createElement('span');
            diamondSpan.className = 'ladder-diamond';
            diamondSpan.textContent = GUARANTEED_LEVELS.includes(lvl) ? '🔒' : '◆';

            const prizeSpan = document.createElement('span');
            prizeSpan.className = 'ladder-prize';
            prizeSpan.textContent = formatPoints(PRIZES[lvl]);

            li.appendChild(numSpan);
            li.appendChild(diamondSpan);
            li.appendChild(prizeSpan);

            dom.ladderList.appendChild(li);
        }
    }

    /**
     * Update highlights on the ladder based on current level and state
     */
    function updateLadderDisplay() {
        const currentWin = calculateCurrentPrize();
        const guaranteedWin = calculateGuaranteedPrize();

        dom.statCurrentWin.textContent = formatPoints(currentWin);
        dom.statGuaranteedWin.textContent = formatPoints(guaranteedWin);

        for (let lvl = 1; lvl <= 12; lvl++) {
            const item = document.getElementById('ladder-level-' + lvl);
            if (!item) continue;

            item.classList.remove('current', 'passed');

            if (lvl === state.currentLevel && !state.isGameOver) {
                item.classList.add('current');
            } else if (lvl < state.currentLevel || (lvl === state.currentLevel && state.isAnswerConfirmed && state.selectedAnswer === state.currentQuestion.poprawna)) {
                item.classList.add('passed');
            }
        }
    }

    /**
     * LIFELINE: 50:50 (Pół na pół)
     * Randomly removes 2 incorrect answers
     */
    function useLifeline5050() {
        if (!state.lifelines.fiftyFifty || state.isAnswerConfirmed || state.isSuspenseRunning) return;

        state.lifelines.fiftyFifty = false;
        dom.lifeline5050.disabled = true;
        dom.lifeline5050.classList.add('used');

        if (window.soundEngine) {
            window.soundEngine.playLifeline();
        }

        const correctKey = state.currentQuestion.poprawna;
        const incorrectKeys = ['A', 'B', 'C', 'D'].filter(k => k !== correctKey);

        // Shuffle incorrect keys and pick 2 to eliminate
        for (let i = incorrectKeys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [incorrectKeys[i], incorrectKeys[j]] = [incorrectKeys[j], incorrectKeys[i]];
        }

        const eliminated = incorrectKeys.slice(0, 2);
        eliminated.forEach(k => {
            state.eliminatedKeys.add(k);
            const box = dom.answerBoxes[k];
            box.classList.add('eliminated');
            box.disabled = true;
            if (state.selectedAnswer === k) {
                state.selectedAnswer = null;
                dom.btnConfirmAnswer.classList.add('hidden');
            }
        });
    }

    /**
     * LIFELINE: Telefon do przyjaciela
     * User requirement: "reszta nic nie musi robić, niech się tylko wyszarzy przy kliknięciu"
     */
    function useLifelinePhone() {
        if (!state.lifelines.phone || state.isAnswerConfirmed || state.isSuspenseRunning) return;

        state.lifelines.phone = false;
        dom.lifelinePhone.disabled = true;
        dom.lifelinePhone.classList.add('used');

        if (window.soundEngine) {
            window.soundEngine.playLifeline();
        }
    }

    /**
     * LIFELINE: Pytanie do publiczności
     * User requirement: "reszta nic nie musi robić, niech się tylko wyszarzy przy kliknięciu"
     */
    function useLifelineAudience() {
        if (!state.lifelines.audience || state.isAnswerConfirmed || state.isSuspenseRunning) return;

        state.lifelines.audience = false;
        dom.lifelineAudience.disabled = true;
        dom.lifelineAudience.classList.add('used');

        if (window.soundEngine) {
            window.soundEngine.playLifeline();
        }
    }

    /**
     * Handle Walk Away (Rezygnacja i zachowanie punktów)
     */
    function handleWalkAway() {
        if (state.isGameOver || state.isSuspenseRunning) return;

        const pointsWon = calculateCurrentPrize();
        const confirmMsg = pointsWon > 0
            ? `Czy na pewno chcesz zakończyć grę i zachować ${formatPoints(pointsWon)}?`
            : `Nie zdobyłeś jeszcze punktów. Czy na pewno chcesz zakończyć grę?`;

        if (!confirm(confirmMsg)) return;

        state.isGameOver = true;
        showModal({
            icon: '💾',
            title: 'ZAKOŃCZENIE GRY',
            prize: formatPoints(pointsWon),
            desc: `Postanowiłeś zakończyć grę ze zdobytą liczbą ${formatPoints(pointsWon)}!`
        });
    }

    /**
     * Handle Game Over (Player answered incorrectly)
     */
    function handleGameOver(isWalkAway = false) {
        state.isGameOver = true;
        const guaranteed = calculateGuaranteedPrize();

        showModal({
            icon: '❌',
            title: 'KONIEC GRY',
            prize: formatPoints(guaranteed),
            desc: guaranteed > 0
                ? `Kończysz grę ze zdobytą liczbą gwarantowaną: ${formatPoints(guaranteed)}!`
                : `Niestety, kończysz grę z 0 pkt. Spróbuj jeszcze raz!`
        });
    }

    /**
     * Handle Grand Victory (10 pkt)
     */
    function handleGameVictory() {
        state.isGameOver = true;
        startConfetti();

        if (window.soundEngine) {
            window.soundEngine.playJackpot();
        }

        showModal({
            icon: '👑',
            title: 'MISTRZ!',
            prize: '10 pkt',
            desc: 'Niesamowite! Odpowiedziałeś poprawnie na wszystkie 12 pytań i zdobyłeś maksymalne 10 punktów!'
        });
    }

    /**
     * Display a modal window
     */
    function showModal({ icon, title, prize, desc }) {
        dom.modalIcon.textContent = icon;
        dom.modalTitle.textContent = title;
        dom.modalPrize.textContent = prize;
        dom.modalDesc.textContent = desc;
        dom.modalContainer.classList.remove('hidden');
    }

    function hideModal() {
        dom.modalContainer.classList.add('hidden');
    }

    /**
     * Keyboard and Click Event Handlers
     */
    function attachEventListeners() {
        // Answer clicks
        ['A', 'B', 'C', 'D'].forEach(key => {
            dom.answerBoxes[key].addEventListener('click', () => {
                selectAnswer(key);
            });
        });

        // Reveal buttons
        dom.btnRevealNext.addEventListener('click', revealNextAnswer);
        dom.btnRevealAll.addEventListener('click', revealAllAnswers);

        // Confirm & Next buttons
        dom.btnConfirmAnswer.addEventListener('click', confirmAnswer);
        dom.btnNextQuestion.addEventListener('click', advanceToNextLevel);

        // Lifelines
        dom.lifeline5050.addEventListener('click', useLifeline5050);
        dom.lifelinePhone.addEventListener('click', useLifelinePhone);
        dom.lifelineAudience.addEventListener('click', useLifelineAudience);

        // Header controls
        dom.btnSound.addEventListener('click', () => {
            if (window.soundEngine) {
                const isEnabled = window.soundEngine.toggleMute();
                dom.soundIcon.textContent = isEnabled ? '🔊' : '🔇';
            }
        });

        dom.btnWalkaway.addEventListener('click', handleWalkAway);
        dom.btnRestart.addEventListener('click', () => {
            if (confirm('Czy na pewno chcesz rozpocząć nową grę dla kolejnego gracza?')) {
                startNewGame();
            }
        });
        dom.btnResetPool.addEventListener('click', resetSessionQuestions);

        dom.modalBtnRestart.addEventListener('click', () => {
            startNewGame();
        });

        // Global Keyboard Shortcuts
        window.addEventListener('keydown', handleGlobalKeydown);
    }

    /**
     * Handle Keyboard shortcuts:
     * - Space: Reveal next answer / Next question after evaluation
     * - Tab: Reveal all answers
     * - Enter: Confirm selected answer / Advance to next question
     * - Keys A, B, C, D (or 1, 2, 3, 4): Select answer
     */
    function handleGlobalKeydown(e) {
        if (state.isGameOver || state.isSuspenseRunning) return;

        // Space key: reveal next answer OR advance to next question
        if (e.code === 'Space') {
            e.preventDefault();
            if (state.isAnswerConfirmed) {
                advanceToNextLevel();
            } else if (state.revealedCount < 4) {
                revealNextAnswer();
            }
            return;
        }

        // Tab key: reveal all answers
        if (e.key === 'Tab') {
            e.preventDefault();
            if (!state.isAnswerConfirmed && state.revealedCount < 4) {
                revealAllAnswers();
            }
            return;
        }

        // Enter key: confirm answer if selected, or advance question if answered
        if (e.key === 'Enter') {
            e.preventDefault();
            if (state.isAnswerConfirmed) {
                advanceToNextLevel();
            } else if (state.selectedAnswer) {
                confirmAnswer();
            } else if (state.revealedCount < 4) {
                revealAllAnswers();
            }
            return;
        }

        // Key A / 1
        if (e.key === 'a' || e.key === 'A' || e.key === '1') {
            selectAnswer('A');
            return;
        }
        // Key B / 2
        if (e.key === 'b' || e.key === 'B' || e.key === '2') {
            selectAnswer('B');
            return;
        }
        // Key C / 3
        if (e.key === 'c' || e.key === 'C' || e.key === '3') {
            selectAnswer('C');
            return;
        }
        // Key D / 4
        if (e.key === 'd' || e.key === 'D' || e.key === '4') {
            selectAnswer('D');
            return;
        }
    }

    /**
     * Canvas Confetti for Grand Prize Winner
     */
    let confettiAnimationId = null;
    let confettiParticles = [];

    function startConfetti() {
        const canvas = dom.confettiCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        confettiParticles = [];
        const colors = ['#ffd700', '#ffb300', '#00e676', '#00d2ff', '#ff1744', '#ffffff'];

        for (let i = 0; i < 180; i++) {
            confettiParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 9 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 3.5 + 2,
                speedX: Math.random() * 2 - 1,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 6 - 3
            });
        }

        function renderConfetti() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            confettiParticles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;

                if (p.y > canvas.height) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });

            confettiAnimationId = requestAnimationFrame(renderConfetti);
        }

        renderConfetti();
    }

    function stopConfetti() {
        if (confettiAnimationId) {
            cancelAnimationFrame(confettiAnimationId);
            confettiAnimationId = null;
        }
        const canvas = dom.confettiCanvas;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Start on DOM ready
    window.addEventListener('DOMContentLoaded', init);
})();
