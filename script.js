/**
 * Ключ для сохранения прогресса в localStorage
 */
const STORAGE_KEY = 'artemStudyProgress';
const PROGRESS_QUERY_PARAM = 'progress';
const SHARE_STATUS_RESET_DELAY = 3000;

/**
 * Загружает прогресс из localStorage
 * @returns {Object} Объект с сохраненным прогрессом
 */
function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
}

/**
 * Сохраняет прогресс в localStorage
 * @param {Object} progress - Объект с прогрессом для сохранения
 */
function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Получает все чекбоксы прогресса в стабильном порядке
 * @returns {HTMLInputElement[]} Массив чекбоксов прогресса
 */
function getProgressCheckboxes() {
    return Array.from(document.querySelectorAll('.skill-item input[type="checkbox"]'));
}

/**
 * Создает строку состояния прогресса для передачи в ссылке
 * @returns {string} Строка из 0 и 1, отражающая состояние чекбоксов
 */
function createProgressSnapshot() {
    return getProgressCheckboxes()
        .map(checkbox => checkbox.checked ? '1' : '0')
        .join('');
}

/**
 * Применяет состояние прогресса из строки снимка
 * @param {string} snapshot - Строка состояния прогресса
 * @returns {boolean} true если снимок успешно применен
 */
function applyProgressSnapshot(snapshot) {
    const checkboxes = getProgressCheckboxes();

    if (!/^[01]+$/.test(snapshot) || snapshot.length !== checkboxes.length) {
        return false;
    }

    const progress = {};

    checkboxes.forEach((checkbox, index) => {
        const isChecked = snapshot[index] === '1';
        checkbox.checked = isChecked;

        if (isChecked) {
            progress[checkbox.id] = true;
        }
    });

    saveProgress(progress);
    return true;
}

/**
 * Обновляет весь интерфейс прогресса после изменения чекбоксов
 */
function refreshProgressUI() {
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach(updateSkillItemState);

    const mainCheckboxes = document.querySelectorAll('input[data-category]');
    const categories = new Set(Array.from(mainCheckboxes).map(checkbox => checkbox.dataset.category));

    categories.forEach(category => updateCategoryProgress(category));
    updateTotalProgress();
    updateReadyForTestIndicator();
}

/**
 * Показывает сообщение рядом с кнопкой обмена прогрессом
 * @param {string} message - Текст сообщения
 * @param {boolean} isError - Признак сообщения об ошибке
 */
function showShareStatus(message, isError = false) {
    const statusElement = document.getElementById('shareProgressStatus');

    if (!statusElement) {
        return;
    }

    statusElement.textContent = message;
    statusElement.classList.remove('is-success', 'is-error');
    statusElement.classList.add(isError ? 'is-error' : 'is-success');

    window.clearTimeout(showShareStatus.timeoutId);
    showShareStatus.timeoutId = window.setTimeout(() => {
        statusElement.textContent = '';
        statusElement.classList.remove('is-success', 'is-error');
    }, SHARE_STATUS_RESET_DELAY);
}

/**
 * Создает ссылку с текущим прогрессом
 * @returns {string} Полная ссылка с зашитым прогрессом
 */
function buildProgressShareLink() {
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set(PROGRESS_QUERY_PARAM, createProgressSnapshot());
    return shareUrl.toString();
}

/**
 * Копирует текст в буфер обмена
 * @param {string} text - Текст для копирования
 * @returns {Promise<void>}
 */
async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const helperTextarea = document.createElement('textarea');
    helperTextarea.value = text;
    helperTextarea.setAttribute('readonly', '');
    helperTextarea.style.position = 'fixed';
    helperTextarea.style.left = '-9999px';
    document.body.appendChild(helperTextarea);
    helperTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(helperTextarea);
}

/**
 * Копирует ссылку с текущим прогрессом
 * @returns {Promise<void>}
 */
async function copyProgressLink() {
    try {
        const shareLink = buildProgressShareLink();
        await copyTextToClipboard(shareLink);
        showShareStatus('Ссылка скопирована');
    } catch (error) {
        showShareStatus('Не удалось скопировать ссылку', true);
    }
}

/**
 * Загружает прогресс из параметра ссылки
 * @returns {boolean} true если прогресс успешно загружен
 */
