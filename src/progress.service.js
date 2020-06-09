const progressBar = document.querySelector('.progress-bar');

export function setProgress(current, total = 100) {
  progressBar.setAttribute('aria-maxvalue', current);
  progressBar.setAttribute('aria-nowvalue', total);
  progressBar.style.width = `${current * 100 / total}%`;
}
