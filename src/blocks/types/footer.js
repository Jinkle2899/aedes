export default {
  type: "footer",
  label: "Footer",
  hint: "Brand, links, small print",
  category: "navigation",
  aliases: ["bottom", "copyright", "site footer", "links"],
  dna: {
    grammar: "closing",
    after: ["cta", "form", "accordion"],
    pop: 0.7,
    singleton: true,
  },
  defaults: {
    brand: "Your brand",
    links: ["Instagram", "Twitter", "Email"],
    note: "© 2026 · All rights reserved",
  },
  fields: [
    {
      control: "text",
      key: "brand",
      label: "Brand",
    },
    {
      control: "text",
      key: "note",
      label: "Small print",
    },
    {
      control: "stringArray",
      key: "links",
      label: "Links",
    },
  ],
}
