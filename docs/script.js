const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".theme-card");

for (const filter of filters) {
  filter.addEventListener("click", () => {
    const value = filter.dataset.filter;

    for (const item of filters) {
      item.classList.toggle("active", item === filter);
    }

    for (const card of cards) {
      card.classList.toggle("is-hidden", value !== "all" && card.dataset.tone !== value);
    }
  });
}
