import { mentorCards } from './mentors';
import './styles.css';

const stage = document.querySelector<HTMLElement>('#card-stage');
const maxTilt = 8;

if (!stage) {
  throw new Error('Card stage was not found.');
}

const renderCards = () => {
  stage.replaceChildren(
    ...mentorCards.map((mentor) => {
      const card = document.createElement('article');
      card.className = `player-card card-${mentor.theme}`;
      card.dataset.card = mentor.id;

      const stats = mentor.stats
        .map((stat) => `<span><b>${stat.value}</b> ${stat.label}</span>`)
        .join('');

      card.innerHTML = `
        <div class="card-inner">
          <div class="energy-ring"></div>
          <div class="card-meta">
            <strong>${mentor.rating}</strong>
            <span>${mentor.role}</span>
          </div>
          <div class="club-mark">MENTOR</div>
          <div class="player-frame">
            <div class="player-photo" style="--mentor-image: url('${mentor.image}')"></div>
          </div>
          <div class="player-name">${mentor.name}</div>
          <div class="stat-grid">${stats}</div>
        </div>
      `;

      return card;
    }),
  );
};

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

const bindCardInteractions = () => {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-card]'));

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
};

renderCards();
bindCardInteractions();
