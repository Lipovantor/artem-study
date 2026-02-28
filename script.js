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
}

/**
 * Рассчитывает и отображает время обучения с 1 января 2026 года
 */
function updateLearningTime() {
    const startDate = new Date('2026-01-01');
    const currentDate = new Date();
    
    const diffTime = Math.abs(currentDate - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    
    const daysElement = document.getElementById('daysLearning');
    const weeksElement = document.getElementById('weeksLearning');
    const monthsElement = document.getElementById('monthsLearning');
    
    if (daysElement) daysElement.textContent = diffDays;
    if (weeksElement) weeksElement.textContent = diffWeeks;
    if (monthsElement) monthsElement.textContent = diffMonths;
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
 * Инициализирует клик по всей области skill-item для переключения чекбокса
 */
function initSkillItemClicks() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    skillItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') {
                return;
            }
            
            const checkbox = this.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initCheckboxes();
    initSkillItemClicks();
    updateLearningTime();
});
