import type { ColorScheme, SiteId, UiThemePreset } from '../../content/types';

const THEME_SITE_KEYS = new Set<SiteId | 'generic'>(['chatgpt', 'gemini', 'claude', 'generic']);

export const UI_THEME_DARK_SELECTORS = Object.freeze({
  chatgpt: 'html.dark',
  gemini: 'body.dark-theme',
  claude: 'html[data-mode="dark"], html.dark'
});

const NAV_LIGHT_BASE = Object.freeze({
  '--nav-bg': '#f9f9f9',
  '--nav-surface': '#f9f9f9',
  '--nav-border': '#efefef',
  '--nav-text': '#1f1f1f',
  '--nav-muted': '#666666',
  '--nav-accent': '#efefef',
  '--nav-accent-strong': '#1f1f1f',
  '--nav-hover': '#efefef',
  '--nav-accent-shadow': 'rgba(0, 0, 0, 0.06)',
  '--nav-item-bg': '#f4f4f4',
  '--nav-item-hover-bg': '#efefef',
  '--nav-item-active-bg': '#eaeaea',
  '--nav-item-hover-border': '#efefef',
  '--nav-item-active-border': '#eaeaea',
  '--nav-item-active-text': '#1f1f1f',
  '--nav-item-indicator-color': '#1f1f1f',
  '--nav-item-active-color': '#1f1f1f',
  '--nav-item-active-shadow': 'rgba(0, 0, 0, 0.06)',
  '--nav-control-hover-border': '#efefef',
  '--nav-control-hover-text': '#1f1f1f',
  '--nav-control-active-border': '#eaeaea',
  '--nav-control-active-bg': '#eaeaea',
  '--nav-control-active-text': '#1f1f1f',
  '--nav-shadow': '0 18px 42px rgba(23, 21, 16, 0.16)',
  '--nav-button-bg': '#f9f9f9',
  '--nav-active-text': '#1f1f1f',
  '--nav-scrollbar-size': '10px',
  '--nav-scrollbar-track': 'rgba(31, 31, 31, 0.06)',
  '--nav-scrollbar-thumb': 'rgba(31, 31, 31, 0.22)',
  '--nav-scrollbar-thumb-hover': 'rgba(31, 31, 31, 0.34)',
  '--nav-scrollbar-thumb-active': 'rgba(31, 31, 31, 0.44)',
  '--nav-panel-offset': '88px',
  '--nav-panel-max-height': 'calc(100vh - 176px)'
});

const NAV_LIGHT_SITE_OVERRIDES = Object.freeze({
  chatgpt: Object.freeze({}),
  gemini: Object.freeze({}),
  claude: Object.freeze({
    '--nav-bg': '#faf9f5',
    '--nav-surface': '#faf9f5',
    '--nav-border': '#e7e1d5',
    '--nav-text': '#2f2923',
    '--nav-muted': '#756c60',
    '--nav-accent': '#f0eee6',
    '--nav-accent-strong': '#d97757',
    '--nav-hover': '#f0eee6',
    '--nav-accent-shadow': 'rgba(217, 119, 87, 0.2)',
    '--nav-item-bg': '#f7f4ec',
    '--nav-item-hover-bg': '#f0eee6',
    '--nav-item-active-bg': '#eae4d8',
    '--nav-item-hover-border': '#e7e1d5',
    '--nav-item-active-border': '#d97757',
    '--nav-item-active-text': '#c6613f',
    '--nav-item-indicator-color': '#c6613f',
    '--nav-item-active-color': '#c6613f',
    '--nav-item-active-shadow': 'rgba(198, 97, 63, 0.18)',
    '--nav-control-hover-border': '#d97757',
    '--nav-control-hover-text': '#d97757',
    '--nav-control-active-border': '#c6613f',
    '--nav-control-active-bg': '#f0eee6',
    '--nav-control-active-text': '#c6613f',
    '--nav-button-bg': '#faf9f5'
  }),
  generic: Object.freeze({})
});

