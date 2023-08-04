# vue-shared-store

The most easy way to define a shared store composition api for vue3.

## Install

```
npm i vue-shared-store
```

## Usage

```js
// a.ts

import { defineSharedStore } from 'vue-shared-store';
import { computed } from 'vue';

export const useMySharedState = defineSharedStore(
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
The `defineSharedStore` function return a composition api function which will be used in different components which use the shared state,
and when the shared state is modified in one component, the other components which use this shared state will react the mutation.

```js
// b.vue
<script setup>
import { useMySharedState } from './a';
const { b } = useMySharedState();
</script>

<template>
    <span>{{b}}</span>
</template>
```

In this component, we use the exposed composition api function to use value `b`.

```js
// c.vue
<script setup>
import { useMySharedState } from './a';
const { inc } = useMySharedState();
</script>

<template>
    <button @click="inc">inc</button>
</template>
```

In this component, we invoke the the `inc` function to modify the shared state, however the state is shared thus the preivous component which use value `b` will change too.

## API

```
defineSharedStore(initialState, defineFunc?, options?)
```

- initialState: shared initial state
- defineFunc: define the composition api function, recieve shared state wrapped by a ref, if not pass, the composition api function return the shared state directly
- options
    - name: to indentify current observer's name
    - plugins: array

**Plugin**

A plugin is a function which using composition api.

```
Plugin: (sharedState, useSharedState, reactiveState, initialState, storeOptions) => void
```

```
createSharedStoreMutationObserver(options): Plugin
```

Create a shared store mutation observer plugin. Can only be used in debug mode to trace code source line. `options`:


- debug: boolean, true to console the debugger message
- onChange: ({ time, name, valueType?, oldValue?, newValue, keyPath?, state?, sharedState, trace }) => void

Example:

```js
const useMySharedState = defineSharedStore(
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
