// src/ui/WeaponRenderer.js
import { UIUtils } from '../utils/CommonUtils.js';

export class WeaponRenderer {
    static createCard(w, index, status) {
        const styles = UIUtils.getRarityStyles(w.rarity);
        
        const fileName = w.image ? w.image.split('/').pop() : '';
        const imgPath = fileName ? `assets/images/weapons/${w.rarity} star/${fileName}` : '';
        
        let cardStyle = 'bg-slate-800/40 border-transparent';
        let checkIcon = '';
        let label = '';

        if (status === 1) { 
            cardStyle = 'bg-orange-900/20 border-orange-500/50';
            checkIcon = '<div class="absolute inset-0 bg-orange-600/50 flex items-center justify-center z-20"><span class="text-4xl">🎯</span></div>';
            label = '<span class="text-[10px] md:text-sm font-bold text-orange-400 mr-2 md:mr-3 shrink-0">파밍 타겟</span>';
        } else if (status === 2) { 
            cardStyle = 'bg-emerald-900/10 border-emerald-500/30';
            checkIcon = '<div class="absolute inset-0 bg-black/50 flex items-center justify-center z-20"><span class="text-4xl">✅</span></div>';
            label = '<span class="text-[10px] md:text-sm font-bold text-emerald-400 mr-2 md:mr-3 shrink-0">기질 보유중</span>';
        }

        const effectsText = w.effects ? w.effects.trim() : '';

        return `
            <div id="weapon-${index}" class="group relative transition-all duration-200 ${cardStyle} border overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-[4px] md:w-[6px] ${styles.bar} z-10"></div>
                
                <div onclick="window.app.toggleAccordion(${index})" class="flex items-center gap-3 md:gap-5 px-3 py-3 md:px-6 md:py-5 cursor-pointer pl-6 md:pl-8 relative z-20"> 
                    <div class="no-select w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-900 border border-slate-700 relative overflow-hidden shrink-0" 
                         onmousedown="window.app.handlePressStart('${w.name}')" 
                         ontouchstart="window.app.handlePressStart('${w.name}')" 
                         onmouseup="window.app.handlePressEnd()" 
                         ontouchend="window.app.handlePressEnd()" 
                         onmouseleave="window.app.handlePressEnd()"
                         onclick="event.stopPropagation(); window.app.handleClick('${w.name}')"
                         oncontextmenu="return false;">
                        ${checkIcon}
                        <img src="${imgPath}" loading="lazy" class="w-full h-full object-contain p-1 md:p-1.5" onerror="this.style.display='none'">
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                            <span class="text-base md:text-xl font-black text-white truncate">${w.name}</span>
                            <span class="text-[10px] md:text-xs px-1.5 py-0.5 rounded font-bold ${styles.badge}">★${w.rarity}</span>
                        </div>
                        <div class="flex flex-wrap gap-1 md:gap-1.5">
                            ${w.tags.map(t => `<span class="text-[10px] md:text-xs bg-slate-700 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-slate-300 font-medium">${t}</span>`).join('')}
                        </div>
                    </div>
                    ${label}
                    <span class="arrow-icon text-slate-500 text-xs md:text-sm transition-transform duration-300">▼</span>
                </div>
                
                <div class="details-content bg-slate-900/50 px-4 md:px-6 border-t border-white/5 ml-[4px] md:ml-[6px]">
                    <div class="py-6 md:py-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        <div class="flex items-center justify-center bg-slate-800/50 rounded-2xl border border-slate-700 h-[180px] md:h-[220px] relative">
                            <img src="${imgPath}" loading="lazy" class="w-full h-full object-contain p-6 drop-shadow-2xl" alt="${w.name}" onerror="this.style.display='none'">
                            <div class="absolute inset-0 flex items-center justify-center -z-10"><span class="text-slate-600 text-sm">No Image</span></div>
                        </div>
                        <div class="md:col-span-2 flex flex-col gap-4 md:gap-5">
                            <div class="grid grid-cols-2 gap-4 md:gap-5">
                                <div class="bg-slate-800/30 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-700/50"><span class="text-xs md:text-sm text-slate-500 block mb-1 font-bold">Main</span><span class="text-xl md:text-3xl font-black text-blue-300 tracking-tight">${w.main_stat}</span></div>
                                <div class="bg-slate-800/30 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-700/50"><span class="text-xs md:text-sm text-slate-500 block mb-1 font-bold">Sub</span><span class="text-xl md:text-3xl font-black text-emerald-300 tracking-tight">${w.sub_stat}</span></div>
                            </div>
                            <div class="flex-1 bg-slate-800/50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-slate-700 text-sm md:text-lg text-slate-100 leading-relaxed whitespace-pre-line font-medium">${effectsText}</div>
                            <div class="text-xs text-slate-500 mt-2 font-bold">📍 획득처: ${w.location || '정보 없음'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}