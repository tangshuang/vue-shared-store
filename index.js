import { ref, shallowRef, watch, effectScope, onMounted, getCurrentScope } from 'vue-demi';

export function onMountedOnce(mountedFn) {
    const scope = getCurrentScope();
    onMounted(() => {
        if (!scope) {
            console.warn(`onMountedOnce can only be called in defineStore setup`);
        }
        else if (scope.__mounted) {
            return;
        }
        else {
            scope.__mounted = true;
        }
        return mountedFn();
    });
}

export function defineStore(data, setup, options) {
    const r = options?.shallow ? shallowRef : ref;
    const state = r(data);
    const scope = effectScope();
    const useStore = (...args) => {
        let store = state;
        if (setup) {
            scope.run(() => {
                store = setup(state, ...args);
            });
        }
        return store;
    };

    if (options?.plugins?.length) {
        options.plugins.forEach((plugin) => {
            plugin(state, options, data);
        });
    }

    return useStore;
}

/**
 * @deprecated use defineStore instead
 */
export const defineSharedStore = defineStore;

export function createSharedStoreMutationObserver(options) {
    return (state, storeOptions, data) => {
        const { stack: fileStack } = new Error();
        const fileStackLines = fileStack.split('\n');
        const filePathInfo = fileStackLines[5];
        const filePath = filePathInfo.replace(/^.*?at\s/, '');
        const { debug, onChange } = options;
        const { name = filePath } = storeOptions;

        let latestRefValue = data;

        watch(state, () => {}, {
            immediate: true,
            flush: 'pre',
            deep: true,
            onTrigger(e) {
                const { stack } = new Error();
                const lines = stack.split('\n');
                const traces = lines.slice(6);
                const trace = traces.join('\n');
                const { target, newValue, oldValue } = e;
                const time = Date.now();
                const type = typeof data;
                if (target.__v_isRef) {
                    if (debug) {
                        console.debug(`%c[vue]: ${new Date(time)} state '${name}' typeof ${type} changed`, 'color:#de2e29;font-weight:800', '\nnew value:', newValue, ', old value:', latestRefValue, '\nstack:\n', '\n' + trace);
                    }
                    onChange?.({
                        time,
                        name,
                        oldValue: latestRefValue,
                        newValue,
                        data,
                        trace,
                        state,
                        typeof: type,
                    });
                    latestRefValue = newValue;
                }
                else {
                    const path = findKeyPath(target, data) || [];
                    const keyPath = [...path, Array.isArray(target) ? +e.key : e.key].map(key => typeof key === 'number' ? `[${key}]` : `.${key}`).join('').replace(/^\./, '');
                    if (debug) {
                        console.debug(`%c[vue]: ${new Date(time)} state '${name}' changed at '${keyPath}'`, 'color:#de2e29;font-weight:800', '\nnew value:', newValue, ', old value:', oldValue, ', whole state:', data, '.\nstack:\n', '\n' + trace);
                    }
                    onChange?.({
                        time,
                        name,
                        keyPath,
                        oldValue,
                        newValue,
                        data,
                        state,
                        trace,
                        typeof: type,
                    });
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
