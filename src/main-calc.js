// src/main-calc.js
import { APP_CONFIG } from './constants/AppConfig.js';
import { StorageUtils } from './utils/StorageUtils.js';
import { DataService } from './services/DataService.js';
import { UIUtils } from './utils/CommonUtils.js';
import { FarmingLogic } from './domain/FarmingLogic.js';
import { WeaponRenderer } from './ui/WeaponRenderer.js';
import { FarmingRenderer } from './ui/FarmingRenderer.js';

class CalcApp {
    constructor() {
        this.weapons = [];
        this.activeTags = new Set();
        this.searchQuery = "";
        this.targetRarity = 6;
        
        this.statusMap = StorageUtils.load(APP_CONFIG.STORAGE_KEYS.WEAPON_STATUS, {});
        
        this.currentPlanIndex = 0;
        this.farmingPlans = [];
        this.priorityWeapon = null;

        this.pressTimer = null;
        this.isLongPress = false;

        this.init();
    }

    async init() {
        this.weapons = await DataService.loadWeapons();
        this.renderTags();
        this.updateUI();
    }

    // --- Main UI Logic ---

    renderTags() {
        const containers = { 
            stats: document.getElementById('tags-stats'), 
            attrs: document.getElementById('tags-attrs'), 
            series: document.getElementById('tags-series') 
        };
        
        Object.values(containers).forEach(el => { if(el) el.innerHTML = ''; });

        const allTags = [...new Set(this.weapons.flatMap(w => w.tags || []))].sort();

        allTags.forEach(tag => {
            let category = 'attrs';
            let activeClass = 'bg-emerald-600 text-white border-emerald-500 shadow-md';
            
            if (APP_CONFIG.CATEGORIES.STATS.includes(tag)) { 
                category = 'stats'; activeClass = 'bg-blue-600 text-white border-blue-500 shadow-md'; 
            } else if (APP_CONFIG.CATEGORIES.SERIES.includes(tag)) { 
                category = 'series'; activeClass = 'bg-purple-600 text-white border-purple-500 shadow-md'; 
            }
            
            const btn = document.createElement('button');
            const isActive = this.activeTags.has(tag);
            btn.className = `px-3 py-2 md:px-4 md:py-3 rounded-xl border text-xs md:text-base font-bold transition-all active:scale-95 ${isActive ? activeClass : "bg-slate-800 text-slate-400 border-slate-700"}`;
            btn.textContent = tag;
            btn.onclick = () => this.toggleTag(tag);
            
            if (containers[category]) containers[category].appendChild(btn);
        });
    }

    updateUI() {
        const listEl = document.getElementById('weapon-list');
        const countEl = document.getElementById('result-count');
        
        const decisionList = this.weapons.filter(w => 
            this.activeTags.size === 0 || Array.from(this.activeTags).every(t => w.tags.includes(t))
        ).sort((a, b) => b.rarity - a.rarity);

        const displayList = decisionList.filter(w => 
            this.searchQuery === "" || w.name.includes(this.searchQuery)
        );

        if(countEl) countEl.innerText = displayList.length;
        
        this.updateDecisionBox(decisionList);

        if (displayList.length === 0) {
            listEl.innerHTML = `<div class="p-12 text-center text-slate-500 text-lg font-medium">결과 없음</div>`;
        } else {
            listEl.innerHTML = displayList.map((w, index) => 
                WeaponRenderer.createCard(w, index, this.statusMap[w.name] || 0)
            ).join('');
        }
    }

    updateDecisionBox(filteredWeapons) {
        const box = document.getElementById('decision-box');
        if (!box) return;

        if (this.activeTags.size === 0 && this.searchQuery === "") {
            this.renderBoxContent(box, '이거 갈아도 됨?', '필터에서 옵션을 선택해주세요', 'bg-slate-800/90 border-dashed border-slate-600');
            return;
        }

        if (filteredWeapons.length === 0) {
            this.renderBoxContent(box, '갈아', '필요없음', 'bg-slate-700');
            return;
        }

        const candidates = filteredWeapons.filter(w => (this.statusMap[w.name] || 0) !== 2);
        
        if (candidates.length === 0) {
            this.renderBoxContent(box, '갈아', '필요없음 (모두 보유중)', 'bg-slate-700');
            return;
        }

        const validCandidates = candidates.filter(w => w.rarity >= this.targetRarity);

        if (this.activeTags.size === 3) {
            if (validCandidates.length > 0) {
                const bgClass = this.targetRarity === 6 ? 'bg-red-600 animate-pulse border-red-400' : 'bg-yellow-600 border-yellow-400';
                this.renderBoxContent(box, '갈지마', '킵하고 잠금ㄱ', bgClass);
            } else {
                this.renderBoxContent(box, '갈아', '필요없음', 'bg-slate-700');
            }
            return;
        }

        if (validCandidates.length > 0) {
            this.renderBoxContent(box, '옵션 더 선택', '아직 판단 못함', 'bg-blue-600');
        } else {
            this.renderBoxContent(box, '갈아', '필요없음', 'bg-slate-700');
        }
    }

