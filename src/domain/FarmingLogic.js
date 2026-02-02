// src/domain/FarmingLogic.js
import { APP_CONFIG } from '../constants/AppConfig.js';

export class FarmingLogic {
    /**
     * 필터 조건에 맞는 무기 리스트를 반환합니다.
     */
    static filterWeapons(weapons, activeTags, searchQuery) {
        return weapons.filter(w => {
            // 태그 필터 (AND 조건)
            if (activeTags.size > 0) {
                const hasAllTags = Array.from(activeTags).every(tag => w.tags.includes(tag));
                if (!hasAllTags) return false;
            }
            // 검색어 필터
            if (searchQuery && !w.name.includes(searchQuery)) return false;
            
            return true;
        }).sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
    }

    /**
     * 현재 타겟 무기들을 분석하여 최적의 파밍 장소와 옵션을 추천합니다.
     */
    static calculatePlan(targetWeapons, priorityWeaponName = null) {
        if (!targetWeapons || targetWeapons.length === 0) return null;

        // 1. 장소별 효율 계산
        const locMap = {}; 
        targetWeapons.forEach(w => {
            if (!w.location || w.location === "정보 없음") return;
            const locs = w.location.split(',').map(s => s.trim());
            locs.forEach(loc => {
                if (!locMap[loc]) locMap[loc] = { name: loc, count: 0, items: [] };
                locMap[loc].count++;
                locMap[loc].items.push(w);
            });
        });

        // 효율순 정렬
        const locations = Object.values(locMap).sort((a, b) => b.count - a.count);
        if (locations.length === 0) return null;

        // 2. 각 장소별 추천 옵션 계산 (결과 배열 생성)
        return locations.map(locData => {
            const included = locData.items;
            
            // 우선순위 무기 체크
            const priorityItem = priorityWeaponName 
                ? included.find(w => w.name === priorityWeaponName) 
                : null;

            // 주옵션 통계
            const mainStatCount = {};
            included.forEach(w => {
                // 대분류 태그 기준 카운팅
                let tag = w.tags.find(t => APP_CONFIG.CATEGORIES.STATS.includes(t));
                if (!tag) tag = w.tags.find(t => !APP_CONFIG.CATEGORIES.SERIES.includes(t) && !APP_CONFIG.CATEGORIES.STATS.includes(t));
                if (tag) mainStatCount[tag] = (mainStatCount[tag] || 0) + 1;
            });
            const topMainStats = Object.keys(mainStatCount)
                .sort((a, b) => mainStatCount[b] - mainStatCount[a])
                .slice(0, 3);

            // 특수(시리즈) 추천
            const seriesCount = {};
            included.forEach(w => {
                const sTag = w.tags.find(t => APP_CONFIG.CATEGORIES.SERIES.includes(t));
                if (sTag) seriesCount[sTag] = (seriesCount[sTag] || 0) + 1;
            });

            // 시리즈 결정 (우선순위 무기 있으면 그거 따라감)
            let bestSeries = "";
            if (priorityItem) {
                bestSeries = priorityItem.tags.find(t => APP_CONFIG.CATEGORIES.SERIES.includes(t)) || "";
            } else {
                bestSeries = Object.keys(seriesCount).sort((a, b) => seriesCount[b] - seriesCount[a])[0];
            }

            return {
                locationName: locData.name,
                count: locData.count,
                efficiency: Math.round((locData.count / targetWeapons.length) * 100),
                items: included,
                recommendStats: topMainStats,
                recommendSeries: bestSeries
            };
        });
    }

    /**
     * 특정 무기가 추천 플랜과 얼마나 일치하는지 점수를 매깁니다.
     */
    static getMatchScore(weapon, plan) {
        let score = 0;
        // 주옵션 매칭
        const wStatTag = weapon.tags.find(t => plan.recommendStats.includes(t));
        if (wStatTag) score++;
        
        // 시리즈 매칭
        const wSeries = weapon.tags.find(t => APP_CONFIG.CATEGORIES.SERIES.includes(t));
        if (wSeries === plan.recommendSeries) score++;

        return score; // 0, 1, 2
    }
}