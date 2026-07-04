export default {
  type: "countdown",
  label: "Countdown",
  hint: "Ticking timer to a date",
  category: "marketing",
  aliases: ["timer", "launch", "clock", "deadline"],
  dna: {
    grammar: "conversion",
    after: ["hero", "cta"],
    pop: 0.35,
    kinds: ["Boutique"],
  },
  defaults: {
    heading: "Something big is coming",
    target: "",
  },
}