const NAV_DARK_OVERRIDES = Object.freeze({
  '--nav-bg': '#121417',
  '--nav-surface': '#181b1f',
  '--nav-border': '#2f343a',
  '--nav-text': '#e7eaee',
  '--nav-muted': '#a4adb7',
  '--nav-accent': '#2a3037',
  '--nav-accent-strong': '#c9d0d8',
  '--nav-hover': '#242a31',
  '--nav-accent-shadow': 'rgba(170, 178, 187, 0.18)',
  '--nav-item-bg': '#21262c',
  '--nav-item-hover-bg': '#2a3037',
  '--nav-item-active-bg': '#303740',
  '--nav-item-hover-border': '#4a545f',
  '--nav-item-active-border': '#66727d',
  '--nav-item-active-text': '#f1f4f7',
  '--nav-item-indicator-color': '#d3d9e0',
  '--nav-item-active-color': '#e5eaf0',
  '--nav-item-active-shadow': 'rgba(10, 12, 15, 0.38)',
  '--nav-control-hover-border': '#4f5964',
  '--nav-control-hover-text': '#e1e6eb',
  '--nav-control-active-border': '#6d7883',
  '--nav-control-active-bg': 'rgba(160, 169, 178, 0.18)',
  '--nav-control-active-text': '#f1f4f7',
  '--nav-shadow': '0 20px 48px rgba(3, 8, 17, 0.58), 0 2px 10px rgba(3, 8, 17, 0.35)',
  '--nav-button-bg': '#22272e',
  '--nav-active-text': '#f0f4f8',
  '--nav-scrollbar-track': 'rgba(232, 236, 241, 0.1)',
  '--nav-scrollbar-thumb': 'rgba(232, 236, 241, 0.34)',
  '--nav-scrollbar-thumb-hover': 'rgba(232, 236, 241, 0.48)',
  '--nav-scrollbar-thumb-active': 'rgba(232, 236, 241, 0.62)'
});

const FORMULA_THEME_BY_SITE = Object.freeze({
  chatgpt: Object.freeze({
    light: Object.freeze({
      outline: 'rgba(31, 31, 31, 0.34)',
      ring: 'rgba(31, 31, 31, 0.1)',
      hoverBg: '#F4F4F4',
      activeBg: '#F4F4F4',
      toastBg: 'rgba(249, 249, 249, 0.97)',
      toastText: '#1f1f1f',
      toastBorder: 'rgba(31, 31, 31, 0.16)',
      toastShadow: 'rgba(23, 21, 16, 0.2)'
    }),
    dark: Object.freeze({
      outline: 'rgba(211, 217, 224, 0.58)',
      ring: 'rgba(211, 217, 224, 0.2)',
      hoverBg: 'rgba(232, 236, 241, 0.14)',
      activeBg: 'rgba(232, 236, 241, 0.2)',
      toastBg: 'rgba(24, 27, 31, 0.95)',
      toastText: '#f1f4f7',
      toastBorder: 'rgba(109, 120, 131, 0.72)',
      toastShadow: 'rgba(3, 8, 17, 0.45)'
    })
  }),
  gemini: Object.freeze({
    light: Object.freeze({
      outline: 'rgba(8, 66, 160, 0.52)',
      ring: 'rgba(8, 66, 160, 0.18)',
      hoverBg: '#E9EEF6',
      activeBg: '#E9EEF6',
      toastBg: 'rgba(243, 246, 252, 0.97)',
      toastText: '#1f2a3d',
      toastBorder: 'rgba(8, 66, 160, 0.3)',
      toastShadow: 'rgba(8, 66, 160, 0.22)'
    }),
    dark: Object.freeze({
      outline: 'rgba(138, 180, 248, 0.66)',
      ring: 'rgba(138, 180, 248, 0.25)',
      hoverBg: 'rgba(138, 180, 248, 0.16)',
      activeBg: 'rgba(138, 180, 248, 0.26)',
      toastBg: 'rgba(27, 36, 51, 0.95)',
      toastText: '#e8f0fe',
      toastBorder: 'rgba(138, 180, 248, 0.46)',
      toastShadow: 'rgba(15, 23, 42, 0.44)'
    })
  }),
  claude: Object.freeze({
    light: Object.freeze({
      outline: 'rgba(198, 97, 63, 0.52)',
      ring: 'rgba(217, 119, 87, 0.2)',
      hoverBg: '#F0EEE6',
      activeBg: '#F0EEE6',
      toastBg: 'rgba(250, 249, 245, 0.97)',
      toastText: '#2f2923',
      toastBorder: 'rgba(217, 119, 87, 0.38)',
      toastShadow: 'rgba(198, 97, 63, 0.22)'
    }),
    dark: Object.freeze({
      outline: 'rgba(244, 162, 132, 0.68)',
      ring: 'rgba(244, 162, 132, 0.29)',
      hoverBg: 'rgba(244, 162, 132, 0.16)',
      activeBg: 'rgba(244, 162, 132, 0.24)',
      toastBg: 'rgba(40, 34, 30, 0.95)',
      toastText: '#f5ede5',
      toastBorder: 'rgba(244, 162, 132, 0.52)',
      toastShadow: 'rgba(15, 12, 10, 0.44)'
    })
  }),
  generic: Object.freeze({
    light: Object.freeze({
      outline: 'rgba(37, 99, 235, 0.5)',
      ring: 'rgba(37, 99, 235, 0.18)',
      hoverBg: 'rgba(191, 219, 254, 0.46)',
      activeBg: 'rgba(147, 197, 253, 0.52)',
      toastBg: 'rgba(248, 250, 252, 0.97)',
      toastText: '#1e293b',
      toastBorder: 'rgba(37, 99, 235, 0.28)',
      toastShadow: 'rgba(30, 41, 59, 0.18)'
    }),
    dark: Object.freeze({
      outline: 'rgba(147, 197, 253, 0.68)',
      ring: 'rgba(147, 197, 253, 0.24)',
      hoverBg: 'rgba(147, 197, 253, 0.16)',
      activeBg: 'rgba(147, 197, 253, 0.24)',
      toastBg: 'rgba(15, 23, 42, 0.95)',
      toastText: '#e2e8f0',
      toastBorder: 'rgba(147, 197, 253, 0.42)',
      toastShadow: 'rgba(2, 6, 23, 0.46)'
    })
  })
});

