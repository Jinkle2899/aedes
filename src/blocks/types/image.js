export default {
  type: "image",
  label: "Image",
  hint: "Media placeholder",
  category: "media",
  aliases: ["photo", "picture", "img", "media"],
  dna: {
    grammar: "body",
    after: ["text", "hero"],
    pop: 0.5,
  },
  defaults: {
    caption: "A caption for this image",
    ratio: "wide",
  },
  fields: [
    {
      control: "text",
      key: "caption",
      label: "Caption",
    },
    {
      control: "seg",
      key: "ratio",
      label: "Ratio",
      options: ["wide", "square"],
    },
  ],
}
