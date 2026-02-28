/**
 * Ключ для сохранения прогресса в localStorage
 */
const STORAGE_KEY = 'artemStudyProgress';

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
 * Обновляет счетчик прогресса и прогресс-бар для конкретной категории
 * @param {string} category - Название категории
 */
function updateCategoryProgress(category) {
    const checkboxes = document.querySelectorAll(`input[data-category="${category}"]`);
    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
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
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const checked = Array.from(allCheckboxes).filter(cb => cb.checked).length;
    const total = allCheckboxes.length;
    const percentage = Math.round((checked / total) * 100);
    
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
        
        checkbox.addEventListener('change', function() {
            const progress = loadProgress();
            progress[this.id] = this.checked;
            saveProgress(progress);
            
            const category = this.dataset.category;
            updateCategoryProgress(category);
            updateTotalProgress();
        });
    });

    const categories = new Set(Array.from(checkboxes).map(cb => cb.dataset.category));
    categories.forEach(category => updateCategoryProgress(category));
    updateTotalProgress();
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
            updateReadyForTestIndicator();
        });
        
        mainCheckbox.addEventListener('change', function() {
            updateSkillItemState(item);
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

document.addEventListener('DOMContentLoaded', () => {
    addReadyCheckboxes();
    initCheckboxes();
    initSkillItemClicks();
    startLearningTimer();
    updateReadyForTestIndicator();
    initReadyListToggle();
});
