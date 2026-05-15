const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".theme-card");

for (const filter of filters) {
  filter.addEventListener("click", () => {
    const value = filter.dataset.filter;

    for (const item of filters) {
      item.classList.toggle("active", item === filter);
    }

    for (const card of cards) {
      const isTone = value === "dark" || value === "light";
      const isVisible = value === "all" || (isTone ? card.dataset.tone === value : card.dataset.pack === value);
      card.classList.toggle("is-hidden", !isVisible);
    }
  });
}
