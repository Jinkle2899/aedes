export default {
  type: "text",
  label: "Text",
  hint: "Heading + paragraph",
  category: "text",
  aliases: ["paragraph", "copy", "body", "article", "heading"],
  dna: {
    grammar: "body",
    after: ["hero", "image", "gallery", "section"],
    pop: 0.8,
  },
  defaults: {
    heading: "A section heading",
    body: "Use this space to tell your story — what you make, who it is for, and what makes it different.",
  },
  fields: [
    {
      control: "text",
      key: "heading",
      label: "Heading",
    },
    {
      control: "textarea",
      key: "body",
      label: "Body",
      rows: 5,
    },
  ],
}
