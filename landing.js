document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".book-card").forEach(card => {
    const link = card.dataset.link;
    if (!link) return;

    card.addEventListener("click", () => {
      window.location.href = link;
    });
  });
});
