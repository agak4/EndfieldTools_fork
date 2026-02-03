// src/domain/FarmingLogic.js
import { APP_CONFIG } from '../constants/AppConfig.js';

export class FarmingLogic {
    static filterWeapons(weapons, activeTags, searchQuery) {
        return weapons.filter(w => {
            if (activeTags.size > 0) {
                const hasAllTags = Array.from(activeTags).every(tag => w.tags.includes(tag));
                if (!hasAllTags) return false;
            }
            if (searchQuery && !w.name.includes(searchQuery)) return false;
            return true;
        }).sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
    }

    static calculatePlan(targetWeapons, priorityWeaponName = null) {
        if (!targetWeapons || targetWeapons.length === 0) return null;

        // 전체 타겟(내가 찜한 것)의 총 개수 계산 (타겟 효율 % 계산용)
        const totalTargetCount = targetWeapons.filter(w => w.isTarget).length;
        const totalWeight = targetWeapons.reduce((sum, w) => sum + (w.weight || 1), 0);

        // 1. 장소별 데이터 집계
        const locMap = {}; 
        targetWeapons.forEach(w => {
            if (!w.location || w.location === "정보 없음") return;
            const locs = w.location.split(',').map(s => s.trim());
            const weight = w.weight || 1;
            const isTarget = w.isTarget; // main-calc.js에서 넘어온 속성

            locs.forEach(loc => {
                if (!locMap[loc]) {
                    locMap[loc] = { 
                        name: loc, 
                        score: 0, 
                        items: [],
                        targetCount: 0, // 타겟 개수
                        normalCount: 0  // 일반 6성 개수
                    };
                }
                locMap[loc].score += weight;
                locMap[loc].items.push(w);
                
                // 개수 분리 카운팅
                if (isTarget) locMap[loc].targetCount++;
                else locMap[loc].normalCount++;
            });
        });

        // 점수(가중치)순 정렬
        const locations = Object.values(locMap).sort((a, b) => b.score - a.score);
        if (locations.length === 0) return null;

        // 2. 결과 객체 생성
        return locations.map(locData => {
            const included = locData.items;
            
            const priorityItem = priorityWeaponName 
                ? included.find(w => w.name === priorityWeaponName) 
                : null;

            // 주옵션 통계
            const mainStatScore = {};
            included.forEach(w => {
                const weight = w.weight || 1;
                let tag = w.tags.find(t => APP_CONFIG.CATEGORIES.STATS.includes(t));
                if (!tag) tag = w.tags.find(t => !APP_CONFIG.CATEGORIES.SERIES.includes(t) && !APP_CONFIG.CATEGORIES.STATS.includes(t));
                if (tag) mainStatScore[tag] = (mainStatScore[tag] || 0) + weight;
            });
            const topMainStats = Object.keys(mainStatScore)
                .sort((a, b) => mainStatScore[b] - mainStatScore[a])
                .slice(0, 3);

            // 특수(시리즈) 추천
            const seriesScore = {};
            included.forEach(w => {
                const weight = w.weight || 1;
                const sTag = w.tags.find(t => APP_CONFIG.CATEGORIES.SERIES.includes(t));
                if (sTag) seriesScore[sTag] = (seriesScore[sTag] || 0) + weight;
            });

            let bestSeries = "";
            if (priorityItem) {
                bestSeries = priorityItem.tags.find(t => APP_CONFIG.CATEGORIES.SERIES.includes(t)) || "";
            } else {
                bestSeries = Object.keys(seriesScore).sort((a, b) => seriesScore[b] - seriesScore[a])[0];
            }

            // 타겟 효율 (전체 타겟 중 이 장소에서 몇 %나 해결 가능한지)
            const targetEff = totalTargetCount > 0 
                ? Math.round((locData.targetCount / totalTargetCount) * 100) 
                : 0;

            return {
                locationName: locData.name,
                count: included.length, // 전체 개수
                
                // [추가된 데이터]
                targetCount: locData.targetCount,
                normalCount: locData.normalCount,
                targetEfficiency: targetEff,
                
                items: included,
                recommendStats: topMainStats,
                recommendSeries: bestSeries
            };
        });
    }

    static getMatchScore(weapon, plan) {
        let score = 0;
        const wStatTag = weapon.tags.find(t => plan.recommendStats.includes(t));
        if (wStatTag) score++;
        const wSeries = weapon.tags.find(t => APP_CONFIG.CATEGORIES.SERIES.includes(t));
        if (wSeries === plan.recommendSeries) score++;
        return score; 
    }
}