function normalizeThemeSite(site: unknown): SiteId | 'generic' {
  if (typeof site !== 'string') {
    return 'generic';
  }
  return THEME_SITE_KEYS.has(site as SiteId | 'generic') ? (site as SiteId | 'generic') : 'generic';
}

function normalizeThemeScheme(scheme: unknown): ColorScheme {
  return scheme === 'dark' ? 'dark' : 'light';
}

function createNavTheme(site: SiteId | 'generic', scheme: ColorScheme): Record<string, string> {
  const safeSite = normalizeThemeSite(site);
  const safeScheme = normalizeThemeScheme(scheme);
  const baseTheme = safeScheme === 'dark' ? NAV_DARK_OVERRIDES : NAV_LIGHT_BASE;
  const siteOverrides = safeScheme === 'dark' ? {} : NAV_LIGHT_SITE_OVERRIDES[safeSite] || {};
  return {
    ...(safeScheme === 'dark' ? NAV_LIGHT_BASE : {}),
    ...baseTheme,
    ...siteOverrides
  };
}

function createFormulaTheme(site: SiteId | 'generic', scheme: ColorScheme): Record<string, string> {
  const safeSite = normalizeThemeSite(site);
  const safeScheme = normalizeThemeScheme(scheme);
  const siteTheme = FORMULA_THEME_BY_SITE[safeSite] || FORMULA_THEME_BY_SITE.generic;
  return siteTheme[safeScheme] || FORMULA_THEME_BY_SITE.generic[safeScheme];
}

