import { activeElement, navigation, splitScreenActive } from "../store/store";
import { get } from "svelte/store";
import SplitScreen from "../pages/SplitScreen.svelte";

export const defaultElement = "Home";
export let splitScreenPossible = false
export let splitScreenElements: any = [];

export function openTab(title: string, component: any) {
    activeElement.set(title);
    const data = get(navigation)
    data.push({ title: title, component: component })
    navigation.set(data)
}

export function changeActiveTab(title: string) {
    console.log("changeActiveTab", title);
    handleSplitScreen();
    activeElement.set(title);
}

export function handleSplitScreen() {
    const data = get(navigation)
    data.length > 2
        ? (splitScreenPossible = true)
        : (splitScreenPossible = false);
}

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
        splitScreenActive.set(true)
    }
    if (splitScreenElements.length > 2) {
        const data = get(navigation)
        data.push(splitScreenElements[0])
        data.push(splitScreenElements[1])
        navigation.set(data)
        closeTab(
            splitScreenElements[0].title +
            " || " +
            splitScreenElements[1].title,
        );
        splitScreenActive.set(false)
        splitScreenElements = [];
    }
}

export function closeTab(title: string) {
    const data = get(navigation)

    navigation.set(
        data.filter((element) => element.title !== title),
    );
    if (title.includes(" || ")) {
        splitScreenActive.set(false);
        splitScreenElements = [];
    }
    activeElement.set(defaultElement);
}
