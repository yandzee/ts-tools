import { isString } from '~/misc/types';

export const getEventInputValue = (e: InputEvent): string => {
  const target = e.target;
  if (target == null || !(target instanceof Element)) return '';

  if (target instanceof HTMLInputElement) {
    return target.value;
  }

  const val = (target as any).value;
  if (isString(val)) return val;

  if (target instanceof HTMLElement) {
    return target.textContent || '';
  }

  return '';
};

export const isMultilineTextOperation = (e: InputEvent): boolean => {
  return e.inputType === 'insertLineBreak';
};

export const getSelectionPosition = (
  elem: Element | EventTarget | null | undefined,
): Range | null => {
  const selection = window.getSelection();
  if (selection == null) return null;

  const range = selection.getRangeAt(0);
  if (range == null) return null;

  if (elem != null && elem instanceof Element) {
    if (!elem.contains(range.commonAncestorContainer)) return null;
  }

  const newRange = document.createRange();
  newRange.setEnd(range.commonAncestorContainer, range.endOffset);
  newRange.collapse();

  return newRange;
};

export const setRangeSelection = (range: Range): boolean => {
  const sel = window.getSelection();
  if (sel == null) return false;

  sel.removeAllRanges();
  sel.addRange(range);

  return true;
};

export const setCursorToEndOf = (elem: Element | EventTarget | null | undefined) => {
  if (elem == null || !(elem instanceof Element)) return;
  if (document.createRange == null) throw new Error('createRange is undefined');

  const range = document.createRange();
  range.selectNodeContents(elem);
  range.collapse();

  const selection = window.getSelection();
  if (selection == null) return;
  selection.removeAllRanges();
  selection.addRange(range);
};

export const isEnterKeyPressed = (e: KeyboardEvent): boolean => {
  return e.key === 'Enter' || e.key === 'enter';
};

export const watchAttributes = (
  elem: Element,
  attrs: string[],
  callback: (attr: string, newValue: string | null, oldValue: string | null) => void,
): (() => void) => {
  const oldValues = new Map<string, string | null>();

  for (const attr of attrs) {
    oldValues.set(attr, elem.getAttribute(attr));
  }

  const observer = new MutationObserver((mutations) => {
    for (const mut of mutations) {
      const attr = mut.attributeName;
      if (mut.type !== 'attributes' || !attr) continue;

      if (!oldValues.has(attr)) continue;

      const oldValue = oldValues.get(attr) ?? null;
      const newValue = elem.getAttribute(attr);

      oldValues.set(attr, newValue);
      callback(attr, oldValue, newValue);
    }
  });

  observer.observe(elem, {
    attributes: true,
    attributeFilter: attrs,
  });

  return () => observer.disconnect();
};
