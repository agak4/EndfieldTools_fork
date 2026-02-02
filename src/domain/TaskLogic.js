// src/domain/TaskLogic.js

export class TaskLogic {
    /**
     * 현재 탭, 정렬 순서, 숨김 설정에 맞춰 보여줄 태스크 목록을 가공합니다.
     */
    static processTasks(tasks, state, currentTab) {
        // 1. 탭 필터링 & 숨김 필터링
        let filtered = tasks.filter(t => 
            t.type === currentTab && 
            !state.hiddenTasks[t.id]
        );

        // 2. 완료 항목 숨김 필터링
        if (state.hideCompleted) {
            filtered = filtered.filter(t => !state.completed[t.id]);
        }

        // 3. 정렬 (커스텀 순서 -> 기본 순서)
        const orderMap = new Map((state.order[currentTab] || []).map((id, i) => [id, i]));
        
        filtered.sort((a, b) => {
            const idxA = orderMap.has(a.id) ? orderMap.get(a.id) : 9999;
            const idxB = orderMap.has(b.id) ? orderMap.get(b.id) : 9999;
            
            if (idxA !== idxB) return idxA - idxB;
            return (a.default_order || 0) - (b.default_order || 0);
        });

        return filtered;
    }

    /**
     * 진행도(%)를 계산합니다.
     */
    static calculateProgress(tasks, state, currentTab) {
        // 숨겨진 태스크는 분모에서 제외
        const activeTasks = tasks.filter(t => 
            t.type === currentTab && 
            !state.hiddenTasks[t.id]
        );

        let totalSub = 0;
        let doneSub = 0;

        activeTasks.forEach(t => {
            const subs = t.subtasks || [];
            totalSub += subs.length;
            
            // 서브 태스크 완료 여부 확인
            const subStatus = state.subStatus[t.id] || {};
            doneSub += subs.filter(s => subStatus[s.id]).length;
        });

        if (totalSub === 0) return 0;
        return Math.round((doneSub / totalSub) * 100);
    }

    /**
     * 메인 태스크 토글 시 상태 변화를 계산합니다.
     */
    static toggleMain(taskId, tasks, currentState) {
        const newState = JSON.parse(JSON.stringify(currentState)); // Deep Copy
        const isDone = !!newState.completed[taskId];
        const task = tasks.find(t => t.id === taskId);

        if (isDone) {
            delete newState.completed[taskId];
            delete newState.subStatus[taskId];
        } else {
            newState.completed[taskId] = true;
            if (!newState.subStatus[taskId]) newState.subStatus[taskId] = {};
            task.subtasks.forEach(s => newState.subStatus[taskId][s.id] = true);
        }
        return newState;
    }

    /**
     * 서브 태스크 토글 시 상태 변화를 계산합니다.
     */
    static toggleSub(taskId, subId, tasks, currentState) {
        const newState = JSON.parse(JSON.stringify(currentState));
        if (!newState.subStatus[taskId]) newState.subStatus[taskId] = {};

        // 토글
        if (newState.subStatus[taskId][subId]) {
            delete newState.subStatus[taskId][subId];
        } else {
            newState.subStatus[taskId][subId] = true;
        }

        // 부모 상태 동기화
        const task = tasks.find(t => t.id === taskId);
        const allDone = task.subtasks.every(s => newState.subStatus[taskId][s.id]);

        if (allDone) newState.completed[taskId] = true;
        else delete newState.completed[taskId];

        return newState;
    }
}