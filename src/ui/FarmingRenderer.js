// src/ui/FarmingRenderer.js
import { APP_CONFIG } from '../constants/AppConfig.js';

export class FarmingRenderer {
    static renderModalList(weapons, statusMap) {
        const list6 = document.getElementById('manager-list-6');
        const list5 = document.getElementById('manager-list-5');
        
        const w6 = weapons.filter(w => w.rarity === 6).sort((a,b) => a.name.localeCompare(b.name));
        const w5 = weapons.filter(w => w.rarity === 5).sort((a,b) => a.name.localeCompare(b.name));

        const createHTML = (w) => this.createIconCard(w, statusMap[w.name] || 0);

        if(list6) list6.innerHTML = w6.map(createHTML).join('');
        if(list5) list5.innerHTML = w5.map(createHTML).join('');
    }

    static createIconCard(w, status) {
        const fileName = w.image ? w.image.split('/').pop() : '';
        const imgPath = fileName ? `assets/images/weapons/${w.rarity} star/${fileName}` : '';
        
        let cardClass = "border-slate-700 bg-slate-800/50 opacity-50 grayscale hover:opacity-80";
        let icon = "";
        
        if (status === 1) { 
            cardClass = "border-orange-500 bg-orange-900/30 ring-2 ring-orange-500/50 opacity-100";
            icon = '<div class="absolute top-1 right-1 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md z-10 font-bold">🎯</div>';
        } else if (status === 2) { 
            cardClass = "border-emerald-500 bg-emerald-900/30 ring-2 ring-emerald-500/50 opacity-100";
            icon = '<div class="absolute top-1 right-1 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md z-10 font-bold">✓</div>';
        }

        return `
            <button 
                onmousedown="window.app.handlePressStart('${w.name}')" 
                ontouchstart="window.app.handlePressStart('${w.name}')" 
                onmouseup="window.app.handlePressEnd()" 
                ontouchend="window.app.handlePressEnd()" 
                onmouseleave="window.app.handlePressEnd()"
                onclick="event.stopPropagation(); window.app.handleClick('${w.name}')"
                oncontextmenu="return false;"
                class="no-select group relative aspect-square rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center p-2 gap-1 active:scale-95 ${cardClass}">
                ${icon}
                <img src="${imgPath}" loading="lazy" class="w-full h-3/5 object-contain mb-1" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTQxYjgyIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xNC41IDEwTDQgMjBNOi41IDEwTDIwIDRNMiAyMmwyMC0yIi8+PC9zdmc+'">
                <span class="text-xs md:text-sm leading-tight text-slate-300 w-full truncate font-bold text-center px-1">${w.name}</span>
            </button>
        `;
    }

    static renderDrawer(plan, currentIndex, totalPlans, priorityWeapon) {
        // ... (이전 코드와 동일, 생략)
        if (!plan) {
            document.getElementById('farm-loc-title').innerText = "장소 정보 없음";
            document.getElementById('farm-loc-desc').innerText = "-";
            return;
        }

        document.getElementById('loc-nav-indicator').innerText = `${currentIndex + 1} / ${totalPlans}`;
        document.getElementById('farm-loc-title').innerHTML = plan.locationName;
        document.getElementById('farm-loc-desc').innerHTML = 
            `<span class="text-emerald-400 font-bold">${plan.count}개</span> 획득 가능 <span class="text-slate-500 text-xs">(${plan.efficiency}% 효율)</span>`;

        const getTagStyle = (tag) => {
            if (APP_CONFIG.CATEGORIES.STATS.includes(tag)) return "bg-blue-600 text-white border-blue-500 shadow-md";
            if (APP_CONFIG.CATEGORIES.SERIES.includes(tag)) return "bg-purple-600 text-white border-purple-500 shadow-md";
            return "bg-emerald-600 text-white border-emerald-500 shadow-md";
        };

        document.getElementById('farm-rec-main').innerHTML = plan.recommendStats.length > 0 
            ? plan.recommendStats.map(s => `<span class="${getTagStyle(s)} px-3 py-1.5 rounded-lg border text-xs font-bold transition-all whitespace-nowrap">${s}</span>`).join('') 
            : "-";
        
        const bestSeries = plan.recommendSeries;
        document.getElementById('farm-rec-special').innerHTML = bestSeries 
            ? `<span class="${getTagStyle(bestSeries)} px-3 py-1.5 rounded-lg border text-xs font-bold transition-all whitespace-nowrap">${bestSeries}</span>` 
            : `<span class="text-slate-500">추천 없음</span>`;

        this.renderDrawerList(plan, priorityWeapon);
    }

    static renderDrawerList(plan, priorityWeapon) {
        const container = document.getElementById('drawer-target-list');
        
        const sortedItems = [...plan.items].sort((a, b) => {
            if (a.name === priorityWeapon) return -1;
            if (b.name === priorityWeapon) return 1;
            return a.name.localeCompare(b.name);
        });

        const html = sortedItems.map(w => {
            const fileName = w.image ? w.image.split('/').pop() : '';
            const imgPath = fileName ? `assets/images/weapons/${w.rarity} star/${fileName}` : '';

            const isPriority = priorityWeapon === w.name;
            const borderClass = isPriority ? "priority-target border-2 border-amber-500" : "border-slate-600";
            const crown = isPriority ? '<div class="priority-crown">👑</div>' : '';
            
            return `
                <div class="relative flex-shrink-0 cursor-pointer transition-transform active:scale-95 flex flex-col items-center gap-1" onclick="window.app.setPriority('${w.name}')">
                    ${crown}
                    <div class="w-28 h-36 rounded-xl bg-slate-800 border ${borderClass} relative overflow-hidden flex flex-col shadow-lg">
                        <div class="flex-1 flex items-center justify-center p-2 bg-slate-900/50">
                            <img src="${imgPath}" loading="lazy" class="w-full h-full object-contain">
                        </div>
                        <div class="h-10 flex items-center justify-center bg-slate-900/90 border-t border-white/5 px-1">
                            <span class="text-xs text-slate-200 font-bold leading-tight text-center w-full break-keep line-clamp-2">${w.name}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
        container.className = "flex flex-nowrap gap-3 overflow-x-auto pb-8 mt-4 pt-4 border-t border-white/5 scrollbar-hide px-1";
    }
}