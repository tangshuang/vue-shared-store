# vue-shared-store

The most easy way to define a shared store composition api for vue3.

## Install

```
npm i vue-shared-store
```

## Usage

```js
// a.ts

import { defineStore } from 'vue-shared-store';
import { computed } from 'vue';

export const useStore = defineStore(
    {
        a: 1,
    },
    (state) => {
        const b = computed(() => state.value.a + 1);

        const inc = () => state.value.a ++;

        return { b, inc };
    },
);
```

In the previous code, we define a shared state which is an object contains a `a` property.
The `defineStore` function return a composition api function which will be used in different components which use the shared state,
and when the shared state is modified in one component, the other components which use this shared state will react the mutation.

```vue
// b.vue
<script setup>
import { useStore } from './a';
const { b } = useStore();
</script>

<template>
    <span>{{b}}</span>
</template>
```

In this component, we use the exposed composition api function to use value `b`.

```vue
// c.vue
<script setup>
import { useStore } from './a';
const { inc } = useStore();
</script>

<template>
    <button @click="inc">inc</button>
</template>
```

In this component, we invoke the the `inc` function to modify the shared state, however the state is shared thus the preivous component which use value `b` will change too.

## API

```ts
defineStore(data, setup?, options?)
```

- data: shared data state
- setup?: define the composition api function, recieve shared state wrapped by a ref, if not pass, the composition api function return the shared state directly
- options?
    - name?: to indentify current observer's name
    - plugins?: array
    - shallow?: whether use shallowRef


```ts
onMountedOnce(fn: () => void): void
```

When we define a shared state, we can use `onMountedOnce` to execute a function only once when a component is mounted.

For example, we have two components, both of them use the same shared state, but only one component will execute the `onMountedOnce` function.

```ts
const useStore = defineStore(null, (state) => {
    onMountedOnce(() => {
        // ...
    });
});
```

```ts
// component a
const state = useStore();
// onMountedOnce will be executed
```

```ts
// component b
const state = useStore();
// onMountedOnce will not be executed
```

This is useful when we want to fetch data from remote backend only once when components are mounted.

**Plugin**

A plugin is a function which using composition api.

```
Plugin: (state, options, data) => void
```

```ts
createSharedStoreMutationObserver(options): Plugin
```

Create a shared store mutation observer plugin. Can only be used in debug mode to trace code source line. `options`:


- debug: boolean, true to console the debugger message
- onChange: (info) => void

Example:

```js
const useStore = defineStore(
    { a: { b: [1, 2, 3] } },
    (state) => {
        const b = computed(() => state.value.a.b[2] + 1);

        const inc = () => state.value.a.b[2]++;

        return { b, inc };
    },
    {
        plugins: [
            createSharedStoreMutationObserver({
                debug: process.env.NODE_ENV === 'development',
                onChange({ time, newValue, keyPath }) {
                    record(time, keyPath, newValue);
                },
            }),
        ],
    },
);
```
