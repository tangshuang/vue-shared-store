import { ref, watch } from 'vue-demi';

export function defineSharedStore(initialState, fn, options) {
    const sharedState = ref(initialState);

    const useSharedState = () => (fn ? fn(sharedState) : sharedState);

    if (options?.plugins?.length) {
        options.plugins.forEach((plugin) => {
            plugin(sharedState, options, initialState);
        });
    }

    return useSharedState;
}

export function createSharedStoreMutationObserver(options) {
    return (sharedState, storeOptions, initialState) => {
        const { stack: fileStack } = new Error();
        const fileStackLines = fileStack.split('\n');
        const filePathInfo = fileStackLines[5];
        const filePath = filePathInfo.replace(/^.*?at\s/, '');
        const { debug, onChange } = options;
        const { name = filePath } = storeOptions;

        let latestRefValue = initialState;

        watch(sharedState, () => {}, {
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
                if (target.__v_isRef) {
                    const type = typeof initialState;
                    if (debug) {
                        console.debug(`%c[vue]: ${new Date(time)} shared state '${name}' typeof ${type} changed`, 'color:#491D90;font-weight:800', '\nnew value:', newValue, ', old value:', latestRefValue, '\nstack:\n', '\n' + trace);
                    }
                    onChange?.({
                        time,
                        name,
                        oldValue: latestRefValue,
                        newValue,
                        trace,
                        sharedState,
                        typeof: type,
                    });
                    latestRefValue = newValue;
                }
                else {
                    const path = findKeyPath(target, initialState) || [];
                    const keyPath = [...path, Array.isArray(target) ? +e.key : e.key].map(key => typeof key === 'number' ? `[${key}]` : `.${key}`).join('').replace(/^\./, '');
                    if (debug) {
                        console.debug(`%c[vue]: ${new Date(time)} shared state '${name}' changed at '${keyPath}'`, 'color:#491D90;font-weight:800', '\nnew value:', newValue, ', old value:', oldValue, ', whole state:', initialState, '.\nstack:\n', '\n' + trace);
                    }
                    onChange?.({
                        time,
                        name,
                        keyPath,
                        newValue,
                        oldValue,
                        state: initialState,
                        sharedState,
                        trace,
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
