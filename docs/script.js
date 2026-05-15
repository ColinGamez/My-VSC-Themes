const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".theme-card");
const sections = document.querySelectorAll(".pack-section");
const search = document.querySelector("#theme-search");
const count = document.querySelector("#theme-count");
const copyButtons = document.querySelectorAll(".copy-theme");
let activeFilter = "all";

function applyFilters() {
  const query = search.value.trim().toLowerCase();
  let visibleCount = 0;

  for (const card of cards) {
    const isTone = activeFilter === "dark" || activeFilter === "light";
    const matchesFilter = activeFilter === "all" || (isTone ? card.dataset.tone === activeFilter : card.dataset.pack === activeFilter);
    const matchesSearch = query.length === 0 || card.dataset.search.includes(query);
    const isVisible = matchesFilter && matchesSearch;
    card.classList.toggle("is-hidden", !isVisible);

    if (isVisible) {
      visibleCount += 1;
    }
  }

  for (const section of sections) {
    const hasVisibleCard = [...section.querySelectorAll(".theme-card")].some((card) => !card.classList.contains("is-hidden"));
    section.classList.toggle("is-hidden", !hasVisibleCard);
  }

  count.textContent = visibleCount === 1 ? "1 theme" : `${visibleCount} themes`;
}

for (const filter of filters) {
  filter.addEventListener("click", () => {
    activeFilter = filter.dataset.filter;

    for (const item of filters) {
      item.classList.toggle("active", item === filter);
    }

    applyFilters();
  });
}

search.addEventListener("input", applyFilters);

for (const button of copyButtons) {
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(button.dataset.theme);
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = "Copy name";
    }, 1200);
  });
}
