export default {
  type: "section",
  label: "Section",
  hint: "Holds other blocks",
  category: "layout",
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
}
