// src/utils/CommonUtils.js
import { APP_CONFIG } from '../constants/AppConfig.js';

export class DateUtils {
    /**
     * 현재 게임 내 날짜(새벽 5시 기준)를 반환합니다.
     * @param {Date} date - 기준 날짜 (기본값: 현재)
     * @returns {string} 'YYYY-MM-DD' 형식의 문자열
     */
    static getGameDateString(date = new Date()) {
        const adjustedDate = new Date(date);
        // 현재 시간이 리셋 시간(5시)보다 이전이면, "어제"로 취급
        if (adjustedDate.getHours() < APP_CONFIG.RESET_HOUR) {
            adjustedDate.setDate(adjustedDate.getDate() - 1);
        }
        return adjustedDate.toDateString(); // "Mon Feb 02 2026" 형식 (비교용)
    }

    /**
     * 화면 표시용 날짜 포맷 (예: 2월 2일 월요일)
     */
    static getDisplayDate(date = new Date()) {
        const adjustedDate = new Date(date);
        if (adjustedDate.getHours() < APP_CONFIG.RESET_HOUR) {
            adjustedDate.setDate(adjustedDate.getDate() - 1);
        }
        return adjustedDate.toLocaleDateString('ko-KR', { 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
        });
    }
}

export class UIUtils {
    /**
     * 등급(Rarity)에 따른 스타일 클래스를 반환합니다. (기질 계산기용)
     * @param {number} rarity 
     */
    static getRarityStyles(rarity) {
        const r = parseInt(rarity) || 0;
        if (r === 6) return { badge: 'bg-orange-600 text-white', bar: 'bg-orange-500 shadow-[0_0_12px_orange]', text: 'text-orange-400' };
        if (r === 5) return { badge: 'bg-yellow-600 text-white', bar: 'bg-yellow-400', text: 'text-yellow-400' };
        if (r === 4) return { badge: 'bg-purple-600 text-white', bar: 'bg-purple-400', text: 'text-purple-400' };
        return { badge: 'bg-slate-600 text-slate-200', bar: 'bg-slate-600', text: 'text-slate-400' };
    }
}