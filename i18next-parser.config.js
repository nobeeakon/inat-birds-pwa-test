export default {
  locales: ["en", "es"],
  output: "src/locales/$LOCALE.json",
  input: ["src/**/*.{ts,tsx}"],
  sort: true,
  keySeparator: false,
  namespaceSeparator: false,
  createOldCatalogs: false,
  defaultValue: (locale, namespace, key) => key,
  keepRemoved: false,
  useKeysAsDefaultValue: true,
  verbose: false,
};
