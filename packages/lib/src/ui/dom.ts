import { isString } from '~/misc/types';

export const getInputEventValue = (e: InputEvent): string => {
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
