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
        const locationText = w.location || '정보 없음';

        return `
            <div id="weapon-${index}" class="group relative transition-all duration-200 ${cardStyle} border overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-[4px] md:w-[6px] ${styles.bar} z-10"></div>
                
                <div onclick="window.app.toggleAccordion(${index})" class="flex items-center gap-3 md:gap-5 px-3 py-3 md:px-6 md:py-5 cursor-pointer pl-6 md:pl-8 relative z-20"> 
                    
                    <div class="no-select w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-900 border border-slate-700 relative overflow-hidden shrink-0" 
                         onclick="event.stopPropagation(); window.app.handleClick('${w.name}')">
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

                <div class="details-content bg-slate-900/50 border-t border-white/5 ml-[4px] md:ml-[6px]">
                    <div class="p-4 md:p-5 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 md:gap-0">
                        
                        <div class="flex items-center justify-center bg-slate-950/50 rounded-2xl md:rounded-r-none border border-slate-700/50 relative overflow-hidden p-2 min-h-[160px] md:min-h-full">
                            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 to-transparent opacity-50"></div>
                            <img src="${imgPath}" loading="lazy" class="w-full h-full object-contain drop-shadow-2xl relative z-10 scale-110" alt="${w.name}" onerror="this.style.display='none'">
                            <div class="absolute inset-0 flex items-center justify-center -z-10"><span class="text-slate-700 text-sm font-bold">No Image</span></div>
                        </div>

                        <div class="flex flex-col bg-slate-800/30 border border-slate-700/50 rounded-2xl md:rounded-l-none md:border-l-0 overflow-hidden">
                            
                            <div class="grid grid-cols-2 divide-x divide-slate-700/50 bg-slate-800/50 border-b border-slate-700/50">
                                <div class="p-3 flex flex-col items-center justify-center gap-0.5">
                                    <span class="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Main Stat</span>
                                    <span class="text-sm font-black text-white leading-none">${w.main_stat}</span>
                                </div>
                                <div class="p-3 flex flex-col items-center justify-center gap-0.5">
                                    <span class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Sub Stat</span>
                                    <span class="text-sm font-black text-white leading-none">${w.sub_stat}</span>
                                </div>
                            </div>

                            <div class="flex-1 p-4 flex flex-col justify-center gap-2">
                                <span class="text-[10px] text-slate-500 font-bold block tracking-wider">WEAPON EFFECT</span>
                                <p class="text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                                    ${effectsText || '<span class="text-slate-500 italic">효과 정보가 없습니다.</span>'}
                                </p>
                            </div>

                            <div class="bg-slate-950/30 border-t border-slate-700/30 px-3 py-2 flex items-center gap-2">
                                <span class="text-[10px] font-bold text-amber-500 shrink-0">기질 나오는 곳</span>
                                <span class="text-[11px] text-slate-400 font-medium truncate leading-none pt-0.5">
                                    ${locationText}
                                </span>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}