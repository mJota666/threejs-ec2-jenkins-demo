import './styles.css';

const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-card]'));
const maxTilt = 14;

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
};

cards.forEach((card) => {
  const input = card.querySelector<HTMLInputElement>('[data-image-input]');
  const photo = card.querySelector<HTMLElement>('.player-photo');

  card.addEventListener('pointermove', (event) => {
    setTilt(card, event.clientX, event.clientY);
  });

  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--rotate-x', '0deg');
    card.style.setProperty('--rotate-y', '0deg');
    card.style.setProperty('--shine-x', '50%');
    card.style.setProperty('--shine-y', '20%');
  });

  input?.addEventListener('change', () => {
    const file = input.files?.[0];

    if (!file || !photo) {
      return;
    }

    const reader = new FileReader();

    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        photo.classList.add('has-custom-image');
        photo.style.backgroundImage = `linear-gradient(180deg, rgb(255 255 255 / 0) 0%, rgb(5 8 18 / 0.28) 100%), url("${reader.result}")`;
      }
    });

    reader.readAsDataURL(file);
  });
});
