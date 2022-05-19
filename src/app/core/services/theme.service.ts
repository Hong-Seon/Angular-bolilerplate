import {Inject, Injectable, OnDestroy} from '@angular/core';
import {DOCUMENT} from "@angular/common";
import {DEFAULT_BASE_THEME, ThemeList} from "./theme.config";
import {getItem, setItem, StorageItem} from "../utils";
import {fromEventPattern, Subject, takeUntil} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements  OnDestroy {

  destroy$ = new Subject();

  private readonly mediaQuery = window.matchMedia(
    '(prefers-color-scheme: dark)',
  );

  constructor(@Inject(DOCUMENT) private document: Document) { }

 get systemTheme(): ThemeList.Light | ThemeList.Dark {
    return this.mediaQuery.matches ? ThemeList.Dark : ThemeList.Light;
  }

  /**
   * Manually changes theme in LocalStorage & HTML body
   *
   * @param theme new theme
   */
  setTheme(theme: ThemeList): void {
    this.clearThemes();
    this.storedTheme = theme;

    let bodyClass = theme;

    if (theme === ThemeList.System) {
      bodyClass = this.systemTheme;
    }
    this.document.body.classList.add(bodyClass);
  }

  get storedTheme(): ThemeList {
    return getItem(StorageItem.Theme) as ThemeList;
  }
  set storedTheme(theme: ThemeList) {
    setItem(StorageItem.Theme, theme);
  }

  init(): void {
    this.makeAutomaticCheck();
    this.listenForMediaQueryChanges();
  }

  /**
   * Clears all themes in ThemeList enum from the HTML element
   *
   */
  private clearThemes(): void {
    for (const theme in ThemeList) {
      const key: ThemeList = ThemeList[theme as keyof typeof ThemeList];
      this.document.body.classList.remove(key);
    }
  }

  /**
   * Makes initial theme check based on LocalStorage theme
   *
   */
  private makeAutomaticCheck(): void {
    this.setTheme(this.storedTheme || DEFAULT_BASE_THEME);
  }

  /**
   * Handles system theme changes & applies theme automatically
   *
   */
  private listenForMediaQueryChanges(): void {
    fromEventPattern<MediaQueryListEvent>(
      this.mediaQuery.addListener.bind(this.mediaQuery),
      this.mediaQuery.removeListener.bind(this.mediaQuery),
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Only applies changes when the current theme is "system"
        if (this.storedTheme === ThemeList.System) {
          this.setTheme(ThemeList.System);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
