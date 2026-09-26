// Puzzle needs no preloaded resources: the default image is bundled as an asset and user
// images are picked at runtime. The engine loop still accepts `load_resources`.
export const load_resources = async () => ({});
