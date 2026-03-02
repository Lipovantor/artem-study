/**
 * Кастомная аналитика без внешних API
 * Отслеживает посещения, онлайн пользователей и уникальных посетителей
 */

class CustomAnalytics {
    constructor() {
        this.STORAGE_KEY = 'artemStudyAnalytics';
        this.SESSION_KEY = 'artemStudySession';
        this.channel = new BroadcastChannel('artem_study_online');
        this.sessionId = this.generateSessionId();
        this.fingerprint = this.generateFingerprint();
        this.onlineUsers = new Set();
        this.heartbeatInterval = null;
        
        this.init();
    }

    /**
     * Генерирует уникальный ID сессии
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Генерирует fingerprint браузера для определения уникальности
     */
    generateFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('fingerprint', 2, 2);
        
        const fingerprint = {
            canvas: canvas.toDataURL(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cores: navigator.hardwareConcurrency || 'unknown'
        };
        
        const fingerprintString = JSON.stringify(fingerprint);
        let hash = 0;
        for (let i = 0; i < fingerprintString.length; i++) {
            const char = fingerprintString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return `fp_${Math.abs(hash).toString(36)}`;
    }

    /**
     * Загружает данные аналитики из localStorage
     */
    loadData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
        return {
            totalVisits: 0,
            uniqueVisitors: [],
            sessions: [],
            firstVisit: new Date().toISOString()
        };
    }

    /**
     * Сохраняет данные аналитики в localStorage
     */
    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * Регистрирует новое посещение
     */
    registerVisit() {
        const data = this.loadData();
        
        data.totalVisits++;
        
        if (!data.uniqueVisitors.includes(this.fingerprint)) {
            data.uniqueVisitors.push(this.fingerprint);
        }
        
        data.sessions.push({
            sessionId: this.sessionId,
            fingerprint: this.fingerprint,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        
        if (data.sessions.length > 100) {
            data.sessions = data.sessions.slice(-100);
        }
        
        this.saveData(data);
        this.updateFooter(data);
    }

    /**
     * Обновляет футер с количеством посещений
     */
    updateFooter(data) {
        const footer = document.querySelector('.footer');
        if (!footer) return;
        
        let statsDiv = footer.querySelector('.analytics-stats');
        if (!statsDiv) {
            statsDiv = document.createElement('div');
            statsDiv.className = 'analytics-stats';
            footer.appendChild(statsDiv);
        }
        
        statsDiv.innerHTML = `
            <div class="analytics-counter">
                <span class="analytics-icon">👥</span>
                <span class="analytics-text">Всего посещений: <strong>${data.totalVisits}</strong></span>
                <span class="analytics-separator">•</span>
                <span class="analytics-text">Уникальных: <strong>${data.uniqueVisitors.length}</strong></span>
            </div>
        `;
    }

    /**
     * Инициализирует отслеживание онлайн пользователей
     */
    initOnlineTracking() {
        this.channel.postMessage({
            type: 'join',
            sessionId: this.sessionId,
            fingerprint: this.fingerprint,
            timestamp: Date.now()
        });
        
        this.onlineUsers.add(this.sessionId);
        
        this.channel.onmessage = (event) => {
            const { type, sessionId, fingerprint } = event.data;
            
            if (type === 'join' || type === 'heartbeat') {
                this.onlineUsers.add(sessionId);
                this.logOnlineStats();
            } else if (type === 'leave') {
                this.onlineUsers.delete(sessionId);
                this.logOnlineStats();
            }
        };
        
        this.heartbeatInterval = setInterval(() => {
            this.channel.postMessage({
                type: 'heartbeat',
                sessionId: this.sessionId,
                fingerprint: this.fingerprint,
                timestamp: Date.now()
            });
            
            this.cleanupStaleUsers();
        }, 5000);
        
        window.addEventListener('beforeunload', () => {
            this.channel.postMessage({
                type: 'leave',
                sessionId: this.sessionId
            });
            clearInterval(this.heartbeatInterval);
        });
    }

    /**
     * Очищает неактивных пользователей
     */
    cleanupStaleUsers() {
        const now = Date.now();
        const timeout = 10000;
        
        this.onlineUsers.forEach(sessionId => {
            if (sessionId !== this.sessionId) {
                this.onlineUsers.delete(sessionId);
            }
        });
    }

    /**
     * Выводит статистику онлайн пользователей в консоль
     */
    logOnlineStats() {
        const data = this.loadData();
        const uniqueFingerprints = new Set();
        
        this.onlineUsers.forEach(sessionId => {
            const session = data.sessions.find(s => s.sessionId === sessionId);
            if (session) {
                uniqueFingerprints.add(session.fingerprint);
            }
        });
        
        console.clear();
        console.log('%c📊 Статистика сайта Artem Study', 'color: #2563eb; font-size: 16px; font-weight: bold;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #7c3aed;');
        console.log('%c🌐 Онлайн сейчас:', 'color: #10b981; font-weight: bold;');
        console.log(`   Открытых вкладок: ${this.onlineUsers.size}`);
        console.log(`   Уникальных устройств: ${uniqueFingerprints.size}`);
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #7c3aed;');
        console.log('%c📈 Общая статистика:', 'color: #f59e0b; font-weight: bold;');
        console.log(`   Всего посещений: ${data.totalVisits}`);
        console.log(`   Уникальных посетителей: ${data.uniqueVisitors.length}`);
        console.log(`   Первое посещение: ${new Date(data.firstVisit).toLocaleString('ru-RU')}`);
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #7c3aed;');
        console.log('%c🔍 Детали:', 'color: #8b5cf6; font-weight: bold;');
        console.log(`   Ваш fingerprint: ${this.fingerprint}`);
        console.log(`   ID сессии: ${this.sessionId}`);
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #7c3aed;');
        
        if (data.sessions.length > 0) {
            console.log('%c📝 Последние 5 посещений:', 'color: #06b6d4; font-weight: bold;');
            const recentSessions = data.sessions.slice(-5).reverse();
            recentSessions.forEach((session, index) => {
                const date = new Date(session.timestamp);
                const isUnique = session.fingerprint === this.fingerprint ? '(вы)' : '';
                console.log(`   ${index + 1}. ${date.toLocaleString('ru-RU')} ${isUnique}`);
            });
        }
        
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #7c3aed;');
        console.log('%c💡 Совет: Открой несколько вкладок, чтобы увидеть изменения в реальном времени!', 'color: #64748b; font-style: italic;');
    }

    /**
     * Инициализирует аналитику
     */
    init() {
        this.registerVisit();
        this.initOnlineTracking();
        this.logOnlineStats();
        
        setInterval(() => {
            this.logOnlineStats();
        }, 3000);
    }
}

if (typeof window !== 'undefined') {
    window.customAnalytics = new CustomAnalytics();
}
