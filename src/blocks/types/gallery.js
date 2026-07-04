export default {
  type: "gallery",
  label: "Gallery",
  hint: "Three-up image grid",
  category: "media",
  aliases: ["portfolio", "grid", "photos", "showcase", "masonry"],
  dna: {
    grammar: "body",
    after: ["hero", "text", "features"],
    pop: 0.6,
    kinds: ["Portfolio", "Studio", "Boutique", "Café & food"],
  },
  defaults: {
    caption: "Selected work",
  },
}
