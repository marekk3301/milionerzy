/**
 * MILIONERZY - Question Editor & Manager Engine
 */

(function () {
    'use strict';

    const STORAGE_KEY_CUSTOM = 'swb_milionerzy_custom_questions';

    let allQuestions = [];
    let filteredQuestions = [];
    let currentSelectedId = null;

    // DOM Elements
    const dom = {
        statTotalCount: document.getElementById('stat-total-count'),
        statImgCount: document.getElementById('stat-img-count'),
        btnAddNew: document.getElementById('btn-add-new'),
        btnDownloadJson: document.getElementById('btn-download-json'),
        btnSaveDisk: document.getElementById('btn-save-disk'),
        btnRevertDefaults: document.getElementById('btn-revert-defaults'),

        // Filters
        filterSearch: document.getElementById('filter-search'),
        filterLevel: document.getElementById('filter-level'),
        filterHasImage: document.getElementById('filter-has-image'),
        filterVisibleCount: document.getElementById('filter-visible-count'),
        filterAllCount: document.getElementById('filter-all-count'),
        questionsList: document.getElementById('questions-list'),

        // Nav
        btnNavPrev: document.getElementById('btn-nav-prev'),
        btnNavNext: document.getElementById('btn-nav-next'),
        navCurrentPos: document.getElementById('nav-current-pos'),
        navIdBadge: document.getElementById('nav-id-badge'),

        // Edit Form
        form: document.getElementById('question-edit-form'),
        editLevel: document.getElementById('edit-level'),
        editCategory: document.getElementById('edit-category'),
        editQuestionText: document.getElementById('edit-question-text'),
        editImageUrl: document.getElementById('edit-image-url'),
        editImageSource: document.getElementById('edit-image-source'),
        btnClearImage: document.getElementById('btn-clear-image'),
        editImagePreviewBox: document.getElementById('edit-image-preview-box'),
        editImagePreview: document.getElementById('edit-image-preview'),

        correctRadios: {
            A: document.getElementById('correct-A'),
            B: document.getElementById('correct-B'),
            C: document.getElementById('correct-C'),
            D: document.getElementById('correct-D')
        },
        editAnswers: {
            A: document.getElementById('edit-answer-A'),
            B: document.getElementById('edit-answer-B'),
            C: document.getElementById('edit-answer-C'),
            D: document.getElementById('edit-answer-D')
        },
        editExplanation: document.getElementById('edit-explanation'),

        // Action Buttons
        btnSaveQuestion: document.getElementById('btn-save-question'),
        btnDuplicateQuestion: document.getElementById('btn-duplicate-question'),
        btnDeleteQuestion: document.getElementById('btn-delete-question')
    };

    /**
     * Initialize Editor
     */
    async function init() {
        attachEventListeners();
        checkLocalServerAvailability();
        await loadQuestions();
        applyFilters();
        if (filteredQuestions.length > 0) {
            selectQuestionById(filteredQuestions[0].id);
        }
    }

    /**
     * Check if running under local Node server (enables direct disk save)
     */
    async function checkLocalServerAvailability() {
        if (window.location.protocol.startsWith('http')) {
            try {
                const res = await fetch('/api/check', { method: 'HEAD' });
                if (res.ok || res.status === 404) {
                    dom.btnSaveDisk.classList.remove('hidden');
                }
            } catch (e) {
                // Not running on a compatible server
            }
        }
    }

    /**
     * Load questions from localStorage or JSON file
     */
    async function loadQuestions() {
        // 1. Check custom questions in localStorage
        try {
            const customData = localStorage.getItem(STORAGE_KEY_CUSTOM);
            if (customData) {
                const parsed = JSON.parse(customData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    allQuestions = parsed;
                    updateHeaderStats();
                    return;
                }
            }
        } catch (e) {
            console.warn('Could not read custom questions:', e);
        }

        // 2. Fetch from milionerzy.json with fallback to window.MILIONERZY_DATA
        try {
            const res = await fetch('milionerzy.json');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            allQuestions = data.pytania || [];
        } catch (e) {
            console.warn('Fetch failed, using window.MILIONERZY_DATA fallback:', e);
            if (window.MILIONERZY_DATA && window.MILIONERZY_DATA.pytania) {
                allQuestions = JSON.parse(JSON.stringify(window.MILIONERZY_DATA.pytania));
            } else {
                alert('Nie udało się załadować pytań.');
                allQuestions = [];
            }
        }

        updateHeaderStats();
    }

    /**
     * Save questions to localStorage
     */
    function saveCustomQuestionsToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(allQuestions));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
        updateHeaderStats();
    }

    /**
     * Update header counters
     */
    function updateHeaderStats() {
        const total = allQuestions.length;
        const withImg = allQuestions.filter(q => q.obrazek && q.obrazek.trim() !== '').length;

        dom.statTotalCount.textContent = total;
        dom.statImgCount.textContent = withImg;
        dom.filterAllCount.textContent = total;
    }

    /**
     * Filter questions based on search input, level dropdown, and image checkbox
     */
    function applyFilters() {
        const searchTerm = dom.filterSearch.value.trim().toLowerCase();
        const levelVal = dom.filterLevel.value;
        const onlyImages = dom.filterHasImage.checked;

        filteredQuestions = allQuestions.filter(q => {
            // Level filter
            if (levelVal !== 'all' && String(q.poziom) !== levelVal) {
                return false;
            }

            // Image filter
            if (onlyImages && (!q.obrazek || q.obrazek.trim() === '')) {
                return false;
            }

            // Search filter
            if (searchTerm !== '') {
                const textMatch = (q.pytanie || '').toLowerCase().includes(searchTerm);
                const catMatch = (q.kategoria || '').toLowerCase().includes(searchTerm);
                const idMatch = String(q.id) === searchTerm || ('#' + q.id) === searchTerm;
                const ansMatch = q.odpowiedzi && Object.values(q.odpowiedzi).some(a => String(a).toLowerCase().includes(searchTerm));

                if (!textMatch && !catMatch && !idMatch && !ansMatch) {
                    return false;
                }
            }

            return true;
        });

        dom.filterVisibleCount.textContent = filteredQuestions.length;
        renderQuestionsList();

        // Update selected question or preserve it
        if (filteredQuestions.length > 0) {
            const stillVisible = filteredQuestions.some(q => q.id === currentSelectedId);
            if (!stillVisible) {
                selectQuestionById(filteredQuestions[0].id);
            } else {
                updateNavigationUI();
            }
        } else {
            clearForm();
        }
    }

    /**
     * Render the list of questions in the sidebar
     */
    function renderQuestionsList() {
        dom.questionsList.innerHTML = '';

        if (filteredQuestions.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'empty-notice';
            emptyEl.textContent = 'Brak pytań spełniających kryteria wyszukiwania.';
            dom.questionsList.appendChild(emptyEl);
            return;
        }

        const fragment = document.createDocumentFragment();

        filteredQuestions.forEach((q, idx) => {
            const item = document.createElement('div');
            item.className = 'q-list-item';
            if (q.id === currentSelectedId) {
                item.classList.add('active');
            }
            item.dataset.id = q.id;

            const headerRow = document.createElement('div');
            headerRow.className = 'q-item-header';

            const levelBadge = document.createElement('span');
            levelBadge.className = 'q-badge-level';
            levelBadge.textContent = `Poz. ${q.poziom}`;

            const idBadge = document.createElement('span');
            idBadge.className = 'q-badge-id';
            idBadge.textContent = `#${q.id}`;

            const catBadge = document.createElement('span');
            catBadge.className = 'q-badge-cat';
            catBadge.textContent = q.kategoria || '';

            headerRow.appendChild(levelBadge);
            headerRow.appendChild(idBadge);
            headerRow.appendChild(catBadge);

            if (q.obrazek) {
                const imgBadge = document.createElement('span');
                imgBadge.className = 'q-badge-img';
                imgBadge.textContent = '🖼️';
                imgBadge.title = 'Pytanie z ilustracją';
                headerRow.appendChild(imgBadge);
            }

            const title = document.createElement('div');
            title.className = 'q-item-title';
            title.textContent = q.pytanie;

            // Answers preview with correct answer marked
            const answersRow = document.createElement('div');
            answersRow.className = 'q-item-answers-preview';

            ['A', 'B', 'C', 'D'].forEach(letter => {
                const ansSpan = document.createElement('span');
                ansSpan.className = 'ans-pill';
                if (q.poprawna === letter) {
                    ansSpan.classList.add('correct');
                }
                const ansText = q.odpowiedzi ? q.odpowiedzi[letter] : '';
                ansSpan.textContent = `${letter}: ${ansText}`;
                answersRow.appendChild(ansSpan);
            });

            item.appendChild(headerRow);
            item.appendChild(title);
            item.appendChild(answersRow);

            item.addEventListener('click', () => {
                selectQuestionById(q.id);
            });

            fragment.appendChild(item);
        });

        dom.questionsList.appendChild(fragment);
    }

    /**
     * Select question by ID and populate the editor form
     */
    function selectQuestionById(id) {
        currentSelectedId = id;
        const q = allQuestions.find(item => item.id === id);
        if (!q) return;

        // Highlight active item in list
        const allItems = dom.questionsList.querySelectorAll('.q-list-item');
        allItems.forEach(el => {
            el.classList.toggle('active', el.dataset.id === String(id));
        });

        populateForm(q);
        updateNavigationUI();
    }

    /**
     * Populate the form fields with question data
     */
    function populateForm(q) {
        dom.editLevel.value = q.poziom || 1;
        dom.editCategory.value = q.kategoria || '';
        dom.editQuestionText.value = q.pytanie || '';
        dom.editImageUrl.value = q.obrazek || '';
        dom.editImageSource.value = q.zrodlo_obrazka || '';

        // Answers
        ['A', 'B', 'C', 'D'].forEach(key => {
            dom.editAnswers[key].value = (q.odpowiedzi && q.odpowiedzi[key]) ? q.odpowiedzi[key] : '';
            dom.correctRadios[key].checked = (q.poprawna === key);
        });

        dom.editExplanation.value = q.wyjasnienie || '';

        updateImagePreview(q.obrazek);
    }

    /**
     * Clear form when no question matches
     */
    function clearForm() {
        currentSelectedId = null;
        dom.navCurrentPos.textContent = 'Brak pytań';
        dom.navIdBadge.textContent = '';
        dom.form.reset();
        updateImagePreview('');
    }

    /**
     * Update Live Image Preview in the form
     */
    function updateImagePreview(url) {
        const cleanUrl = (url || '').trim();
        if (cleanUrl) {
            dom.editImagePreview.src = cleanUrl;
            dom.editImagePreviewBox.classList.remove('hidden');
        } else {
            dom.editImagePreview.src = '';
            dom.editImagePreviewBox.classList.add('hidden');
        }
    }

    /**
     * Update Next/Previous navigation bar
     */
    function updateNavigationUI() {
        const currentIndex = filteredQuestions.findIndex(q => q.id === currentSelectedId);
        const total = filteredQuestions.length;

        if (currentIndex === -1 || total === 0) {
            dom.navCurrentPos.textContent = '0 z 0';
            dom.navIdBadge.textContent = '';
            dom.btnNavPrev.disabled = true;
            dom.btnNavNext.disabled = true;
            return;
        }

        dom.navCurrentPos.textContent = `Pytanie ${currentIndex + 1} z ${total}`;
        dom.navIdBadge.textContent = `ID: #${currentSelectedId}`;

        dom.btnNavPrev.disabled = (currentIndex === 0);
        dom.btnNavNext.disabled = (currentIndex === total - 1);
    }

    /**
     * Navigate to Previous Question
     */
    function navigatePrev() {
        const currentIndex = filteredQuestions.findIndex(q => q.id === currentSelectedId);
        if (currentIndex > 0) {
            selectQuestionById(filteredQuestions[currentIndex - 1].id);
            scrollActiveItemIntoView();
        }
    }

    /**
     * Navigate to Next Question
     */
    function navigateNext() {
        const currentIndex = filteredQuestions.findIndex(q => q.id === currentSelectedId);
        if (currentIndex < filteredQuestions.length - 1 && currentIndex !== -1) {
            selectQuestionById(filteredQuestions[currentIndex + 1].id);
            scrollActiveItemIntoView();
        }
    }

    function scrollActiveItemIntoView() {
        const activeEl = dom.questionsList.querySelector('.q-list-item.active');
        if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    /**
     * Save Current Question Changes
     */
    function saveCurrentQuestion() {
        if (!currentSelectedId) {
            alert('Wybierz pytanie do edycji.');
            return;
        }

        const q = allQuestions.find(item => item.id === currentSelectedId);
        if (!q) return;

        const level = parseInt(dom.editLevel.value, 10);
        const category = dom.editCategory.value.trim();
        const text = dom.editQuestionText.value.trim();
        const imgUrl = dom.editImageUrl.value.trim();
        const imgSrc = dom.editImageSource.value.trim();

        if (!text) {
            alert('Treść pytania nie może być pusta!');
            dom.editQuestionText.focus();
            return;
        }

        const answers = {
            A: dom.editAnswers.A.value.trim(),
            B: dom.editAnswers.B.value.trim(),
            C: dom.editAnswers.C.value.trim(),
            D: dom.editAnswers.D.value.trim()
        };

        if (!answers.A || !answers.B || !answers.C || !answers.D) {
            alert('Wszystkie 4 warianty odpowiedzi (A, B, C, D) muszą być uzupełnione!');
            return;
        }

        let correct = 'A';
        for (let k of ['A', 'B', 'C', 'D']) {
            if (dom.correctRadios[k].checked) {
                correct = k;
                break;
            }
        }

        const explanation = dom.editExplanation.value.trim();

        // Update question object
        q.poziom = level;
        q.kategoria = category || 'Ogólne';
        q.pytanie = text;
        q.odpowiedzi = answers;
        q.poprawna = correct;
        q.wyjasnienie = explanation;

        if (imgUrl) {
            q.obrazek = imgUrl;
            if (imgSrc) q.zrodlo_obrazka = imgSrc;
            else delete q.zrodlo_obrazka;
        } else {
            delete q.obrazek;
            delete q.zrodlo_obrazka;
        }

        saveCustomQuestionsToStorage();
        applyFilters();

        // Visual feedback
        const saveBtn = dom.btnSaveQuestion;
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '✅ Zapisano pomyślnie!';
        saveBtn.style.background = 'linear-gradient(180deg, #00e676 0%, #00873d 100%)';
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.background = '';
        }, 1200);
    }

    /**
     * Delete Current Question
     */
    function deleteCurrentQuestion() {
        if (!currentSelectedId) return;

        const q = allQuestions.find(item => item.id === currentSelectedId);
        if (!q) return;

        const confirmMsg = `Czy na pewno chcesz BEZPOWROTNIE USUNĄĆ to pytanie?\n\nID: #${q.id}\nPoziom: ${q.poziom}\nPytanie: "${q.pytanie}"`;
        if (!confirm(confirmMsg)) return;

        const currentIndex = filteredQuestions.findIndex(item => item.id === currentSelectedId);

        // Remove from allQuestions
        allQuestions = allQuestions.filter(item => item.id !== currentSelectedId);
        saveCustomQuestionsToStorage();

        // Determine next question to select
        applyFilters();

        if (filteredQuestions.length > 0) {
            const nextIdx = Math.min(currentIndex, filteredQuestions.length - 1);
            selectQuestionById(filteredQuestions[nextIdx].id);
        } else {
            clearForm();
        }

        alert('Pytanie zostało pomyślnie usunięte!');
    }

    /**
     * Add a New Question
     */
    function addNewQuestion() {
        const nextId = allQuestions.reduce((max, q) => Math.max(max, q.id || 0), 0) + 1;
        const currentLvl = parseInt(dom.filterLevel.value, 10) || 1;

        const newQ = {
            id: nextId,
            poziom: currentLvl,
            nagroda: 500,
            kategoria: 'Ogólne',
            pytanie: 'Nowe pytanie...',
            odpowiedzi: {
                A: 'Odpowiedź A',
                B: 'Odpowiedź B',
                C: 'Odpowiedź C',
                D: 'Odpowiedź D'
            },
            poprawna: 'A',
            wyjasnienie: 'Wyjaśnienie dlaczego odpowiedź A jest poprawna.'
        };

        allQuestions.unshift(newQ);
        saveCustomQuestionsToStorage();

        dom.filterSearch.value = '';
        applyFilters();
        selectQuestionById(nextId);
        dom.editQuestionText.focus();
        dom.editQuestionText.select();
    }

    /**
     * Duplicate Current Question
     */
    function duplicateCurrentQuestion() {
        if (!currentSelectedId) return;
        const q = allQuestions.find(item => item.id === currentSelectedId);
        if (!q) return;

        const nextId = allQuestions.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
        const dup = JSON.parse(JSON.stringify(q));
        dup.id = nextId;
        dup.pytanie = dup.pytanie + ' (Kopia)';

        allQuestions.unshift(dup);
        saveCustomQuestionsToStorage();

        dom.filterSearch.value = '';
        applyFilters();
        selectQuestionById(nextId);
    }

    /**
     * Download updated milionerzy.json file
     */
    function downloadUpdatedJson() {
        const exportData = {
            tytul: 'Milionerzy: technika cyfrowa, elektronika i systemy wbudowane',
            liczba_pytan: allQuestions.length,
            drabinka_nagrod: {
                "1": 500, "2": 1000, "3": 2000, "4": 5000, "5": 10000, "6": 20000,
                "7": 40000, "8": 75000, "9": 125000, "10": 250000, "11": 500000, "12": 1000000
            },
            pytania: allQuestions
        };

        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json; charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'milionerzy.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Save directly to local disk (when running with node server.js)
     */
    async function saveDirectlyToDisk() {
        const btn = dom.btnSaveDisk;
        btn.disabled = true;
        btn.textContent = '⏳ Zapisywanie...';

        try {
            const res = await fetch('/api/save-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pytania: allQuestions })
            });

            if (!res.ok) throw new Error('Serwer zwrócił błąd HTTP ' + res.status);
            const data = await res.json();

            btn.textContent = '✅ Zapisano na dysku!';
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = '⚡ Zapisz na dysku';
            }, 1800);
            alert(`Pomyślnie zapisano ${allQuestions.length} pytań w pliku milionerzy.json na dysku!`);
        } catch (e) {
            console.error(e);
            alert('Nie udało się zapisać na dysku (upewnij się, że serwer node server.js jest uruchomiony). Możesz użyć przycisku "📥 Pobierz JSON".');
            btn.disabled = false;
            btn.textContent = '⚡ Zapisz na dysku';
        }
    }

    /**
     * Revert to original questions from milionerzy.json
     */
    async function revertToDefaults() {
        const confirmMsg = 'Czy na pewno chcesz przywrócić oryginalną bazę pytań z pliku milionerzy.json?\nWszelkie zmiany i usunięcia dokonane w przeglądarce zostaną zresetowane.';
        if (!confirm(confirmMsg)) return;

        localStorage.removeItem(STORAGE_KEY_CUSTOM);
        await loadQuestions();
        applyFilters();
        if (filteredQuestions.length > 0) {
            selectQuestionById(filteredQuestions[0].id);
        }
        alert('Przywrócono domyślną bazę pytań!');
    }

    /**
     * Attach Event Listeners
     */
    function attachEventListeners() {
        // Filters
        dom.filterSearch.addEventListener('input', applyFilters);
        dom.filterLevel.addEventListener('change', applyFilters);
        dom.filterHasImage.addEventListener('change', applyFilters);

        // Navigation
        dom.btnNavPrev.addEventListener('click', navigatePrev);
        dom.btnNavNext.addEventListener('click', navigateNext);

        // Image input preview update
        dom.editImageUrl.addEventListener('input', () => {
            updateImagePreview(dom.editImageUrl.value);
        });

        dom.btnClearImage.addEventListener('click', () => {
            dom.editImageUrl.value = '';
            dom.editImageSource.value = '';
            updateImagePreview('');
        });

        // Form actions
        dom.btnSaveQuestion.addEventListener('click', saveCurrentQuestion);
        dom.btnDeleteQuestion.addEventListener('click', deleteCurrentQuestion);
        dom.btnAddNew.addEventListener('click', addNewQuestion);
        dom.btnDuplicateQuestion.addEventListener('click', duplicateCurrentQuestion);
        dom.btnDownloadJson.addEventListener('click', downloadUpdatedJson);
        dom.btnSaveDisk.addEventListener('click', saveDirectlyToDisk);
        dom.btnRevertDefaults.addEventListener('click', revertToDefaults);

        // Global Keyboard shortcuts in Editor
        window.addEventListener('keydown', handleEditorKeydown);
    }

    function handleEditorKeydown(e) {
        // Ctrl+S: Save current question
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveCurrentQuestion();
            return;
        }

        // Arrow navigation when not actively typing in an input/textarea
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
            if (e.key === 'ArrowLeft' || e.key === '[') {
                e.preventDefault();
                navigatePrev();
            } else if (e.key === 'ArrowRight' || e.key === ']') {
                e.preventDefault();
                navigateNext();
            }
        }
    }

    // Launch
    window.addEventListener('DOMContentLoaded', init);
})();
