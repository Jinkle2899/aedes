export default {
  type: "rotator",
  label: "Animated text",
  hint: "Cycling headline word",
  category: "text",
  aliases: ["animated", "typewriter", "cycling", "rotating words", "dynamic text"],
  dna: {
    grammar: "body",
    after: ["hero"],
    pop: 0.35,
  },
  defaults: {
    prefix: "We build",
    words: ["websites", "brands", "momentum"],
  },
  fields: [
    {
      control: "text",
      key: "prefix",
      label: "Leading text",
    },
    {
      control: "stringArray",
      key: "words",
      label: "Cycling words",
    },
  ],
}
