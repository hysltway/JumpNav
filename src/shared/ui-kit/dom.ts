const SVG_NS = 'http://www.w3.org/2000/svg';

const ICON_MARKUP = Object.freeze({
  prompt:
    '<path d="M4.75 3.25h6.5a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1Z" /><path d="M6 6h4.5" /><path d="M6 8.25h4.5" /><path d="M6 10.5h3" />',
  plus: '<path d="M8 3.25v9.5M3.25 8h9.5" />',
  close: '<path d="M4.25 4.25l7.5 7.5M11.75 4.25l-7.5 7.5" />',
  search: '<circle cx="7" cy="7" r="3.75" /><path d="M10.25 10.25l2.5 2.5" />',
  edit:
    '<path d="M3.75 11.75 4.2 9.4l5.65-5.65 1.9 1.9-5.65 5.65-2.35.45Z" /><path d="M8.95 4.65 10.85 6.55" /><path d="M10.2 3.3l.85-.85a1 1 0 0 1 1.4 0l.35.35a1 1 0 0 1 0 1.4l-.85.85" />',
  copy:
    '<rect x="5.25" y="5.25" width="6.5" height="6.5" rx="1.5" /><path d="M4.75 9.5h-.5A1.25 1.25 0 0 1 3 8.25v-4A1.25 1.25 0 0 1 4.25 3h4A1.25 1.25 0 0 1 9.5 4.25v.5" />',
  trash:
    '<path d="M3.75 5h8.5" /><path d="M6.5 5V4a.75.75 0 0 1 .75-.75h1.5A.75.75 0 0 1 9.5 4v1" /><path d="M5.5 6.25l.4 5.1a1 1 0 0 0 1 .9h2.2a1 1 0 0 0 1-.9l.4-5.1" />'
});

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function createSvgIcon(iconName: keyof typeof ICON_MARKUP | string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.6');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = ICON_MARKUP[iconName as keyof typeof ICON_MARKUP] || ICON_MARKUP.plus;
  return svg;
}

export function createButton(
  text: string,
  options: {
    action?: string;
    className?: string;
    tone?: string;
    type?: 'button' | 'submit' | 'reset';
    ariaLabel?: string;
  } = {}
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = options.type || 'button';
  button.className = joinClassNames('ui-button', options.className);
  if (options.action) {
    button.dataset.action = options.action;
  }
  if (options.tone) {
    button.dataset.tone = options.tone;
  }
  if (options.ariaLabel) {
    button.setAttribute('aria-label', options.ariaLabel);
    button.title = options.ariaLabel;
  }

  const label = document.createElement('span');
  label.className = 'ui-button-label';
  label.textContent = text;
  button.appendChild(label);
  return button;
}

export function createIconButton(
  action: string,
  label: string,
  iconName: keyof typeof ICON_MARKUP | string,
  options: {
    className?: string;
    tone?: string;
    type?: 'button' | 'submit' | 'reset';
  } = {}
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = options.type || 'button';
  button.className = joinClassNames('ui-icon-button', options.className);
  button.dataset.action = action;
  button.setAttribute('aria-label', label);
  button.title = label;
  if (options.tone) {
    button.dataset.tone = options.tone;
  }
  button.appendChild(createSvgIcon(iconName));
  return button;
}

export function createField(
  labelText: string,
  options: {
    fieldClassName?: string;
    labelClassName?: string;
  } = {}
): { field: HTMLLabelElement; label: HTMLSpanElement } {
  const field = document.createElement('label');
  field.className = joinClassNames('ui-field', options.fieldClassName);

  const label = document.createElement('span');
  label.className = joinClassNames('ui-label', options.labelClassName);
  label.textContent = labelText;
  field.appendChild(label);
  return { field, label };
}

export function createEmptyState(
  titleText: string,
  bodyText = '',
  options: {
    className?: string;
    titleClassName?: string;
    textClassName?: string;
  } = {}
): HTMLDivElement {
  const empty = document.createElement('div');
  empty.className = joinClassNames('ui-empty', options.className);

  const title = document.createElement('div');
  title.className = joinClassNames('ui-empty-title', options.titleClassName);
  title.textContent = titleText;

  const text = document.createElement('div');
  text.className = joinClassNames('ui-empty-text', options.textClassName);
  text.textContent = bodyText;

  empty.appendChild(title);
  if (bodyText) {
    empty.appendChild(text);
  }
  return empty;
}