function importProgressFromUrl() {
    const currentUrl = new URL(window.location.href);
    const snapshot = currentUrl.searchParams.get(PROGRESS_QUERY_PARAM);

    if (!snapshot) {
        return false;
    }

    const isApplied = applyProgressSnapshot(snapshot);

    currentUrl.searchParams.delete(PROGRESS_QUERY_PARAM);
    window.history.replaceState({}, document.title, currentUrl.toString());

    if (isApplied) {
        showShareStatus('Прогресс загружен из ссылки');
        return true;
    }

    showShareStatus('Ссылка с прогрессом повреждена', true);
    return false;
}

/**
 * Проверяет, полностью ли выполнен навык (оба чекбокса отмечены)
 * @param {HTMLInputElement} mainCheckbox - Основной чекбокс навыка
 * @returns {boolean} true если оба чекбокса отмечены
 */
function isSkillCompleted(mainCheckbox) {
    if (!mainCheckbox.checked) return false;
    
    const readyCheckbox = document.getElementById(`ready-${mainCheckbox.id}`);
    return readyCheckbox ? readyCheckbox.checked : false;
}

/**
 * Обновляет счетчик прогресса и прогресс-бар для конкретной категории
 * @param {string} category - Название категории
 */
function updateCategoryProgress(category) {
    const checkboxes = document.querySelectorAll(`input[data-category="${category}"]`);
    const checked = Array.from(checkboxes).filter(cb => isSkillCompleted(cb)).length;
    const total = checkboxes.length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
    
    const progressElement = document.querySelector(`[data-category="${category}"]`);
    if (progressElement) {
        progressElement.textContent = `${checked} из ${total}`;
    }
    
    const progressBar = document.querySelector(`[data-progress="${category}"]`);
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    const statProgressElement = document.querySelector(`[data-stat="${category}"]`);
    if (statProgressElement) {
        statProgressElement.textContent = `${checked} из ${total} (${percentage}%)`;
    }
    
    const statProgressBar = document.querySelector(`[data-stat-progress="${category}"]`);
    if (statProgressBar) {
        statProgressBar.style.width = `${percentage}%`;
    }
}

/**
 * Обновляет общий прогресс-бар и текст прогресса
 */
function updateTotalProgress() {
    const allMainCheckboxes = document.querySelectorAll('input[type="checkbox"][data-category]');
    const checked = Array.from(allMainCheckboxes).filter(cb => isSkillCompleted(cb)).length;
    const total = allMainCheckboxes.length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
    
    const totalProgressBar = document.getElementById('totalProgress');
    const totalProgressText = document.getElementById('totalProgressText');
    
    if (totalProgressBar) {
        totalProgressBar.style.width = `${percentage}%`;
    }
    
    if (totalProgressText) {
        totalProgressText.textContent = `${checked} из ${total} (${percentage}%)`;
    }
    
    updateCircularProgress(percentage);
}

/**
 * Получает звание на основе процента выполнения
 * @param {number} percentage - Процент выполнения
 * @returns {Object} Объект с названием звания и классом
 */
function getRank(percentage) {
    const ranks = [
        { min: 0, max: 5, title: 'Новичок', class: 'rank-low' },
        { min: 5, max: 10, title: 'Начинающий', class: 'rank-low' },
        { min: 10, max: 15, title: 'Ученик', class: 'rank-low' },
        { min: 15, max: 20, title: 'Стажёр', class: 'rank-low' },
        { min: 20, max: 25, title: 'Практикант', class: 'rank-low' },
        { min: 25, max: 30, title: 'Подмастерье', class: 'rank-medium' },
        { min: 30, max: 35, title: 'Специалист', class: 'rank-medium' },
        { min: 35, max: 40, title: 'Профи', class: 'rank-medium' },
        { min: 40, max: 45, title: 'Эксперт', class: 'rank-medium' },
        { min: 45, max: 50, title: 'Мастер', class: 'rank-medium' },
        { min: 50, max: 55, title: 'Джуниор', class: 'rank-medium' },
        { min: 55, max: 60, title: 'Джуниор+', class: 'rank-medium' },
        { min: 60, max: 65, title: 'Мидл', class: 'rank-high' },
        { min: 65, max: 70, title: 'Мидл+', class: 'rank-high' },
        { min: 70, max: 75, title: 'Сеньор', class: 'rank-high' },
        { min: 75, max: 80, title: 'Сеньор+', class: 'rank-high' },
        { min: 80, max: 85, title: 'Лид', class: 'rank-high' },
        { min: 85, max: 90, title: 'Архитектор', class: 'rank-high' },
        { min: 90, max: 95, title: 'Легенда', class: 'rank-epic' },
        { min: 95, max: 100, title: 'Титан', class: 'rank-epic' },
        { min: 100, max: 100, title: 'Гигачад', class: 'rank-gigachad' }
    ];
    
    for (const rank of ranks) {
        if (percentage >= rank.min && (percentage < rank.max || (percentage === 100 && rank.max === 100))) {
            return rank;
        }
    }
    
    return ranks[0];
}

