// --- 전역 변수 설정 ---
let weapons = [];
let allTags = [];
let activeTags = new Set();

// 상태 저장소 (farming.js와 공유)
let ownedWeapons = new Set(); 

let searchQuery = ""; 
let targetRarity = 6; 

// --- 데이터 로딩 ---

function injectMockLocations(data) {
    if (!Array.isArray(data)) return []; 
    const locations = ["침묵의 골짜기 01", "불타는 협곡 02", "얼어붙은 폐허 03", "오염된 숲 04"];
    return data.map((w) => {
        if (!w || !w.name) return w; 
        const locIndex = w.name.length % locations.length;
        return { ...w, location: locations[locIndex] };
    });
}

async function loadData() {
    try {
        const [weaponRes, locRes] = await Promise.all([
            fetch('data.json'),
            fetch('locations.json').catch(() => null)
        ]);

        if (!weaponRes.ok) throw new Error("파일 로드 실패");
        
        let rawData = await weaponRes.json();
        let locData = locRes ? await locRes.json() : null;

        if (locData) {
            const dropMap = {};
            locData.forEach(loc => {
                loc.drop_table.forEach(name => {
                    if (!dropMap[name]) dropMap[name] = [];
                    dropMap[name].push(loc.name);
                });
            });
            weapons = rawData.map(w => ({
                ...w,
                location: dropMap[w.name] ? dropMap[w.name].join(", ") : "정보 없음"
            }));
        } else {
            weapons = injectMockLocations(rawData);
        }

        allTags = [...new Set(weapons.flatMap(w => w.tags || []))].sort();
        
        syncOwnedWeapons();
        renderTags();
        updateUI(); 
    } catch (error) { 
        console.error("Error:", error);
        const listEl = document.getElementById('weapon-list');
        if(listEl) listEl.innerHTML = `<div class="p-10 text-center text-red-400">데이터 로딩 실패!<br><span class="text-xs text-slate-500">${error.message}</span></div>`;
    }
}

// --- 핵심 로직 ---

function syncOwnedWeapons() {
    const statusMap = JSON.parse(localStorage.getItem('endfield_weapon_status_v2') || '{}');
    ownedWeapons.clear();
    for (const [name, status] of Object.entries(statusMap)) {
        if (status === 2) ownedWeapons.add(name);
    }
}

function setTargetRarity(rarity) {
    targetRarity = rarity;
    const btn5 = document.getElementById('btn-rarity-5');
    const btn6 = document.getElementById('btn-rarity-6');
    if (rarity === 5) {
        btn5.className = "px-2.5 py-1 md:px-3 rounded-md text-xs font-bold transition-all bg-yellow-500 text-white shadow-md";
        btn6.className = "px-2.5 py-1 md:px-3 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white";
    } else {
        btn5.className = "px-2.5 py-1 md:px-3 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-white";
        btn6.className = "px-2.5 py-1 md:px-3 rounded-md text-xs font-bold transition-all bg-orange-600 text-white shadow-md";
    }
    updateUI();
}

function handleSearch(value) {
    searchQuery = value.trim();
    updateUI();
}

function resetFilters() { 
    activeTags.clear(); 
    searchQuery = ""; 
    document.getElementById('search-input').value = ""; 
    renderTags(); 
    updateUI(); 
}

function renderTags() {
    const containers = { stats: document.getElementById('tags-stats'), attrs: document.getElementById('tags-attrs'), series: document.getElementById('tags-series') };
    Object.values(containers).forEach(el => el.innerHTML = '');
    allTags.forEach(tag => {
        const CATEGORIES = {
            stats: ["민첩 증가", "힘 증가", "의지 증가", "지능 증가", "주요 능력치 증가", "체력 증가", "방어력 증가"],
            series: ["강공", "억제", "추격", "분쇄", "사기", "기예", "잔혹", "고통", "의료", "골절", "방출", "어둠", "흐름", "효율"]
        };
        let category = 'attrs';
        let activeClass = 'bg-emerald-600 text-white border-emerald-500 shadow-md';
        if (CATEGORIES.stats.includes(tag)) { category = 'stats'; activeClass = 'bg-blue-600 text-white border-blue-500 shadow-md'; }
        else if (CATEGORIES.series.includes(tag)) { category = 'series'; activeClass = 'bg-purple-600 text-white border-purple-500 shadow-md'; }
        
        const btn = document.createElement('button');
        btn.className = `px-3 py-2 md:px-4 md:py-3 rounded-xl border text-xs md:text-base font-bold transition-all active:scale-95 ${activeTags.has(tag) ? activeClass : "bg-slate-800 text-slate-400 border-slate-700"}`;
        btn.textContent = tag;
        btn.onclick = () => { activeTags.has(tag) ? activeTags.delete(tag) : activeTags.add(tag); renderTags(); updateUI(); };
        containers[category].appendChild(btn);
    });
}

function updateUI() {
    const list = document.getElementById('weapon-list');
    const sortedWeapons = [...weapons].sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
    
    const filteredForDecision = sortedWeapons.filter(w => 
        activeTags.size === 0 || Array.from(activeTags).every(t => w.tags.includes(t))
    );

    const filteredForDisplay = filteredForDecision.filter(w => 
        searchQuery === "" || w.name.includes(searchQuery)
    );

    document.getElementById('result-count').innerText = filteredForDisplay.length;
    
    updateDecisionBox(filteredForDecision);

    if (filteredForDisplay.length === 0) {
        list.innerHTML = `<div class="p-12 text-center text-slate-500 text-lg font-medium">결과 없음</div>`;
    } else {
        list.innerHTML = filteredForDisplay.map((w, index) => createWeaponCard(w, index)).join('');
    }
}

