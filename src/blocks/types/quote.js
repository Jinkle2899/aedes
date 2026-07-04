export default {
  type: "quote",
  label: "Quote",
  hint: "Testimonial or pull-quote",
  category: "marketing",
  aliases: ["testimonial", "review", "blockquote", "pull quote"],
  dna: {
    grammar: "proof",
    after: ["features", "stats", "gallery", "text"],
    pop: 0.55,
    kinds: ["Studio", "Agency", "Portfolio"],
  },
  defaults: {
    text: "“They made us look like the company we always thought we were.”",
    author: "Alex Rivera",
    role: "Founder, Somewhere Co.",
  },
}
