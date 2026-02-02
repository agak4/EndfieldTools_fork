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
        
        // 기질 보유 현황 로드 (0:미보유, 1:타겟, 2:졸업)
        this.statusMap = StorageUtils.load(APP_CONFIG.STORAGE_KEYS.WEAPON_STATUS, {});
        
        // 파밍 전략 Drawer 관련 상태
        this.currentPlanIndex = 0;
        this.farmingPlans = [];
        this.priorityWeapon = null;

        // Long Press Variables
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
        
        // 기존 태그 비우기
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
        // 필터링 (FarmingLogic 사용)
        // 주의: FarmingLogic.filterWeapons는 검색/태그 필터만 담당. 
        // 메인 화면 로직(갈갈 판단)을 위해 별도 필터링 수행
        
        const listEl = document.getElementById('weapon-list');
        const countEl = document.getElementById('result-count');
        
        // 1. 논리 필터 (갈갈 판단용)
        const decisionList = this.weapons.filter(w => 
            this.activeTags.size === 0 || Array.from(this.activeTags).every(t => w.tags.includes(t))
        ).sort((a, b) => b.rarity - a.rarity);

        // 2. 표시 필터 (검색어 적용)
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

        // 초기 상태
        if (this.activeTags.size === 0 && this.searchQuery === "") {
            this.renderBoxContent(box, '이거 갈아도 됨?', '필터에서 옵션을 선택해주세요', 'bg-slate-800/90 border-dashed border-slate-600');
            return;
        }

        if (filteredWeapons.length === 0) {
            this.renderBoxContent(box, '갈아', '필요없음', 'bg-slate-700');
            return;
        }

        // 보유 중인 무기 제외하고 판단 (졸업=2)
        const candidates = filteredWeapons.filter(w => (this.statusMap[w.name] || 0) !== 2);
        
        if (candidates.length === 0) {
            this.renderBoxContent(box, '갈아', '필요없음 (모두 보유중)', 'bg-slate-700');
            return;
        }

        const validCandidates = candidates.filter(w => w.rarity >= this.targetRarity);

        // 3개 선택 (확정)
        if (this.activeTags.size === 3) {
            if (validCandidates.length > 0) {
                const bgClass = this.targetRarity === 6 ? 'bg-red-600 animate-pulse border-red-400' : 'bg-yellow-600 border-yellow-400';
                this.renderBoxContent(box, '갈지마', '킵하고 잠금ㄱ', bgClass);
            } else {
                this.renderBoxContent(box, '갈아', '필요없음', 'bg-slate-700');
            }
            return;
        }

        // 1~2개 선택 (탐색)
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
        // 버튼 스타일 업데이트
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

    // --- Interaction (Click/Hold) ---

    handlePressStart(name) {
        this.isLongPress = false;
        this.pressTimer = setTimeout(() => {
            this.isLongPress = true;
            this.changeStatus(name, 'hold');
            if (navigator.vibrate) navigator.vibrate(50);
        }, 600);
    }

    handlePressEnd() {
        if (this.pressTimer) clearTimeout(this.pressTimer);
    }

    handleClick(name) {
        if (this.isLongPress) return;
        this.changeStatus(name, 'click');
    }

    changeStatus(name, type) {
        const current = this.statusMap[name] || 0;
        let next = 0;

        if (type === 'click') {
            if (current === 0) next = 1; // 타겟
            else next = 0; // 해제
        } else {
            next = 2; // 졸업
        }

        if (next === 0) {
            delete this.statusMap[name];
            if (this.priorityWeapon === name) this.priorityWeapon = null;
        } else {
            this.statusMap[name] = next;
        }

        StorageUtils.save(APP_CONFIG.STORAGE_KEYS.WEAPON_STATUS, this.statusMap);
        
        // UI 갱신 (메인 & 모달)
        this.updateUI();
        
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
        this.openManagerModal(); // 모달 리프레시
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
        // 1. 타겟 무기 추출
        const targets = this.weapons.filter(w => this.statusMap[w.name] === 1);
        document.getElementById('summary-count').innerText = targets.length;

        const summaryBar = document.getElementById('farming-summary-bar');
        const drawer = document.getElementById('farming-strategy-drawer');

        if (targets.length === 0) {
            summaryBar.classList.remove('show');
            drawer.classList.remove('open');
            this.farmingPlans = [];
            return;
        }
        
        summaryBar.classList.add('show');

        // 2. 파밍 로직 계산 (Domain Logic 호출)
        this.farmingPlans = FarmingLogic.calculatePlan(targets, this.priorityWeapon);
        
        // 3. 렌더링
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
        this.updateFarmingPlan(); // 재계산
    }
}

// 전역 인스턴스 생성
window.app = new CalcApp();