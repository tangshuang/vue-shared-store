import type { Ref } from 'vue';

export type StoreOptions<S> = {
    name?: string;
    plugins?: Array<(sharedState: Ref<S>, storeOptions: StoreOptions, data: S) => void>;
    shallow?: boolean;
};

export declare function defineStore<S = any, T = any>(
    data: S,
    fn?: (stateRef: Ref<S>) => T,
    options?: StoreOptions<S>,
): T;

/**
 * @deprecated use defineStore instead
 */
export declare function defineSharedStore<S = any, T = any>(
    data: S,
    fn?: (stateRef: Ref<S>) => T,
    options?: StoreOptions<S>,
): T;

export declare function createSharedStoreMutationObserver<S = any>(options: {
    debug?: boolean;
    onChange?: (info: {
        time: number,
        name: string,
        // when data is an object, keyPath is the path of the changed key
        keyPath?: string[],
        oldValue: any,
        newValue: any,
        data: S,
        state: Ref<S>,
        trace: string,
        typeof: string,
    }) => void;
}): (sharedState: Ref<S>, storeOptions: StoreOptions, data: S) => void;

/**
 * onMounted first time, only run once
 */
export function onMountedOnce(mountedFn: () => void): void;
