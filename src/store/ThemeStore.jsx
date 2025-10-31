import { create } from "zustand";
import {Dark, Light} from "../styles/themes";
export const useThemeStore = create((set, get) => ({
    theme: "Dark",
    themeStyle: Dark,
    setTheme: () => {
        const {theme} = get();
        set({theme: theme === "light" ? "dark" : "light"})
        set({themeStyle: theme === "light" ? Dark : Light});
    },
}));