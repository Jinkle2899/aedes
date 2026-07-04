export default {
  type: "form",
  label: "Contact form",
  hint: "Name, email, message",
  category: "forms",
  aliases: ["contact", "email", "message", "inquiry", "lead"],
  dna: {
    grammar: "conversion",
    after: ["quote", "accordion", "stats", "text", "cta"],
    pop: 0.6,
    kinds: ["Café & food", "SaaS", "Agency"],
  },
  defaults: {
    heading: "Get in touch",
    sub: "Tell us what you're thinking — we reply within a day.",
    button: "Send message",
  },
  fields: [
    {
      control: "text",
      key: "heading",
      label: "Heading",
    },
    {
      control: "textarea",
      key: "sub",
      label: "Subheading",
      rows: 3,
    },
    {
      control: "button",
    },
  ],
}
