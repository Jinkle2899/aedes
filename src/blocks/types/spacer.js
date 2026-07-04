export default {
  type: "spacer",
  label: "Spacer",
  hint: "Breathing room",
  category: "layout",
  aliases: ["gap", "space", "padding", "breathing room", "divider"],
  dna: {
    grammar: "utility",
    after: [],
    pop: 0.3,
  },
  defaults: {
    height: 72,
  },
  fields: [
    {
      control: "number",
      key: "height",
      label: "Height (px)",
      min: 16,
      max: 400,
    },
  ],
}
