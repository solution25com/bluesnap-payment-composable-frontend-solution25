// eventBus.ts
import { reactive } from 'vue';

type EventCallback = (payload?: any) => void;

const eventBus = reactive({
    events: {} as Record<string, EventCallback[]>,
});

export const emitEvent = (eventName: string, payload?: any) => {
    const callbacks = eventBus.events[eventName];
    if (callbacks) {
        callbacks.forEach((callback) => callback(payload));
    }
};

export const onEvent = (eventName: string, callback: EventCallback) => {
    if (!eventBus.events[eventName]) {
        eventBus.events[eventName] = [];
    }
    eventBus.events[eventName].push(callback);
};

export const offEvent = (eventName: string, callback: EventCallback) => {
    const callbacks = eventBus.events[eventName];
    if (callbacks) {
        eventBus.events[eventName] = callbacks.filter((cb) => cb !== callback);
    }
};
