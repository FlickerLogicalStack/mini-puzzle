type ElementMap = HTMLElementTagNameMap & Pick<SVGElementTagNameMap, 'svg'>;

type PropsAddition<TTag extends keyof ElementMap> = {
  c?: string;
  patch?: (element: ElementMap[TTag]) => void;
  data?: Record<string, string | number | boolean>;
};

export type HTMLChildren = (Node | string | number | boolean | null)[];

export const e = <TTag extends keyof ElementMap>(
  tag: TTag,
  props?: (Partial<ElementMap[TTag]> & PropsAddition<TTag>) | HTMLChildren,
  children?: HTMLChildren,
): ElementMap[TTag] => {
  if (Array.isArray(props)) {
    children = props;
    props = undefined;
  }

  const is_svg = tag === 'svg';

  const element = (
    is_svg ? document.createElementNS('http://www.w3.org/2000/svg', 'svg') : document.createElement(tag)
  ) as ElementMap[TTag];

  if (props) {
    for (const entry of Object.entries(props)) {
      let key = entry[0];
      const value = entry[1] as unknown;

      if (key === 'c') {
        key = 'className';
      }

      if (key === 'patch') {
        if (typeof value === 'function') {
          (value as (element: ElementMap[TTag]) => void)(element);
        }
      } else if (key === 'data') {
        if (value) {
          for (const [data_key, data_value] of Object.entries(value as Record<string, unknown>)) {
            element.dataset[data_key] = String(data_value);
          }
        }
      } else if (!is_svg) {
        // @ts-expect-error dynamic property assignment
        element[key] = value;
      } else {
        element.setAttribute(key, String(value));
      }
    }
  }

  if (children && children.length) {
    // @ts-expect-error children typing across element kinds
    element.append(...children);
  }

  return element;
};

type Locked<TTag extends keyof ElementMap> = (
  props?: (Partial<ElementMap[TTag]> & PropsAddition<TTag>) | HTMLChildren,
  children?: HTMLChildren,
) => ElementMap[TTag];

e.a = ((props, children) => e('a', props, children)) as Locked<'a'>;
e.div = ((props, children) => e('div', props, children)) as Locked<'div'>;
e.main = ((props, children) => e('main', props, children)) as Locked<'main'>;
e.span = ((props, children) => e('span', props, children)) as Locked<'span'>;
e.hr = ((props, children) => e('hr', props, children)) as Locked<'hr'>;
e.button = ((props, children) => e('button', props, children)) as Locked<'button'>;
e.input = ((props, children) => e('input', props, children)) as Locked<'input'>;
e.select = ((props, children) => e('select', props, children)) as Locked<'select'>;
e.option = ((props, children) => e('option', props, children)) as Locked<'option'>;
e.textarea = ((props, children) => e('textarea', props, children)) as Locked<'textarea'>;
e.legend = ((props, children) => e('legend', props, children)) as Locked<'legend'>;
e.img = ((props, children) => e('img', props, children)) as Locked<'img'>;

/** Ids available in the `#__SVGS__` sprite inside `index.html`. */
export type Icon = 'menu' | 'image';

// Same pattern as jopa-player: icons live in an inline SVG sprite and are referenced with <use>.
e.icon = ((icon: Icon, width: number, height: number = width) =>
  e('svg', {
    patch: svg => {
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = `<use href="#i-${icon}"></use>`;
    },
  })) as (icon: Icon, width: number, height?: number) => SVGSVGElement;
