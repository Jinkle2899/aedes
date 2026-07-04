export default {
  type: "navbar",
  label: "Navbar",
  hint: "Brand + links up top",
  category: "navigation",
  aliases: ["nav", "menu", "header", "navigation", "top bar"],
  dna: {
    grammar: "opening",
    after: [],
    pop: 0.7,
    singleton: true,
  },
  defaults: {
    brand: "Your brand",
    links: ["Work", "About", "Contact"],
    button: "Say hello",
  },
}