/**
 * Обновляет отображение звания
 * @param {number} percentage - Процент выполнения
 */
function updateRank(percentage) {
    const rankTitle = document.getElementById('rankTitle');
    if (rankTitle) {
        const rank = getRank(percentage);
        rankTitle.textContent = rank.title;
        rankTitle.className = 'rank-title';
        if (rank.class) {
            rankTitle.classList.add(rank.class);
        }
    }
}

/**
 * Обновляет круговой прогресс-бар в intro секции
 * @param {number} percentage - Процент выполнения
 */
function updateCircularProgress(percentage) {
    const circle = document.getElementById('progressCircle');
    const percentageText = document.getElementById('skillsPercentage');
    
    if (circle && percentageText) {
        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;
        
        circle.style.strokeDashoffset = offset;
        percentageText.textContent = `${percentage}%`;
    }
    
    updateRank(percentage);
}

/**
 * Форматирует число с ведущим нулем
 * @param {number} num - Число для форматирования
 * @returns {string} Отформатированное число
 */
function padZero(num) {
    return num.toString().padStart(2, '0');
}

/**
 * Рассчитывает и отображает время обучения с 1 января 2026 года
 */
function updateLearningTime() {
    const startDate = new Date('2026-01-01T00:00:00');
    const currentDate = new Date();
    
    const diffTime = Math.abs(currentDate - startDate);
    
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);
    
    const daysElement = document.getElementById('daysLearning');
    const hoursElement = document.getElementById('hoursLearning');
    const minutesElement = document.getElementById('minutesLearning');
    const secondsElement = document.getElementById('secondsLearning');
    
    if (daysElement) {
        const newValue = days.toString();
        if (daysElement.textContent !== newValue) {
            daysElement.textContent = newValue;
            animateValue(daysElement);
        }
    }
    
    if (hoursElement) {
        const newValue = padZero(hours);
        if (hoursElement.textContent !== newValue) {
            hoursElement.textContent = newValue;
            animateValue(hoursElement);
        }
    }
    
    if (minutesElement) {
        const newValue = padZero(minutes);
        if (minutesElement.textContent !== newValue) {
            minutesElement.textContent = newValue;
            animateValue(minutesElement);
        }
    }
    
    if (secondsElement) {
        const newValue = padZero(seconds);
        if (secondsElement.textContent !== newValue) {
            secondsElement.textContent = newValue;
            animateValue(secondsElement);
        }
    }
}

/**
 * Анимирует изменение значения элемента
 * @param {HTMLElement} element - Элемент для анимации
 */
function animateValue(element) {
    element.style.transform = 'scale(1.2)';
    element.style.color = '#60a5fa';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.color = '';
    }, 200);
}

/**
 * Запускает таймер для обновления времени обучения каждую секунду
 */
function startLearningTimer() {
    updateLearningTime();
    setInterval(updateLearningTime, 1000);
}

/**
 * Получает название категории по ID чекбокса
 * @param {string} checkboxId - ID чекбокса
 * @returns {string} Название категории
 */
function getCategoryName(checkboxId) {
    const categoryMap = {
        'figma': 'Figma',
        'html': 'HTML',
        'css': 'CSS',
        'scss': 'SCSS',
        'layout': 'Верстка',
        'javascript': 'JavaScript',
        'jquery': 'jQuery',
        'libraries': 'Библиотеки',
        'tools': 'Инструменты',
        'practice': 'Практика'
    };
    
    for (const [key, value] of Object.entries(categoryMap)) {
        if (checkboxId.includes(key)) {
            return value;
        }
    }
    return 'Другое';
}

