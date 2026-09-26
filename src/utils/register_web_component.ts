export const register_web_component = (WebComponent: CustomElementConstructor & { WC_IS: string }) => {
  customElements.define(WebComponent.WC_IS, WebComponent);
};
