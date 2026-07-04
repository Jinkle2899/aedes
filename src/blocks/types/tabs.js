export default {
  type: "tabs",
  label: "Tabs",
  hint: "Switchable panels",
  category: "text",
  aliases: ["switcher", "panels", "toggle views"],
  dna: {
    grammar: "body",
    after: ["text", "features"],
    pop: 0.4,
    kinds: ["SaaS"],
  },
  defaults: {
    items: [
      {
        t: "Overview",
        d: "What this is and why it matters — the short version.",
      },
      {
        t: "Details",
        d: "The specifics, for people who read the fine print.",
      },
      {
        t: "FAQ",
        d: "Answers to the questions everyone asks first.",
      },
    ],
  },
}