/**
 * Обновляет индикатор и список навыков, готовых к тестированию
 */
function updateReadyForTestIndicator() {
    const readyCheckboxes = document.querySelectorAll('input[data-ready-for]:checked');
    const readyIndicator = document.getElementById('readyIndicator');
    const readyCount = document.getElementById('readyCount');
    const readyListContent = document.getElementById('readyListContent');
    
    if (!readyIndicator || !readyCount || !readyListContent) return;
    
    const readySkills = [];
    
    readyCheckboxes.forEach(checkbox => {
        const skillId = checkbox.getAttribute('data-ready-for');
        const mainCheckbox = document.getElementById(skillId);
        
        if (mainCheckbox && !mainCheckbox.checked) {
            const skillItem = mainCheckbox.closest('.skill-item');
            const skillName = skillItem.querySelector('.skill-name');
            const category = mainCheckbox.getAttribute('data-category');
            
            if (skillName) {
                readySkills.push({
                    id: skillId,
                    name: skillName.textContent,
                    category: getCategoryName(category)
                });
            }
        }
    });
    
    if (readySkills.length > 0) {
        readyIndicator.style.display = 'flex';
        readyCount.textContent = `${readySkills.length} ${readySkills.length === 1 ? 'навык' : readySkills.length < 5 ? 'навыка' : 'навыков'}`;
        
        readyListContent.innerHTML = readySkills.map(skill => `
            <a href="#skill-${skill.id}" class="ready-list-item" data-skill-id="${skill.id}">
                <span class="ready-list-item-icon">📝</span>
                <div class="ready-list-item-text">
                    <div class="ready-list-item-category">${skill.category}</div>
                    <div class="ready-list-item-name">${skill.name}</div>
                </div>
            </a>
        `).join('');
        
        const readyListItems = readyListContent.querySelectorAll('.ready-list-item');
        readyListItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const skillId = this.getAttribute('data-skill-id');
                const skillElement = document.getElementById(skillId);
                if (skillElement) {
                    const skillItem = skillElement.closest('.skill-item');
                    skillItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    skillItem.style.animation = 'highlight 1s ease';
                    setTimeout(() => {
                        skillItem.style.animation = '';
                    }, 1000);
                }
                
                const readyList = document.getElementById('readyList');
                const toggleButton = document.getElementById('toggleReadyList');
                if (readyList && toggleButton) {
                    readyList.style.display = 'none';
                    toggleButton.classList.remove('active');
                    toggleButton.textContent = 'Показать список';
                }
            });
        });
    } else {
        readyIndicator.style.display = 'none';
    }
}

/**
 * Инициализирует переключатель списка готовых к тестированию
 */
function initReadyListToggle() {
    const toggleButton = document.getElementById('toggleReadyList');
    const readyList = document.getElementById('readyList');
    
    if (toggleButton && readyList) {
        toggleButton.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = readyList.style.display === 'block';
            readyList.style.display = isVisible ? 'none' : 'block';
            this.classList.toggle('active');
            this.textContent = isVisible ? 'Показать список' : 'Скрыть список';
        });
        
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.ready-for-test-indicator')) {
                readyList.style.display = 'none';
                toggleButton.classList.remove('active');
                toggleButton.textContent = 'Показать список';
            }
        });
    }
}

/**
 * Инициализирует чекбоксы: загружает сохраненный прогресс и добавляет обработчики событий
 */
function initCheckboxes() {
    const progress = loadProgress();
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        if (progress[checkbox.id]) {
            checkbox.checked = true;
        }
        
        if (checkbox.dataset.category) {
            checkbox.addEventListener('change', function() {
                const progress = loadProgress();
                progress[this.id] = this.checked;
                saveProgress(progress);
                
                const category = this.dataset.category;
                updateCategoryProgress(category);
                updateTotalProgress();
            });
        }
    });
    
    refreshProgressUI();
}

/**
 * Обновляет визуальное состояние skill-item в зависимости от чекбоксов
 * @param {HTMLElement} item - Элемент skill-item
 */
function updateSkillItemState(item) {
    const readyCheckbox = item.querySelector('input[data-ready-for]');
    const mainCheckbox = item.querySelector('input[data-category]');
    
    if (readyCheckbox && mainCheckbox) {
        if (readyCheckbox.checked && mainCheckbox.checked) {
            item.classList.add('skill-item--completed');
        } else {
            item.classList.remove('skill-item--completed');
        }
    }
}

