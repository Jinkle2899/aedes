export default {
  type: "cta",
  label: "Call to action",
  hint: "Closing pitch + button",
  category: "marketing",
  aliases: ["call to action", "button section", "signup", "convert"],
  dna: {
    grammar: "conversion",
    after: ["features", "stats", "quote", "accordion", "form", "gallery", "tabs"],
    pop: 0.75,
  },
  defaults: {
    heading: "Ready when you are.",
    button: "Start now",
  },
  fields: [
    {
      control: "text",
      key: "heading",
      label: "Heading",
    },
    {
      control: "button",
    },
  ],
}
