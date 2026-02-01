// --- 전역 변수 ---
const CATEGORIES = {
    stats: ["민첩 증가", "힘 증가", "의지 증가", "지능 증가", "주요 능력치 증가", "체력 증가", "방어력 증가"], 
    series: ["강공", "억제", "추격", "분쇄", "사기", "기예", "잔혹", "고통", "의료", "골절", "방출", "어둠", "흐름", "효율"]
};

let pressTimer = null;
let isLongPress = false;
let priorityWeapon = null; 
let recommendedLocations = []; 
let currentLocIndex = 0; 

// ---------------------------
// 1. 터치/클릭 핸들러
// ---------------------------

window.handlePressStart = function(name) {
    isLongPress = false;
    pressTimer = setTimeout(() => {
        isLongPress = true;
        toggleStatus(name, 'hold');
        if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
};

window.handlePressEnd = function() {
    if (pressTimer) clearTimeout(pressTimer);
};

window.handleClick = function(name) {
    if (isLongPress) return;
    toggleStatus(name, 'click');
};

// ---------------------------
// 2. 상태 관리 로직
// ---------------------------

function toggleStatus(name, actionType) {
    const statusMap = JSON.parse(localStorage.getItem('endfield_weapon_status_v2') || '{}');
    const current = statusMap[name] || 0;
    let next = 0;

    if (actionType === 'click') {
        if (current === 0) next = 1;
        else next = 0;
    } else if (actionType === 'hold') {
        next = 2;
    }

    if (next === 0) {
        delete statusMap[name];
        if (priorityWeapon === name) priorityWeapon = null;
    } else {
        statusMap[name] = next;
    }

    localStorage.setItem('endfield_weapon_status_v2', JSON.stringify(statusMap));
    
    if (typeof syncOwnedWeapons === 'function') syncOwnedWeapons();
    
    const modal = document.getElementById('manager-modal-backdrop');
    if (modal && !modal.classList.contains('hidden')) {
        const searchVal = document.getElementById('manager-search').value;
        renderManagerItems(searchVal);
        calculateFarmingPlan();
    }
    
    if (typeof updateUI === 'function') updateUI();
}

function resetAllStatus() {
    if(confirm('모든 보유 및 타겟 설정을 초기화하시겠습니까?')) {
        localStorage.setItem('endfield_weapon_status_v2', '{}');
        priorityWeapon = null;
        if (typeof syncOwnedWeapons === 'function') syncOwnedWeapons();
        renderManagerItems("");
        calculateFarmingPlan();
        if (typeof updateUI === 'function') updateUI();
    }
}

// 우선순위 설정
window.setPriority = function(name) {
    if (priorityWeapon === name) priorityWeapon = null;
    else priorityWeapon = name;
    renderDrawerContent();
};

// ---------------------------
// 3. 모달 & Drawer UI
// ---------------------------

function openManagerModal() {
    const modal = document.getElementById('manager-modal-backdrop');
    const content = document.getElementById('manager-modal-content');
    
    document.getElementById('manager-search').value = "";
    renderManagerItems("");
    calculateFarmingPlan(); 

    modal.classList.remove('hidden');
    setTimeout(() => { 
        content.classList.remove('scale-100', 'md:scale-95', 'opacity-0'); 
        content.classList.add('scale-100', 'opacity-100'); 
    }, 10);
}

function closeManagerModal() {
    const modal = document.getElementById('manager-modal-backdrop');
    const content = document.getElementById('manager-modal-content');
    const drawer = document.getElementById('farming-strategy-drawer');
    
    if (drawer.classList.contains('open')) toggleStrategyDrawer();

    content.classList.remove('scale-100', 'opacity-100'); 
    content.classList.add('scale-100', 'md:scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.add('hidden'); }, 200);
}

function toggleStrategyDrawer() {
    const drawer = document.getElementById('farming-strategy-drawer');
    drawer.classList.toggle('open');
}

function renderManagerItems(filterText) {
    const list6 = document.getElementById('manager-list-6');
    const list5 = document.getElementById('manager-list-5');
    const statusMap = JSON.parse(localStorage.getItem('endfield_weapon_status_v2') || '{}');
    
    const filtered = weapons.filter(w => 
        (w.rarity >= 5) && 
        (filterText === "" || w.name.includes(filterText))
    );

    const w6 = filtered.filter(w => w.rarity === 6).sort((a,b) => a.name.localeCompare(b.name));
    const w5 = filtered.filter(w => w.rarity === 5).sort((a,b) => a.name.localeCompare(b.name));

    const createCardHTML = (w) => {
        const status = statusMap[w.name] || 0;
        const imgPath = w.image ? w.image : `images/${w.name}.png`;
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
                onmousedown="handlePressStart('${w.name}')" 
                ontouchstart="handlePressStart('${w.name}')" 
                onmouseup="handlePressEnd()" 
                ontouchend="handlePressEnd()" 
                onmouseleave="handlePressEnd()"
                onclick="event.stopPropagation(); handleClick('${w.name}')"
                oncontextmenu="return false;"
                class="no-select group relative aspect-square rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center p-2 gap-1 active:scale-95 ${cardClass}">
                ${icon}
                <img src="${imgPath}" class="w-full h-3/5 object-contain mb-1" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTQxYjgyIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xNC41IDEwTDQgMjBNOi41IDEwTDIwIDRNMiAyMmwyMC0yIi8+PC9zdmc+'">
                <span class="text-xs md:text-sm leading-tight text-slate-300 w-full truncate font-bold text-center px-1">${w.name}</span>
            </button>
        `;
    };

    list6.innerHTML = w6.map(createCardHTML).join('');
    list5.innerHTML = w5.map(createCardHTML).join('');
}

// ---------------------------
// 4. 파밍 계획 계산 (Drawer & Summary)
// ---------------------------

function calculateFarmingPlan() {
    const statusMap = JSON.parse(localStorage.getItem('endfield_weapon_status_v2') || '{}');
    const targets = weapons.filter(w => (statusMap[w.name] === 1));
    const summaryBar = document.getElementById('farming-summary-bar');
    const drawer = document.getElementById('farming-strategy-drawer');
    
    document.getElementById('summary-count').innerText = targets.length;

    if (targets.length === 0) {
        if(summaryBar) summaryBar.classList.remove('show');
        if(drawer) drawer.classList.remove('open');
        recommendedLocations = [];
        return;
    }
    
    if(summaryBar) summaryBar.classList.add('show');

    // 지역별 점수 계산
    const locMap = {}; 
    targets.forEach(w => {
        if (!w.location || w.location === "정보 없음") return;
        const locs = w.location.split(',').map(s => s.trim());
        locs.forEach(loc => {
            if (!locMap[loc]) locMap[loc] = { name: loc, count: 0, items: [] };
            locMap[loc].count++;
            locMap[loc].items.push(w);
        });
    });

    recommendedLocations = Object.values(locMap).sort((a, b) => b.count - a.count);
    
    currentLocIndex = 0;
    renderDrawerContent();
}

function prevLocation() {
    if (recommendedLocations.length === 0) return;
    currentLocIndex = (currentLocIndex - 1 + recommendedLocations.length) % recommendedLocations.length;
    renderDrawerContent();
}

function nextLocation() {
    if (recommendedLocations.length === 0) return;
    currentLocIndex = (currentLocIndex + 1) % recommendedLocations.length;
    renderDrawerContent();
}

// [수정됨] 대분류 기준 컬러 버튼 스타일 적용
function renderDrawerContent() {
    if (recommendedLocations.length === 0) {
        document.getElementById('farm-loc-title').innerText = "장소 정보 없음";
        document.getElementById('farm-loc-desc').innerText = "-";
        return;
    }

    const data = recommendedLocations[currentLocIndex];
    const totalTargets = parseInt(document.getElementById('summary-count').innerText || '1');
    const included = data.items;

    document.getElementById('loc-nav-indicator').innerText = `${currentLocIndex + 1} / ${recommendedLocations.length}`;
    document.getElementById('farm-loc-title').innerHTML = data.name;
    document.getElementById('farm-loc-desc').innerHTML = 
        `<span class="text-emerald-400 font-bold">${data.count}개</span> 획득 가능 <span class="text-slate-500 text-xs">(${Math.round(data.count/totalTargets*100)}% 효율)</span>`;

    // 1. 주 스탯 추천 (대분류)
    const mainStatCount = {};
    included.forEach(w => {
        // Stats 카테고리
        let tag = w.tags.find(t => CATEGORIES.stats.includes(t));
        // 없으면 Attributes(나머지)에서 찾기
        if (!tag) tag = w.tags.find(t => !CATEGORIES.series.includes(t) && !CATEGORIES.stats.includes(t));
        
        if (tag) mainStatCount[tag] = (mainStatCount[tag] || 0) + 1;
    });
    const topMainStats = Object.keys(mainStatCount).sort((a, b) => mainStatCount[b] - mainStatCount[a]).slice(0, 3);

    // 2. 특수(시리즈) 추천
    const seriesCount = {};
    included.forEach(w => {
        const seriesTag = w.tags.find(t => CATEGORIES.series.includes(t));
        if (seriesTag) seriesCount[seriesTag] = (seriesCount[seriesTag] || 0) + 1;
    });

    const priorityItem = priorityWeapon ? included.find(w => w.name === priorityWeapon) : null;
    let bestSeries = "";
    
    if (priorityItem) {
        bestSeries = priorityItem.tags.find(t => CATEGORIES.series.includes(t)) || "";
    } else {
        bestSeries = Object.keys(seriesCount).sort((a, b) => seriesCount[b] - seriesCount[a])[0];
    }

    // [신규] 스타일 헬퍼 함수
    const getTagStyle = (tag) => {
        if (CATEGORIES.stats.includes(tag)) return "bg-blue-600 text-white border-blue-500 shadow-md"; // Stats (파랑)
        if (CATEGORIES.series.includes(tag)) return "bg-purple-600 text-white border-purple-500 shadow-md"; // Series (보라)
        return "bg-emerald-600 text-white border-emerald-500 shadow-md"; // Attributes (초록 - 그 외)
    };

    document.getElementById('farm-rec-main').innerHTML = topMainStats.length > 0 
        ? topMainStats.map(s => `<span class="${getTagStyle(s)} px-3 py-1.5 rounded-lg border text-xs font-bold transition-all whitespace-nowrap">${s}</span>`).join('') 
        : "-";
    document.getElementById('farm-rec-special').innerHTML = bestSeries 
        ? `<span class="${getTagStyle(bestSeries)} px-3 py-1.5 rounded-lg border text-xs font-bold transition-all whitespace-nowrap">${bestSeries}</span>` 
        : `<span class="text-slate-500">추천 없음</span>`;

    // 3. 하단 리스트
    const statusMap = JSON.parse(localStorage.getItem('endfield_weapon_status_v2') || '{}');
    const allTargets = weapons.filter(w => statusMap[w.name] === 1);
    
    const sortedList = [...allTargets].sort((a, b) => {
        const aIn = included.find(i => i.name === a.name);
        const bIn = included.find(i => i.name === b.name);
        if (aIn && !bIn) return -1;
        if (!aIn && bIn) return 1;
        return 0;
    });

    const listHTML = sortedList.map(w => {
        const isHere = included.find(i => i.name === w.name);
        const imgPath = w.image ? w.image : `images/${w.name}.png`;
        
        let borderClass = isHere 
            ? (priorityWeapon === w.name ? "priority-target border-2 border-amber-500" : "border-slate-600") 
            : "border-slate-800 opacity-40 grayscale";
        
        let crown = priorityWeapon === w.name ? '<div class="priority-crown">👑</div>' : '';
        
        let badge = "";
        if (isHere) {
            let score = 0;
            // 주옵션 매칭 확인 (Stats or Attrs)
            const wStatTag = w.tags.find(t => topMainStats.includes(t));
            if (wStatTag) score++;
            
            // 시리즈 매칭 확인
            const wSeries = w.tags.find(t => CATEGORIES.series.includes(t));
            if (wSeries === bestSeries) score++;

            let badgeClass = score === 2 ? "match-good" : (score === 1 ? "match-mid" : "match-bad");
            badge = `<div class="match-badge ${badgeClass}" style="bottom: 36px; right: -4px;">${score}/2</div>`;
        }

        return `
            <div class="relative flex-shrink-0 cursor-pointer transition-transform active:scale-95 flex flex-col items-center gap-1" onclick="setPriority('${w.name}')">
                ${crown}
                <div class="w-28 h-36 rounded-xl bg-slate-800 border ${borderClass} relative overflow-hidden flex flex-col shadow-lg">
                    <div class="flex-1 flex items-center justify-center p-2 bg-slate-900/50">
                        <img src="${imgPath}" class="w-full h-full object-contain">
                    </div>
                    <div class="h-10 flex items-center justify-center bg-slate-900/90 border-t border-white/5 px-1">
                        <span class="text-xs text-slate-200 font-bold leading-tight text-center w-full break-keep line-clamp-2">${w.name}</span>
                    </div>
                    ${badge}
                </div>
            </div>
        `;
    }).join('');

    let container = document.getElementById('drawer-target-list');
    if (!container) {
        container = document.createElement('div');
        container.id = 'drawer-target-list';
        document.querySelector('#farming-strategy-drawer .overflow-y-auto').appendChild(container);
    }
    
    container.className = "flex flex-nowrap gap-3 overflow-x-auto pb-8 mt-4 pt-4 border-t border-white/5 scrollbar-hide px-1";
    container.innerHTML = listHTML;
}