/**
 * Добавляет чекбоксы "Готов к тестированию" ко всем навыкам
 */
function addReadyCheckboxes() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    skillItems.forEach(item => {
        const mainCheckbox = item.querySelector('input[type="checkbox"][data-category]');
        if (!mainCheckbox) return;
        
        if (!item.id) {
            item.id = `skill-${mainCheckbox.id}`;
        }
        
        const existingReadyCheckbox = item.querySelector('input[data-ready-for]');
        if (existingReadyCheckbox) return;
        
        const readyWrapper = document.createElement('div');
        readyWrapper.className = 'checkbox-wrapper checkbox-wrapper--ready';
        
        const readyCheckbox = document.createElement('input');
        readyCheckbox.type = 'checkbox';
        readyCheckbox.id = `ready-${mainCheckbox.id}`;
        readyCheckbox.setAttribute('data-ready-for', mainCheckbox.id);
        
        const readyLabel = document.createElement('label');
        readyLabel.htmlFor = readyCheckbox.id;
        readyLabel.className = 'ready-label';
        readyLabel.textContent = '📝';
        readyLabel.title = 'Готов к тестированию';
        
        readyWrapper.appendChild(readyCheckbox);
        readyWrapper.appendChild(readyLabel);
        
        item.insertBefore(readyWrapper, item.firstChild);
        
        const savedProgress = loadProgress();
        if (savedProgress[readyCheckbox.id]) {
            readyCheckbox.checked = true;
        }
        
        updateSkillItemState(item);
        
        readyCheckbox.addEventListener('change', function() {
            const progress = loadProgress();
            progress[this.id] = this.checked;
            saveProgress(progress);
            updateSkillItemState(item);
            
            const category = mainCheckbox.dataset.category;
            updateCategoryProgress(category);
            updateTotalProgress();
            updateReadyForTestIndicator();
        });
        
        mainCheckbox.addEventListener('change', function() {
            updateSkillItemState(item);
            
            const category = this.dataset.category;
            updateCategoryProgress(category);
            updateTotalProgress();
            updateReadyForTestIndicator();
        });
    });
}

/**
 * Инициализирует клик по всей области skill-item для переключения чекбокса
 */
function initSkillItemClicks() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    skillItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || 
                e.target.classList.contains('ready-label') || 
                e.target.classList.contains('tooltip-trigger') ||
                e.target.classList.contains('tooltip')) {
                return;
            }
            
            const checkbox = this.querySelector('input[type="checkbox"][data-category]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });
}

/**
 * Массив советов
 */
const TIPS = [
    { id: 1, category: "Figma", text: "Используй Auto Layout для адаптивных компонентов" },
    { id: 2, category: "Figma", text: "Горячие клавиши: V - выделение, F - рамка, T - текст" },
    { id: 3, category: "Figma", text: "Проверяй отступы с помощью Alt при выделении элемента" },
    { id: 4, category: "Figma", text: "Копируй CSS свойства через правую кнопку мыши" },
    { id: 5, category: "Figma", text: "Используй Constraints для адаптивности элементов" },
    { id: 6, category: "Figma", text: "Экспортируй иконки в SVG для лучшего качества" },
    { id: 7, category: "Figma", text: "Создавай компоненты для повторяющихся элементов" },
    { id: 8, category: "Figma", text: "Используй сетку (Grid) для выравнивания элементов" },
    { id: 9, category: "Figma", text: "Проверяй макет на разных размерах экрана" },
    { id: 10, category: "Figma", text: "Используй плагины для ускорения работы" },
    { id: 11, category: "HTML", text: "Всегда используй семантические теги: header, nav, main, footer" },
    { id: 12, category: "HTML", text: "Добавляй alt к изображениям для доступности и SEO" },
    { id: 13, category: "HTML", text: "Используй <button> для кнопок, а не <div>" },
    { id: 14, category: "HTML", text: "Проверяй валидность HTML через validator.w3.org" },
    { id: 15, category: "HTML", text: "Используй <label> для связи с input элементами" },
    { id: 16, category: "HTML", text: "Не забывай про meta viewport для адаптивности" },
    { id: 17, category: "HTML", text: "Используй data-* атрибуты для хранения данных" },
    { id: 18, category: "HTML", text: "Структурируй код с помощью <section> и <article>" },
    { id: 19, category: "HTML", text: "Используй <picture> для адаптивных изображений" },
    { id: 20, category: "HTML", text: "Добавляй title к ссылкам для лучшего UX" },
    { id: 21, category: "CSS", text: "Используй CSS переменные для повторяющихся значений" },
    { id: 22, category: "CSS", text: "Flexbox для одномерных макетов, Grid для двумерных" },
    { id: 23, category: "CSS", text: "Используй rem для размеров, px только для border" },
    { id: 24, category: "CSS", text: "Mobile-first: начинай стили с мобильной версии" },
    { id: 25, category: "CSS", text: "Используй transition для плавных изменений" },
    { id: 26, category: "JavaScript", text: "Используй const по умолчанию, let только при необходимости" },
    { id: 27, category: "JavaScript", text: "Всегда обрабатывай ошибки в async/await через try/catch" },
    { id: 28, category: "Git", text: "Делай коммиты часто с понятными сообщениями" },
    { id: 29, category: "Общее", text: "Проверяй код в DevTools перед финальной версткой" },
    { id: 30, category: "Общее", text: "Практика важнее теории - делай проекты каждый день" },
    { id: 31, category: "Общее", text: "Прежде чем нажать кнопку 'Готов к тестированию' убедись что и правда готов" }
];

