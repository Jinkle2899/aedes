export default {
  type: "canvas",
  label: "Freeform",
  hint: "Place anything anywhere",
  category: "layout",
  aliases: ["freeform", "free", "absolute", "anywhere", "draw"],
  dna: {
    grammar: "body",
    after: ["hero", "text"],
    pop: 0.45,
  },
  defaults: {
    height: 460,
    elements: [
      {
        id: "t1",
        kind: "text",
        x: 8,
        y: 70,
        w: 55,
        text: "Anything, anywhere.",
        size: 36,
        weight: 600,
        color: "#17171a",
      },
      {
        id: "t2",
        kind: "text",
        x: 8,
        y: 140,
        w: 46,
        text: "Drag to move. Double-click to edit. Pull the corner to resize. Add images of any size.",
        size: 16,
        weight: 400,
        color: "#6b7280",
      },
    ],
  },
}
