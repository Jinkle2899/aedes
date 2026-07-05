export default {
  type: "section",
  label: "Section",
  hint: "Holds other blocks",
  category: "layout",
  container: true,
  aliases: ["container", "wrapper", "group", "band"],
  dna: {
    grammar: "body",
    after: ["hero", "text", "features"],
    pop: 0.5,
  },
  defaults: {
    tone: "tint",
    pad: "md",
  },
  fields: [
    {
      control: "seg",
      key: "pad",
      label: "Padding",
      options: ["sm", "md", "lg"],
    },
    {
      control: "seg",
      key: "tone",
      label: "Background",
      options: ["light", "tint", "dark"],
    },
  ],
}
