// tab.ts
// Tab navigation and split screen management utilities for Svelte application.
// Handles opening, closing, switching, and split-screening of navigation tabs.

import { activeElement, navigation, splitScreenActive } from "../store/store";
import { get } from "svelte/store";
import SplitScreen from "../pages/SplitScreen.svelte";

// Default tab element name
export const defaultElement = "Home";
// Indicates if split screen is currently possible (more than 2 tabs open)
export let splitScreenPossible = false;
// Stores elements selected for split screen view
export let splitScreenElements: any = [];

/**
 * Opens a new tab and sets it as the active element.
 * Adds the tab to the navigation store.
 * @param title Tab title (string)
 * @param component Svelte component to render in the tab
 */
export function openTab(title: string, component: any) {
    activeElement.set(title);
    const data = get(navigation);
    data.push({ title: title, component: component });
    navigation.set(data);
}

/**
 * Changes the currently active tab by title.
 * Also checks if split screen is possible.
 * @param title Tab title to activate
 */
export function changeActiveTab(title: string) {
    console.log("changeActiveTab", title);
    handleSplitScreen();
    activeElement.set(title);
}

/**
 * Checks if split screen is possible (more than 2 tabs open).
 * Sets splitScreenPossible flag accordingly.
 */
export function handleSplitScreen() {
    const data = get(navigation);
    data.length > 2
        ? (splitScreenPossible = true)
        : (splitScreenPossible = false);
}

/**
 * Handles split screen logic:
 * - Adds item to splitScreenElements
 * - If two elements selected, closes their tabs and opens a combined split screen tab
 * - If more than two, restores original tabs and closes split screen
 * @param item Tab object to add to split screen
 */
export function splitScreen(item) {
    splitScreenElements.push(item);
    if (splitScreenElements.length === 2) {
        closeTab(splitScreenElements[0].title);
        closeTab(splitScreenElements[1].title);
        openTab(
            splitScreenElements[0].title +
            " || " +
            splitScreenElements[1].title,
            SplitScreen,
        );
        splitScreenActive.set(true);
    }
    if (splitScreenElements.length > 2) {
        const data = get(navigation);
        data.push(splitScreenElements[0]);
        data.push(splitScreenElements[1]);
        navigation.set(data);
        closeTab(
            splitScreenElements[0].title +
            " || " +
            splitScreenElements[1].title,
        );
        splitScreenActive.set(false);
        splitScreenElements = [];
    }
}

/**
 * Closes a tab by title and updates navigation store.
 * If closing a split screen tab, resets split screen state.
 * Sets active element to default.
 * @param title Tab title to close
 */
export function closeTab(title: string) {
    const data = get(navigation);

    navigation.set(
        data.filter((element) => element.title !== title),
    );
    if (title.includes(" || ")) {
        splitScreenActive.set(false);
        splitScreenElements = [];
    }
    activeElement.set(defaultElement);
}
