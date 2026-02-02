// src/ui/TaskRenderer.js

export class TaskRenderer {
    constructor() {
        this.listEl = document.getElementById('task-list');
        this.progressBar = document.getElementById('total-progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.toggleBtnText = document.getElementById('text-toggle-completed');
        this.toggleBtnIcon = document.getElementById('btn-toggle-completed');
    }

    render(tasks, state, mode) {
        this.listEl.innerHTML = '';
        let lastAccess = "";
        let visibleCount = 0;

        tasks.forEach(task => {
            visibleCount++;

            // 1. 구역 헤더 (Sticky Header)
            if (task.access && task.access !== lastAccess) {
                this.renderHeader(task.access);
                lastAccess = task.access;
            }

            // 2. 태스크 카드
            const isDone = !!state.completed[task.id];
            const subTotal = task.subtasks.length;
            const subDoneCount = task.subtasks.filter(s => state.subStatus[task.id]?.[s.id]).length;
            const progress = subTotal > 0 ? Math.round((subDoneCount / subTotal) * 100) : (isDone ? 100 : 0);

            const itemHtml = document.createElement('div');
            itemHtml.className = `task-item group relative pl-2 md:pl-0 py-2 ${isDone ? 'completed' : ''}`;
            itemHtml.dataset.id = task.id;

            if (mode === 'simple') {
                itemHtml.innerHTML = this.createSimpleCard(task, isDone, subDoneCount, subTotal, progress);
            } else {
                itemHtml.innerHTML = this.createDetailCard(task, state.subStatus[task.id] || {}, isDone, progress);
            }

            this.listEl.appendChild(itemHtml);
        });

        if (visibleCount === 0) {
            this.listEl.innerHTML = `<div class="text-center py-20 text-slate-500">🎉 모든 업무 완료! (또는 표시할 항목 없음)</div>`;
        }
    }

    renderHeader(title) {
        const html = `
            <div class="section-header sticky top-[220px] md:top-[230px] z-30 py-3 bg-slate-950/95 backdrop-blur-sm -mx-2 px-2 mt-2 border-b border-white/5 select-none pointer-events-none">
                <h3 class="text-emerald-400 text-sm font-bold flex items-center gap-2">
                    <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    ${title}
                </h3>
            </div>
        `;
        this.listEl.insertAdjacentHTML('beforeend', html);
    }

    createSimpleCard(task, isDone, subDone, subTotal, progress) {
        let cardClass = isDone ? "completed border-emerald-500/30 bg-emerald-900/10" : (subDone > 0 ? "border-blue-500/50 bg-slate-800" : "border-slate-700 bg-slate-900");
        let icon = isDone ? "✅" : (subDone > 0 ? "🔥" : "⬜");

        return `
            <div class="task-card glass-panel p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all active:scale-95 relative overflow-hidden ${cardClass}" onclick="window.app.toggleMainTask('${task.id}')">
                <div class="absolute left-0 bottom-0 h-1 bg-blue-500/50 transition-all" style="width: ${progress}%"></div>
                <span class="text-2xl filter drop-shadow-md shrink-0">${icon}</span>
                <div class="min-w-0 flex-1">
                    <h3 class="task-title text-lg font-bold text-slate-200 truncate">${task.title}</h3>
                    <div class="text-xs text-slate-500 font-bold mt-0.5">${subDone}/${subTotal} 완료</div>
                </div>
                <div class="drag-handle p-2 text-slate-600 hover:text-emerald-400 cursor-grab" onclick="event.stopPropagation()">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                </div>
            </div>
        `;
    }

    createDetailCard(task, subStatus, isDone, progress) {
        let cardClass = isDone ? "completed border-emerald-500/30 bg-emerald-900/10" : (progress > 0 ? "border-blue-500/50 bg-slate-800" : "border-slate-700 bg-slate-900");
        let icon = isDone ? "✅" : (progress > 0 ? "🔥" : "⬜");

        const subsHtml = task.subtasks.map(sub => {
            const isSubDone = !!subStatus[sub.id];
            return `
                <div class="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer" onclick="event.stopPropagation(); window.app.toggleSubTask('${task.id}', '${sub.id}')">
                    <input type="checkbox" class="custom-checkbox flex-shrink-0" ${isSubDone ? 'checked' : ''}>
                    <span class="text-sm font-medium ${isSubDone ? 'text-slate-500 line-through' : 'text-slate-300'}">${sub.title}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="task-card glass-panel p-4 rounded-2xl relative overflow-hidden ${cardClass}">
                <div class="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
                    <div class="flex items-center gap-3 min-w-0">
                        <span class="text-2xl shrink-0">${icon}</span>
                        <div class="min-w-0">
                            <h3 class="task-title text-lg font-bold text-slate-200 truncate">${task.title}</h3>
                            <div class="w-24 h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                                <div class="h-full bg-blue-500 transition-all" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="drag-handle p-2 text-slate-600 hover:text-emerald-400 cursor-grab" onclick="event.stopPropagation()">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                    </div>
                </div>
                <div class="space-y-1">
                    ${subsHtml}
                </div>
            </div>
        `;
    }

    updateProgress(percentage) {
        this.progressText.innerText = percentage;
        this.progressBar.style.width = `${percentage}%`;
    }

    updateToggleBtn(hideCompleted) {
        if (hideCompleted) {
            this.toggleBtnText.innerText = "완료 보이기";
            this.toggleBtnIcon.classList.add('bg-emerald-800', 'text-white');
        } else {
            this.toggleBtnText.innerText = "완료 숨기기";
            this.toggleBtnIcon.classList.remove('bg-emerald-800', 'text-white');
        }
    }
}