// ============================================================
// 🛑 [복구됨] 유저 지정 골든 룰 로직 (validCandidates 사용) 🛑
// ============================================================
function updateDecisionBox(filteredWeapons) {
    const box = document.getElementById('decision-box');
    
    // 0. 초기 상태 (요청하신 텍스트 반영)
    if (activeTags.size === 0 && searchQuery === "") { 
        renderBox(box, '이거 갈아도 됨?', '필터에서 옵션을 선택해주세요', 'bg-slate-800/90 border-dashed border-slate-600');
        return;
    }

    // 1. 필터 결과 없음 -> 갈아
    if (filteredWeapons.length === 0) { renderBox(box, '갈아', '필요없음', 'bg-slate-700'); return; }

    // 2. 보유 무기 제외한 후보군 선정
    const candidates = filteredWeapons.filter(w => !ownedWeapons.has(w.name));

    // 3. 후보군이 모두 보유 중임 -> 갈아
    if (candidates.length === 0) { renderBox(box, '갈아', '필요없음 (모두 보유중)', 'bg-slate-700'); return; }

    // 4. 유효 후보군(목표 등급 이상) 추출 - [이 부분이 핵심 복구 사항]
    const validCandidates = candidates.filter(w => (w.rarity || 0) >= targetRarity);

    // 5. 판단 로직 분기
    // CASE A: 옵션 3개 모두 선택 (확정 판단)
    if (activeTags.size === 3) {
        if (validCandidates.length > 0) {
            // 유효 무기가 하나라도 있으면 킵
            const bgClass = targetRarity === 6 ? 'bg-red-600 animate-pulse border-red-400' : 'bg-yellow-600 border-yellow-400';
            renderBox(box, '갈지마', '킵하고 잠금ㄱ', bgClass);
        } else {
            renderBox(box, '갈아', '필요없음', 'bg-slate-700');
        }
        return;
    }

    // CASE B: 옵션 1~2개 선택 (탐색 판단)
    // 유효 무기가 살아있으면 무조건 더 선택하라고 함 (minRarity 로직 제거됨)
    if (validCandidates.length > 0) {
        renderBox(box, '옵션 더 선택', '아직 판단 못함', 'bg-blue-600');
    } else {
        renderBox(box, '갈아', '필요없음', 'bg-slate-700');
    }
}
// ============================================================

function renderBox(element, title, desc, bgClass, titleSize) {
    const sizeClass = titleSize || "text-4xl md:text-6xl";
    element.innerHTML = `<div class="${bgClass} rounded-2xl md:rounded-3xl h-32 md:h-52 flex flex-col justify-center items-center p-3 md:p-4 text-center shadow-2xl border-2 border-white/20 animate-pop relative overflow-hidden transition-colors duration-300"><div class="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div><h2 class="${sizeClass} font-black text-white drop-shadow-lg relative z-10 leading-tight">${title}</h2>${desc ? `<p class="text-sm md:text-xl font-bold text-white/80 relative z-10 mt-1 md:mt-2">${desc}</p>` : ''}</div>`;
}

function createWeaponCard(w, index) {
    const styles = getRarityStyles(w.rarity);
    const imgPath = w.image ? w.image : `images/${w.name}.png`;
    
    const statusMap = JSON.parse(localStorage.getItem('endfield_weapon_status_v2') || '{}');
    const status = statusMap[w.name] || 0;

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
            
            <div onclick="toggleAccordion(${index})" class="flex items-center gap-3 md:gap-5 px-3 py-3 md:px-6 md:py-5 cursor-pointer pl-6 md:pl-8"> 
                <div class="no-select w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-900 border border-slate-700 relative overflow-hidden shrink-0" 
                     onmousedown="handlePressStart('${w.name}')" 
                     ontouchstart="handlePressStart('${w.name}')" 
                     onmouseup="handlePressEnd()" 
                     ontouchend="handlePressEnd()" 
                     onmouseleave="handlePressEnd()"
                     onclick="event.stopPropagation(); handleClick('${w.name}')"
                     oncontextmenu="return false;">
                    ${checkIcon}
                    <img src="${imgPath}" class="w-full h-full object-contain p-1 md:p-1.5" onerror="this.style.display='none'">
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
                <span class="arrow-icon text-slate-500 text-xs md:text-sm">▼</span>
            </div>
            
            <div class="details-content bg-slate-900/50 px-4 md:px-6 border-t border-white/5 ml-[4px] md:ml-[6px]">
                <div class="py-6 md:py-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    <div class="flex items-center justify-center bg-slate-800/50 rounded-2xl border border-slate-700 h-[180px] md:h-[220px] relative">
                        <img src="${imgPath}" class="w-full h-full object-contain p-6 drop-shadow-2xl" alt="${w.name}" onerror="this.style.display='none'">
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

function getRarityStyles(rarity) {
    const r = parseInt(rarity) || 0;
    if (r === 6) return { badge: 'bg-orange-600 text-white', bar: 'bg-orange-500 shadow-[0_0_12px_orange]' };
    if (r === 5) return { badge: 'bg-yellow-600 text-white', bar: 'bg-yellow-400' };
    if (r === 4) return { badge: 'bg-purple-600 text-white', bar: 'bg-purple-400' };
    return { badge: 'bg-slate-600 text-slate-200', bar: 'bg-slate-600' };
}

function toggleAccordion(index) { document.getElementById(`weapon-${index}`).classList.toggle('details-open'); }

loadData();