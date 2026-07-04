export default {
  type: "features",
  label: "Features",
  hint: "Three selling points",
  category: "marketing",
  aliases: ["benefits", "selling points", "usp", "cards"],
  dna: {
    grammar: "body",
    after: ["hero", "text", "rotator"],
    pop: 0.85,
  },
  defaults: {
    items: [
      {
        t: "Fast",
        d: "Loads in a blink, everywhere.",
      },
      {
        t: "Simple",
        d: "No manual required.",
      },
      {
        t: "Yours",
        d: "Your name on it, not ours.",
      },
    ],
  },
}
