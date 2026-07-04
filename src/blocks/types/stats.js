export default {
  type: "stats",
  label: "Stats",
  hint: "Big numbers row",
  category: "marketing",
  aliases: ["numbers", "metrics", "kpi", "counters", "social proof"],
  dna: {
    grammar: "proof",
    after: ["features", "hero", "gallery"],
    pop: 0.6,
    kinds: ["SaaS", "Agency"],
  },
  defaults: {
    items: [
      {
        n: "12k+",
        l: "Happy customers",
      },
      {
        n: "99.9%",
        l: "Uptime",
      },
      {
        n: "4.9★",
        l: "Average rating",
      },
    ],
  },
}
