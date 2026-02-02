// src/utils/StorageUtils.js

export class StorageUtils {
    /**
     * 데이터를 저장합니다.
     * @param {string} key - 스토리지 키
     * @param {any} value - 저장할 데이터 (자동으로 JSON stringify 됨)
     */
    static save(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
        } catch (e) {
            console.error(`[StorageUtils] Save Error (${key}):`, e);
        }
    }

    /**
     * 데이터를 불러옵니다.
     * @param {string} key - 스토리지 키
     * @param {any} defaultValue - 데이터가 없거나 에러 발생 시 반환할 기본값
     * @returns {any} 파싱된 데이터
     */
    static load(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (e) {
            console.error(`[StorageUtils] Load Error (${key}):`, e);
            return defaultValue;
        }
    }

    /**
     * 데이터를 삭제합니다.
     * @param {string} key 
     */
    static remove(key) {
        localStorage.removeItem(key);
    }
}