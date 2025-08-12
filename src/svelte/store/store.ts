import { writable } from "svelte/store";
import Home from "../pages/Home.svelte";
export const splitScreenActive = writable<boolean>(false);
export const showAppContent = writable<boolean>(false);
export const activeElement = writable<string>("Home");
export const navigation = writable<{ title: string, component: any }[]>([{ title: "Home", component: Home }]);

