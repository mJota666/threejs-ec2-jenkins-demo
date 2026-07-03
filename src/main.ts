import './styles.css';

const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-card]'));
const maxTilt = 8;

const setTilt = (card: HTMLElement, clientX: number, clientY: number) => {
  const rect = card.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  const rotateY = (x - 0.5) * maxTilt * 2;
  const rotateX = (0.5 - y) * maxTilt * 2;

  card.style.setProperty('--rotate-x', `${rotateX.toFixed(2)}deg`);
  card.style.setProperty('--rotate-y', `${rotateY.toFixed(2)}deg`);
  card.style.setProperty('--shine-x', `${(x * 100).toFixed(1)}%`);
  card.style.setProperty('--shine-y', `${(y * 100).toFixed(1)}%`);
  card.dataset.active = 'true';
};

cards.forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    setTilt(card, event.clientX, event.clientY);
  });

  card.addEventListener('pointerleave', () => {
    card.dataset.active = 'leaving';
    card.style.setProperty('--rotate-x', '0deg');
    card.style.setProperty('--rotate-y', '0deg');
    card.style.setProperty('--shine-x', '50%');
    card.style.setProperty('--shine-y', '18%');
  });

  card.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'transform' && card.dataset.active === 'leaving') {
      card.dataset.active = 'false';
    }
  });
});