    renderBoxContent(el, title, desc, bgClass) {
        el.innerHTML = `<div class="${bgClass} rounded-2xl md:rounded-3xl h-32 md:h-52 flex flex-col justify-center items-center p-3 md:p-4 text-center shadow-2xl border-2 border-white/20 animate-pop relative overflow-hidden transition-colors duration-300"><div class="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div><h2 class="text-4xl md:text-6xl font-black text-white drop-shadow-lg relative z-10 leading-tight">${title}</h2>${desc ? `<p class="text-sm md:text-xl font-bold text-white/80 relative z-10 mt-1 md:mt-2">${desc}</p>` : ''}</div>`;
    }

    // --- Actions ---

    toggleTag(tag) {
        if (this.activeTags.has(tag)) this.activeTags.delete(tag);
        else this.activeTags.add(tag);
        this.renderTags();
        this.updateUI();
    }

    handleSearch(val) {
        this.searchQuery = val.trim();
        this.updateUI();
    }

    resetFilters() {
        this.activeTags.clear();
        this.searchQuery = "";
        document.getElementById('search-input').value = "";
        this.renderTags();
        this.updateUI();
    }

    setTargetRarity(rarity) {
        this.targetRarity = rarity;
        const btn5 = document.getElementById('btn-rarity-5');
        const btn6 = document.getElementById('btn-rarity-6');
        if (rarity === 5) {
            btn5.className = "px-2.5 py-1 md:px-3 rounded-md text-xs font-bold transition-all bg-yellow-500 text-white shadow-md";
            btn6.className = "px-2.5 py-1 md:px-3 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white";
        } else {
            btn5.className = "px-2.5 py-1 md:px-3 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white";
            btn6.className = "px-2.5 py-1 md:px-3 rounded-md text-xs font-bold transition-all bg-orange-600 text-white shadow-md";
        }
        this.updateUI();
    }

    toggleAccordion(index) {
        document.getElementById(`weapon-${index}`).classList.toggle('details-open');
    }

    // --- Interaction (Main List) ---

    //홀드로 보유처리
    // handlePressStart(name) {
    //     this.isLongPress = false;
    //     this.pressTimer = setTimeout(() => {
    //         this.isLongPress = true;
    //         this.changeStatus(name, 'hold');
    //         if (navigator.vibrate) navigator.vibrate(50);
    //     }, 600);
    // }

    // handlePressEnd() {
    //     if (this.pressTimer) clearTimeout(this.pressTimer);
    // }

    // [수정] 메인 리스트 클릭 핸들러 (순환 방식 적용)
    handleClick(name) {
        const current = this.statusMap[name] || 0;
        let next = (current + 1) % 3; // 0->1->2->0 순환

        if (next === 0) {
            delete this.statusMap[name];
            if (this.priorityWeapon === name) this.priorityWeapon = null;
        } else {
            this.statusMap[name] = next;
        }

        StorageUtils.save(APP_CONFIG.STORAGE_KEYS.WEAPON_STATUS, this.statusMap);
        this.updateUI();
        
        // 관리창(Modal)이 열려있다면 함께 갱신 (동기화)
        const modal = document.getElementById('manager-modal-backdrop');
        if (modal && !modal.classList.contains('hidden')) {
            const searchVal = document.getElementById('manager-search').value;
            FarmingRenderer.renderModalList(
                this.weapons.filter(w => w.name.includes(searchVal)), 
                this.statusMap
            );
            this.updateFarmingPlan();
        }
    }

    // [추가] 관리창(Modal) 전용 클릭 핸들러 (순환 방식)
    handleManagerClick(name) {
        const current = this.statusMap[name] || 0;
        let next = (current + 1) % 3; // 0->1->2->0 순환

        if (next === 0) {
            delete this.statusMap[name];
            if (this.priorityWeapon === name) this.priorityWeapon = null;
        } else {
            this.statusMap[name] = next;
        }

        StorageUtils.save(APP_CONFIG.STORAGE_KEYS.WEAPON_STATUS, this.statusMap);
        this.updateUI();
        
        // 모달 리스트 즉시 갱신
        const searchVal = document.getElementById('manager-search').value;
        FarmingRenderer.renderModalList(
            this.weapons.filter(w => w.name.includes(searchVal)), 
            this.statusMap
        );
        this.updateFarmingPlan();
    }

