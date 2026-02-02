// src/ui/TaskRenderer.js
export class TaskRenderer {
    constructor() {
        this.listContainer = document.getElementById('task-list');
        this.progressBar = document.getElementById('total-progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.toggleBtnText = document.getElementById('text-toggle-completed');
    }

    render(tasks, state, mode) {
        if (!this.listContainer) return;

        let lastAccess = null;

        this.listContainer.innerHTML = tasks.map(task => {
            let html = '';

            // 1. 헤더 로직
            const currentAccess = task.access || '기타';
            const isMainCompleted = state.completed[task.id];
            
            // 필터링
            if (state.hideCompleted && isMainCompleted) return '';
            if (state.hiddenTasks[task.id]) return '';

            // 섹션 헤더
            if (currentAccess !== lastAccess) {
                html += this._createAccessHeader(currentAccess);
                lastAccess = currentAccess;
            }

            // 2. 카드 렌더링 분기
            const subCount = task.subtasks ? task.subtasks.length : 0;

            if (subCount <= 1) {
                html += this._createSingleCard(task, state);
            } else {
                html += mode === 'detail' 
                    ? this._createExpandedCard(task, state) 
                    : this._createCollapsedCard(task, state);
            }
            
            return html;
        }).join('');
    }

    _createAccessHeader(accessName) {
        return `
            <div class="pt-6 pb-2 px-1 select-none flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                <h3 class="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                    ${accessName}
                </h3>
            </div>
        `;
    }

    _getCardStyle(isCompleted) {
        return `glass-panel rounded-xl border transition-all duration-200 overflow-hidden relative
                ${isCompleted 
                    ? 'bg-emerald-900/10 border-emerald-500/20 shadow-none' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 shadow-lg'}`;
    }

    // [Case A] 단일 카드 (touch-none 제거됨)
    _createSingleCard(task, state) {
        const isCompleted = state.completed[task.id];
        const cardStyle = this._getCardStyle(isCompleted);

        return `
            <div class="task-item mb-3 select-none" data-id="${task.id}">
                <div class="${cardStyle}">
                    <div onclick="window.app.toggleMainTask('${task.id}')" 
                         class="p-4 flex items-center gap-3 cursor-pointer group">
                        
                        <div class="drag-handle text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing p-1 -ml-2"
                             onclick="event.stopPropagation()">
                            ☰
                        </div>

                        <div class="w-6 h-6 flex items-center justify-center rounded-lg border-2 transition-all shrink-0
                            ${isCompleted ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 group-hover:border-emerald-500 bg-slate-900'}">
                            <span class="text-xs font-black text-white transform transition-transform ${isCompleted ? 'scale-100' : 'scale-0'}">✔</span>
                        </div>

                        <div class="flex-1 min-w-0 flex flex-col justify-center">
                            <span class="text-base font-bold transition-colors truncate
                                ${isCompleted ? 'text-emerald-500 line-through opacity-60' : 'text-slate-200'}">
                                ${task.title}
                            </span>
                            ${task.desc ? `<span class="text-xs text-slate-500 mt-0.5 truncate">${task.desc}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // [Case B-1] 접힌 카드 (touch-none 제거됨)
    _createCollapsedCard(task, state) {
        const isCompleted = state.completed[task.id];
        const cardStyle = this._getCardStyle(isCompleted);
        
        const subStatus = state.subStatus[task.id] || {};
        const total = task.subtasks.length;
        const done = task.subtasks.filter(s => subStatus[s.id]).length;

        return `
            <div class="task-item mb-3 select-none" data-id="${task.id}">
                <div class="${cardStyle}">
                    <div onclick="window.app.toggleMainTask('${task.id}')" 
                         class="p-4 flex items-center gap-3 cursor-pointer group">
                        
                        <div class="drag-handle text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing p-1 -ml-2"
                             onclick="event.stopPropagation()">
                            ☰
                        </div>

                        <div class="w-6 h-6 flex items-center justify-center rounded-lg border-2 transition-all shrink-0
                            ${isCompleted ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 group-hover:border-emerald-500 bg-slate-900'}">
                            <span class="text-xs font-black text-white transform transition-transform ${isCompleted ? 'scale-100' : 'scale-0'}">✔</span>
                        </div>

                        <div class="flex-1 min-w-0 flex flex-col justify-center">
                            <span class="text-base font-bold transition-colors truncate
                                ${isCompleted ? 'text-emerald-500 line-through opacity-60' : 'text-slate-200'}">
                                ${task.title}
                            </span>
                            ${task.desc ? `<span class="text-xs text-slate-500 mt-0.5 truncate">${task.desc}</span>` : ''}

                            <div class="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div class="h-full bg-blue-500 transition-all duration-300" style="width: ${(done/total)*100}%"></div>
                            </div>
                        </div>

                        <div class="text-xs font-bold font-mono px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-400">
                            ${done}/${total}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // [Case B-2] 펼친 카드 (touch-none 제거됨)
    _createExpandedCard(task, state) {
        const isCompleted = state.completed[task.id];
        const cardStyle = this._getCardStyle(isCompleted);
        
        const subStatus = state.subStatus[task.id] || {};
        const total = task.subtasks.length;
        const done = task.subtasks.filter(s => subStatus[s.id]).length;

        const subTasksHtml = task.subtasks.map(sub => {
            const isSubDone = !!subStatus[sub.id];
            
            return `
                <div onclick="window.app.toggleSubTask('${task.id}', '${sub.id}')" 
                     class="group/sub flex items-center p-3 mb-1 last:mb-0 rounded-lg cursor-pointer transition-all duration-200
                            ${isSubDone ? 'bg-emerald-900/10 opacity-60' : 'hover:bg-slate-700/30 active:scale-[0.98]'}">
                    
                    <div class="w-1 h-1 bg-slate-600 rounded-full mr-3 opacity-50"></div>

                    <div class="w-5 h-5 flex items-center justify-center rounded border-2 transition-all shrink-0 mr-3
                        ${isSubDone ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 bg-slate-900/50 group-hover/sub:border-slate-400'}">
                         <span class="text-[10px] font-black text-white transform transition-transform ${isSubDone ? 'scale-100' : 'scale-0'}">✔</span>
                    </div>

                    <span class="text-sm font-medium transition-colors flex-1 
                                 ${isSubDone ? 'text-slate-500 line-through' : 'text-slate-300 group-hover/sub:text-white'}">
                        ${sub.title}
                    </span>
                </div>
            `;
        }).join('');

        return `
            <div class="task-item mb-3 select-none" data-id="${task.id}">
                <div class="${cardStyle}">
                    
                    <div class="p-4 flex items-center gap-3 bg-slate-900/30 border-b border-dashed border-slate-700/50">
                        
                        <div class="drag-handle text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing p-1 -ml-2"
                             onclick="event.stopPropagation()">
                            ☰
                        </div>

                        <div onclick="window.app.toggleMainTask('${task.id}')" 
                             class="w-6 h-6 flex items-center justify-center rounded-lg border-2 transition-all shrink-0 cursor-pointer hover:ring-2 hover:ring-emerald-500/30
                            ${isCompleted ? 'bg-emerald-600 border-emerald-600' : 'border-slate-600 hover:border-emerald-400 bg-slate-900'}">
                            <span class="text-xs font-black text-white transform transition-transform ${isCompleted ? 'scale-100' : 'scale-0'}">✔</span>
                        </div>

                        <div class="flex-1 min-w-0 flex flex-col justify-center">
                            <span class="text-base font-bold transition-colors truncate ${isCompleted ? 'text-emerald-500 line-through opacity-60' : 'text-slate-200'}">
                                ${task.title}
                            </span>
                            ${task.desc ? `<span class="text-xs text-slate-500 mt-0.5 truncate">${task.desc}</span>` : ''}
                        </div>

                        <div class="text-xs font-bold font-mono px-2 py-1 rounded bg-slate-900/50 border border-slate-700/50 text-slate-500">
                            ${done}/${total}
                        </div>
                    </div>

                    <div class="p-2 bg-black/20 shadow-inner">
                        ${subTasksHtml}
                    </div>
                </div>
            </div>
        `;
    }

    updateProgress(percentage) {
        if (this.progressBar) this.progressBar.style.width = `${percentage}%`;
        if (this.progressText) this.progressText.innerText = Math.round(percentage);
    }

    updateToggleBtn(hideCompleted) {
        if (this.toggleBtnText) this.toggleBtnText.innerText = hideCompleted ? '완료 보이기' : '완료 숨기기';
    }
}