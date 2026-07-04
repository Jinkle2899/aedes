export default {
  type: "accordion",
  label: "Accordion",
  hint: "Expandable Q&A",
  category: "text",
  aliases: ["faq", "questions", "expandable", "collapse", "q&a"],
  dna: {
    grammar: "conversion",
    after: ["quote", "stats", "text", "features"],
    pop: 0.5,
  },
  defaults: {
    items: [
      {
        q: "How does it work?",
        a: "Simply. You click, it does the thing, everyone is happy.",
      },
      {
        q: "What does it cost?",
        a: "Less than you expect. See the pricing section for details.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes — no contracts, no exit interviews.",
      },
    ],
  },
}