let shownTips = [];
let tipTimer = null;

/**
 * Получает случайный совет, который еще не был показан
 * @returns {Object|null} Объект с советом или null
 */
function getRandomTip() {
    if (shownTips.length === TIPS.length) {
        shownTips = [];
    }
    
    const availableTips = TIPS.filter(tip => !shownTips.includes(tip.id));
    if (availableTips.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * availableTips.length);
    const tip = availableTips[randomIndex];
    shownTips.push(tip.id);
    
    return tip;
}

/**
 * Проверяет, открыт ли попап с советом
 * @returns {boolean} true если попап открыт
 */
function isTipPopupOpen() {
    const popup = document.getElementById('tipPopup');
    return popup && popup.style.display === 'block';
}

/**
 * Показывает попап с советом
 * @param {Object} tip - Объект с советом
 */
function showTip(tip) {
    if (isTipPopupOpen()) {
        return;
    }
    
    const popup = document.getElementById('tipPopup');
    const category = document.getElementById('tipCategory');
    const text = document.getElementById('tipText');
    
    if (!popup || !category || !text) return;
    
    category.textContent = tip.category;
    text.textContent = tip.text;
    
    popup.style.display = 'block';
    popup.classList.remove('closing');
}

/**
 * Закрывает попап с советом
 */
function closeTip() {
    const popup = document.getElementById('tipPopup');
    if (!popup) return;
    
    popup.classList.add('closing');
    setTimeout(() => {
        popup.style.display = 'none';
        popup.classList.remove('closing');
        scheduleNextTip();
    }, 300);
}

/**
 * Планирует показ следующего совета
 */
function scheduleNextTip() {
    const minDelay = 25 * 1000;
    const maxDelay = 60 * 1000;
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    
    if (tipTimer) {
        clearTimeout(tipTimer);
    }
    
    tipTimer = setTimeout(() => {
        if (!isTipPopupOpen()) {
            const tip = getRandomTip();
            if (tip) {
                showTip(tip);
            }
        } else {
            scheduleNextTip();
        }
    }, delay);
}

/**
 * Инициализирует систему советов
 */
function initTips() {
    const closeButton = document.getElementById('tipClose');
    if (closeButton) {
        closeButton.addEventListener('click', closeTip);
    }
    
    scheduleNextTip();
}

/**
 * Инициализирует кнопку копирования ссылки с прогрессом
 */
function initShareControls() {
    const copyButton = document.getElementById('copyProgressLinkButton');

    if (!copyButton) {
        return;
    }

    copyButton.addEventListener('click', () => {
        copyProgressLink();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    addReadyCheckboxes();
    importProgressFromUrl();
    initCheckboxes();
    initShareControls();
    initSkillItemClicks();
    startLearningTimer();
    initReadyListToggle();
    initTips();
});