function createUiKitTheme(site: SiteId | 'generic', scheme: ColorScheme): Record<string, string> {
  const nav = createNavTheme(site, scheme);
  const formula = createFormulaTheme(site, scheme);
  const isDark = scheme === 'dark';
  const panelBg = nav['--nav-surface'] || nav['--nav-bg'] || (isDark ? '#181b1f' : '#f9f9f9');
  const border = nav['--nav-border'] || (isDark ? '#2f343a' : '#efefef');
  const text = nav['--nav-text'] || (isDark ? '#e7eaee' : '#1f1f1f');
  const muted = nav['--nav-muted'] || (isDark ? '#a4adb7' : '#666666');
  const hover = nav['--nav-item-hover-bg'] || formula.hoverBg || (isDark ? '#242a31' : '#efefef');
  const itemBg = nav['--nav-item-bg'] || nav['--nav-button-bg'] || panelBg;
  const activeBg = nav['--nav-item-active-bg'] || formula.activeBg || hover;
  const activeBorder = nav['--nav-item-active-border'] || border;
  const activeText =
    nav['--nav-item-active-text'] || nav['--nav-item-active-color'] || nav['--nav-accent-strong'] || text;
  const shadow =
    nav['--nav-shadow'] || (isDark ? '0 20px 48px rgba(3, 8, 17, 0.58)' : '0 18px 42px rgba(23, 21, 16, 0.16)');
  const controlBg = nav['--nav-button-bg'] || itemBg;
  const controlHoverBg = nav['--nav-hover'] || hover;
  const controlHoverBorder = nav['--nav-control-hover-border'] || nav['--nav-item-hover-border'] || activeBorder;
  const controlHoverText = nav['--nav-control-hover-text'] || text;
  const controlActiveBg = nav['--nav-control-active-bg'] || activeBg;
  const controlActiveBorder = nav['--nav-control-active-border'] || activeBorder;
  const controlActiveText = nav['--nav-control-active-text'] || activeText;
  const focusOutline = formula.outline || activeBorder;
  const focusRing = formula.ring || (isDark ? 'rgba(211, 217, 224, 0.18)' : 'rgba(31, 31, 31, 0.08)');
  const itemShadow = nav['--nav-item-active-shadow'] || (isDark ? 'rgba(10, 12, 15, 0.32)' : 'rgba(0, 0, 0, 0.06)');
  const scrollbarTrack = nav['--nav-scrollbar-track'] || 'transparent';
  const scrollbarThumb =
    nav['--nav-scrollbar-thumb'] || (isDark ? 'rgba(232, 236, 241, 0.34)' : 'rgba(31, 31, 31, 0.16)');
  const scrollbarThumbHover =
    nav['--nav-scrollbar-thumb-hover'] || (isDark ? 'rgba(232, 236, 241, 0.48)' : 'rgba(31, 31, 31, 0.24)');

  return {
    '--ui-font-family': '"Avenir Next", "SF Pro Text", "Segoe UI", "Helvetica Neue", sans-serif',
    '--ui-page-bg': panelBg,
    '--ui-panel-bg': panelBg,
    '--ui-panel-border': border,
    '--ui-panel-shadow': shadow,
    '--ui-divider': border,
    '--ui-text': text,
    '--ui-muted': muted,
    '--ui-accent': activeText,
    '--ui-accent-strong': text,
    '--ui-surface': itemBg,
    '--ui-surface-hover': hover,
    '--ui-surface-hover-border': nav['--nav-item-hover-border'] || activeBorder,
    '--ui-surface-shadow': itemShadow,
    '--ui-control-bg': controlBg,
    '--ui-control-border': border,
    '--ui-control-hover-bg': controlHoverBg,
    '--ui-control-hover-border': controlHoverBorder,
    '--ui-control-hover-text': controlHoverText,
    '--ui-control-active-bg': controlActiveBg,
    '--ui-control-active-border': controlActiveBorder,
    '--ui-control-active-text': controlActiveText,
    '--ui-primary-bg': activeBg,
    '--ui-primary-border': activeBorder,
    '--ui-primary-text': activeText,
    '--ui-pill-bg': controlBg,
    '--ui-pill-border': border,
    '--ui-pill-text': muted,
    '--ui-danger': isDark ? '#fda29b' : '#b42318',
    '--ui-danger-soft': isDark ? 'rgba(253, 162, 155, 0.12)' : 'rgba(180, 35, 24, 0.08)',
    '--ui-focus-outline': focusOutline,
    '--ui-focus-ring': focusRing,
    '--ui-scrollbar-track': scrollbarTrack,
    '--ui-scrollbar-thumb': scrollbarThumb,
    '--ui-scrollbar-thumb-hover': scrollbarThumbHover,
    '--ui-radius-sm': '10px',
    '--ui-radius-md': '12px',
    '--ui-radius-lg': '16px',
    '--ui-ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
    '--ui-ease-out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
    '--ui-ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
    '--ui-feedback-duration': '160ms',
    '--ui-surface-duration': '260ms'
  };
}