    changeStatus(name, type) {
        const current = this.statusMap[name] || 0;
        let next = 0;

        if (type === 'click') {
            if (current === 0) next = 1; 
            else next = 0; 
        } else {
            next = 2; 
        }

        if (next === 0) {
            delete this.statusMap[name];
            if (this.priorityWeapon === name) this.priorityWeapon = null;
        } else {
            this.statusMap[name] = next;
        }

        StorageUtils.save(APP_CONFIG.STORAGE_KEYS.WEAPON_STATUS, this.statusMap);
        this.updateUI();
        
        // 메인 리스트에서도 모달 갱신 호출 (양방향 동기화)
        const modal = document.getElementById('manager-modal-backdrop');
        if (modal && !modal.classList.contains('hidden')) {
            const searchVal = document.getElementById('manager-search').value;
            FarmingRenderer.renderModalList(
                this.weapons.filter(w => w.name.includes(searchVal)), 
                this.statusMap
            );
            this.updateFarmingPlan();
        }
    }

    resetAllStatus() {
        if(!confirm('모든 보유 및 타겟 설정을 초기화하시겠습니까?')) return;
        this.statusMap = {};
        this.priorityWeapon = null;
        StorageUtils.save(APP_CONFIG.STORAGE_KEYS.WEAPON_STATUS, {});
        this.updateUI();
        this.openManagerModal(); 
    }

    // --- Modal & Farming Strategy ---

    openManagerModal() {
        const modal = document.getElementById('manager-modal-backdrop');
        const content = document.getElementById('manager-modal-content');
        
        document.getElementById('manager-search').value = "";
        FarmingRenderer.renderModalList(this.weapons, this.statusMap);
        this.updateFarmingPlan();

        modal.classList.remove('hidden');
        setTimeout(() => { 
            content.classList.remove('scale-100', 'md:scale-95', 'opacity-0'); 
            content.classList.add('scale-100', 'opacity-100'); 
        }, 10);
    }

    closeManagerModal() {
        const modal = document.getElementById('manager-modal-backdrop');
        const content = document.getElementById('manager-modal-content');
        const drawer = document.getElementById('farming-strategy-drawer');
        
        if (drawer.classList.contains('open')) this.toggleStrategyDrawer();

        content.classList.remove('scale-100', 'opacity-100'); 
        content.classList.add('scale-100', 'md:scale-95', 'opacity-0');
        setTimeout(() => { modal.classList.add('hidden'); }, 200);
    }

    handleModalSearch(val) {
        FarmingRenderer.renderModalList(
            this.weapons.filter(w => w.name.includes(val)), 
            this.statusMap
        );
    }

    toggleStrategyDrawer() {
        document.getElementById('farming-strategy-drawer').classList.toggle('open');
    }

    updateFarmingPlan() {
        const candidates = this.weapons.filter(w => {
            const status = this.statusMap[w.name] || 0;
            return status !== 2 && (status === 1 || w.rarity === 6);
        }).map(w => ({
            ...w,
            weight: (this.statusMap[w.name] === 1) ? 5 : 1,
            isTarget: (this.statusMap[w.name] === 1)
        }));

        document.getElementById('summary-count').innerText = candidates.filter(w => w.isTarget).length;

        const summaryBar = document.getElementById('farming-summary-bar');
        const drawer = document.getElementById('farming-strategy-drawer');

        if (candidates.length === 0) {
            summaryBar.classList.remove('show');
            drawer.classList.remove('open');
            this.farmingPlans = [];
            return;
        }
        
        summaryBar.classList.add('show');

        this.farmingPlans = FarmingLogic.calculatePlan(candidates, this.priorityWeapon);
        this.currentPlanIndex = 0;
        this.renderDrawerContent();
    }

    renderDrawerContent() {
        if (!this.farmingPlans || this.farmingPlans.length === 0) {
            FarmingRenderer.renderDrawer(null);
            return;
        }
        const plan = this.farmingPlans[this.currentPlanIndex];
        FarmingRenderer.renderDrawer(plan, this.currentPlanIndex, this.farmingPlans.length, this.priorityWeapon);
    }

    prevLocation() {
        if (this.farmingPlans.length === 0) return;
        this.currentPlanIndex = (this.currentPlanIndex - 1 + this.farmingPlans.length) % this.farmingPlans.length;
        this.renderDrawerContent();
    }

    nextLocation() {
        if (this.farmingPlans.length === 0) return;
        this.currentPlanIndex = (this.currentPlanIndex + 1) % this.farmingPlans.length;
        this.renderDrawerContent();
    }

    setPriority(name) {
        if (this.priorityWeapon === name) this.priorityWeapon = null;
        else this.priorityWeapon = name;
        this.updateFarmingPlan(); 
    }
}

window.app = new CalcApp();