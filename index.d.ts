import type { Ref } from 'vue';

export declare function defineSharedStore<S = any, T = any>(
    initialState: S,
    fn: (stateRef: Ref<S>) => T,
    options?: {
        name?: string;
        plugins?: Array<(sharedState: Ref<S>, reactiveState: S, initialState: S) => void>;
    },
): T;

export declare function createSharedStoreMutationObserver(options: {
    debug?: boolean;
    onChange?: (info: { time: number, name: string, valueType?: string, oldValue?: any, newValue: any, keyPath?: string, state?: any, sharedState: Ref<any>, trace: string }) => void;
}): (sharedState: Ref<any>, reactiveState: any, initialState: any) => void;
