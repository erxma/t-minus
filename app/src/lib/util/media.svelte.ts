import { browser } from "$app/environment";

let _isLargeScreen: boolean | undefined = $state();

export const isLargeScreen = () => _isLargeScreen;

if (browser) {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    function onMediaQueryChange() {
        // Update isLargeScreen based on window size
        _isLargeScreen = mediaQuery.matches;
    }

    onMediaQueryChange();
    mediaQuery.addEventListener("change", onMediaQueryChange);

    window.addEventListener("beforeunload", () => {
        mediaQuery.removeEventListener("change", onMediaQueryChange);
    });
}
