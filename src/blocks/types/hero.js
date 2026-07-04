export default {
  type: "hero",
  label: "Hero",
  hint: "Big opening statement",
  category: "marketing",
  aliases: ["banner", "headline", "jumbotron", "intro", "above the fold"],
  dna: {
    grammar: "opening",
    after: ["navbar"],
    pop: 0.9,
    singleton: true,
  },
  defaults: {
    heading: "Make something people remember",
    sub: "One clear sentence about what you do and why it matters.",
    button: "Get started",
    align: "center",
    tone: "light",
  },
}
