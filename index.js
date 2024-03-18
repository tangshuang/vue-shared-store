import { ref, watch } from 'vue-demi';

export function defineStore(initial, fn, options) {
    const state = ref(initial);
    const useState = (arg) => (fn ? fn(state, arg) : state);

    if (options?.plugins?.length) {
        options.plugins.forEach((plugin) => {
            plugin(state, options, initial);
        });
    }

    return useState;
}

/**
 * @deprecated use defineStore instead
 */
export const defineSharedStore = defineStore;

export function createSharedStoreMutationObserver(options) {
    return (state, storeOptions, initial) => {
        const { stack: fileStack } = new Error();
        const fileStackLines = fileStack.split('\n');
        const filePathInfo = fileStackLines[5];
        const filePath = filePathInfo.replace(/^.*?at\s/, '');
        const { debug, onChange } = options;
        const { name = filePath } = storeOptions;

        let latestRefValue = initial;

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
                const type = typeof initial;
                if (target.__v_isRef) {
                    if (debug) {
                        console.debug(`%c[vue]: ${new Date(time)} state '${name}' typeof ${type} changed`, 'color:#de2e29;font-weight:800', '\nnew value:', newValue, ', old value:', latestRefValue, '\nstack:\n', '\n' + trace);
                    }
                    onChange?.({
                        time,
                        name,
                        oldValue: latestRefValue,
                        newValue,
                        initial,
                        trace,
                        state,
                        typeof: type,
                    });
                    latestRefValue = newValue;
                }
                else {
                    const path = findKeyPath(target, initial) || [];
                    const keyPath = [...path, Array.isArray(target) ? +e.key : e.key].map(key => typeof key === 'number' ? `[${key}]` : `.${key}`).join('').replace(/^\./, '');
                    if (debug) {
                        console.debug(`%c[vue]: ${new Date(time)} state '${name}' changed at '${keyPath}'`, 'color:#de2e29;font-weight:800', '\nnew value:', newValue, ', old value:', oldValue, ', whole state:', initial, '.\nstack:\n', '\n' + trace);
                    }
                    onChange?.({
                        time,
                        name,
                        keyPath,
                        oldValue,
                        newValue,
                        initial,
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