export const UI_THEME_PRESETS: Record<SiteId | 'generic', Record<ColorScheme, UiThemePreset>> = Object.freeze({
  chatgpt: Object.freeze({
    light: Object.freeze({
      nav: createNavTheme('chatgpt', 'light'),
      kit: createUiKitTheme('chatgpt', 'light'),
      formula: createFormulaTheme('chatgpt', 'light')
    }),
    dark: Object.freeze({
      nav: createNavTheme('chatgpt', 'dark'),
      kit: createUiKitTheme('chatgpt', 'dark'),
      formula: createFormulaTheme('chatgpt', 'dark')
    })
  }),
  gemini: Object.freeze({
    light: Object.freeze({
      nav: createNavTheme('gemini', 'light'),
      kit: createUiKitTheme('gemini', 'light'),
      formula: createFormulaTheme('gemini', 'light')
    }),
    dark: Object.freeze({
      nav: createNavTheme('gemini', 'dark'),
      kit: createUiKitTheme('gemini', 'dark'),
      formula: createFormulaTheme('gemini', 'dark')
    })
  }),
  claude: Object.freeze({
    light: Object.freeze({
      nav: createNavTheme('claude', 'light'),
      kit: createUiKitTheme('claude', 'light'),
      formula: createFormulaTheme('claude', 'light')
    }),
    dark: Object.freeze({
      nav: createNavTheme('claude', 'dark'),
      kit: createUiKitTheme('claude', 'dark'),
      formula: createFormulaTheme('claude', 'dark')
    })
  }),
  generic: Object.freeze({
    light: Object.freeze({
      nav: createNavTheme('generic', 'light'),
      kit: createUiKitTheme('generic', 'light'),
      formula: createFormulaTheme('generic', 'light')
    }),
    dark: Object.freeze({
      nav: createNavTheme('generic', 'dark'),
      kit: createUiKitTheme('generic', 'dark'),
      formula: createFormulaTheme('generic', 'dark')
    })
  })
});

export const UI_NAV_THEME_VAR_KEYS = Object.freeze(Object.keys(NAV_LIGHT_BASE));
export const UI_KIT_THEME_VAR_KEYS = Object.freeze(Object.keys(createUiKitTheme('generic', 'light')));

export function getUiThemePreset(site: unknown, scheme: unknown): UiThemePreset {
  const safeSite = normalizeThemeSite(site);
  const safeScheme = normalizeThemeScheme(scheme);
  const sitePreset = UI_THEME_PRESETS[safeSite] || UI_THEME_PRESETS.generic;
  return sitePreset[safeScheme] || sitePreset.light;
}

export function buildFormulaThemeConfig(): {
  presets: Record<string, { light: Record<string, string>; dark: Record<string, string> }>;
  darkSelectors: Record<string, string>;
} {
  const presets: Record<string, { light: Record<string, string>; dark: Record<string, string> }> = {};
  Object.keys(UI_THEME_PRESETS).forEach((site) => {
    const sitePreset = UI_THEME_PRESETS[site as SiteId | 'generic'];
    presets[site] = {
      light: sitePreset.light.formula || {},
      dark: sitePreset.dark.formula || {}
    };
  });
  return {
    presets,
    darkSelectors: UI_THEME_DARK_SELECTORS
  };
}

export function replaceCssVars(
  root: HTMLElement,
  nextVars: Record<string, string>,
  knownKeys: readonly string[] = Object.keys(nextVars)
): void {
  knownKeys.forEach((key) => {
    root.style.removeProperty(key);
  });
  Object.keys(nextVars).forEach((key) => {
    root.style.setProperty(key, nextVars[key]);
  });
}
