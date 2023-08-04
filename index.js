import { reactive, computed, ref, watch } from 'vue-demi';

export function defineSharedStore(initialState, fn, options) {
    var sharedState, reactiveState;
    if (initialState && typeof initialState === 'object') {
        reactiveState = reactive(initialState);
        sharedState = computed(() => reactiveState);
    }
    else {
        sharedState = reactiveState = ref(initialState);
    }

    const useSharedState = () => (fn ? fn(sharedState) : sharedState);

    if (options?.plugins?.length) {
        options.plugins.forEach((plugin) => {
            plugin(sharedState, useSharedState, reactiveState, initialState, options);
        });
    }

    return useSharedState;
}

export function createSharedStoreMutationObserver(options) {
    return (sharedState, useSharedState, reactiveState, initialState, storeOptions) => {
        const type = typeof initialState;
        const { stack: fileStack } = new Error();
        const fileStackLines = fileStack.split('\n');
        const filePathInfo = fileStackLines[5];
        const filePath = filePathInfo.replace(/^.*?at\s/, '');
        const { debug, onChange } = options;
        const { name = filePath } = storeOptions;
        watch(reactiveState, () => {}, {
            immediate: true,
            flush: 'pre',
            deep: true,
            onTrigger(e) {
                const { stack } = new Error();
                const lines = stack.split('\n');
                const traces = lines.slice(6);
                const trace = traces.join('\n');
                const { target, newValue, oldValue } = e;
                if (target.__v_isRef) {
                    if (debug) {
                        console.debug(`%c[vue3x]: shared state '${name}' typeof ${type} changed'`, 'color:#491D90;font-weight:800', 'new value:', newValue, '\nstack:\n', '\n' + trace);
                    }
                    onChange?.({
                        time: Date.now(),
                        name,
                        valueType: type,
                        newValue,
                        trace,
                        sharedState,
                    })
                }
                else {
                    const path = findKeyPath(target, initialState) || [];
                    const keyPath = [...path, Array.isArray(target) ? +e.key : e.key].map(key => typeof key === 'number' ? `[${key}]` : `.${key}`).join('').replace(/^\./, '');
                    if (debug) {
                        console.debug(`%c[vue3x]: shared state '${name}' changed at '${keyPath}'`, 'color:#491D90;font-weight:800', 'new value:', newValue, 'old value:', oldValue, 'whole state:', initialState, '\nstack:\n', '\n' + trace);
                    }
                    onChange?.({
                        time: Date.now(),
                        name,
                        keyPath,
                        newValue,
                        oldValue,
                        state: initialState,
                        sharedState,
                        trace,
                    })
                }
            },
        });
    };
}

function findKeyPath(target, source, path = []) {
    const keys = Object.keys(source);
    const isArr = Array.isArray(source);
    for (let i = 0, len = keys.length; i < len; i ++) {
        const key = keys[i];
        const value = source[key];
        const nextPath = [...path, isArr ? +key : key];
        if (value === target) {
            return nextPath;
        }
        if (value && typeof value === 'object') {
            const foundPath = findKeyPath(target, value, nextPath);
            if (foundPath) {
                return foundPath;
            }
        }
    }
}
