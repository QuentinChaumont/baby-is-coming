/** Kiki's games: bath, ears, grimaces, yawns, rattle (see kiki.styles.ts
 * for her everyday motion). */
export const KIKI_PLAY_STYLES = `
  /* — Bath: spots wash out with the scrubbing, foam builds up. — */
  .kiki__spot {
    fill-opacity: var(--kiki-spots, 1);
    transition: fill-opacity 500ms ease;
  }
  /* Scrubbing and petting are finger strokes on phones: strokes that start
     on her are hers, not a page scroll. */
  :host(.kiki-host--interactive) .kiki__body,
  :host(.kiki-host--interactive) .kiki__head {
    cursor: pointer;
    touch-action: none;
  }
  .kiki__foam circle {
    transform-box: fill-box;
    transform-origin: 50% 50%;
    animation: kiki-foam 900ms ease-in-out infinite alternate;
  }
  .kiki__foam circle:nth-child(even) {
    animation-delay: 300ms;
  }
  @keyframes kiki-foam {
    to {
      transform: scale(1.25);
    }
  }
  .kiki--bath .kiki__all {
    animation: kiki-wiggle 260ms ease-in-out infinite;
  }
  .kiki--shakeoff .kiki__all {
    animation: kiki-shakeoff 110ms linear 8;
  }
  @keyframes kiki-shakeoff {
    25% {
      transform: rotate(-5deg) translateX(-3px);
    }
    75% {
      transform: rotate(5deg) translateX(3px);
    }
  }
  .kiki__drop {
    transform-box: fill-box;
    animation: kiki-drop 900ms cubic-bezier(0.23, 1, 0.32, 1) both;
  }
  @keyframes kiki-drop {
    from {
      transform: translate(0, 0);
      opacity: 1;
    }
    to {
      transform: translate(var(--dx), var(--dy));
      opacity: 0;
    }
  }

  /* — Ears: they stretch while pulled and boing back when let go. — */
  .kiki__ear {
    transform-box: fill-box;
    transition: transform 520ms cubic-bezier(0.34, 2.2, 0.5, 1);
  }
  .kiki__ear--left {
    transform-origin: 100% 50%;
  }
  .kiki__ear--right {
    transform-origin: 0% 50%;
  }
  .kiki__ear--pulled {
    transition: none;
  }
  :host(.kiki-host--interactive) .kiki__ear {
    cursor: grab;
    touch-action: none;
  }

  /* — Grimaces. — */
  .kiki--cross .kiki__head {
    animation: kiki-dizzy 500ms ease-in-out 3;
  }
  @keyframes kiki-dizzy {
    25% {
      transform: rotate(-5deg);
    }
    75% {
      transform: rotate(5deg);
    }
  }
  .kiki__tongue {
    transform-box: fill-box;
    transform-origin: 30% 0%;
    animation: kiki-tongue 260ms ease-in-out infinite alternate;
  }
  @keyframes kiki-tongue {
    from {
      transform: scaleY(0.7) rotate(-6deg);
    }
    to {
      transform: scaleY(1.05) rotate(6deg);
    }
  }
  .kiki--lick .kiki__head {
    transform: translateY(-3px) rotate(-3deg);
  }

  /* — Yawn: mouth wide open, the pacifier lifts with her jaw. — */
  .kiki__yawn {
    transform-box: fill-box;
    transform-origin: 50% 0%;
    animation: kiki-yawn 2.2s ease-in-out both;
  }
  @keyframes kiki-yawn {
    0%, 100% {
      transform: scaleY(0.2);
    }
    30%, 70% {
      transform: scaleY(1);
    }
  }
  .kiki__pacifier--yawn {
    animation: kiki-yawn-pacifier 2.2s ease-in-out both;
  }
  @keyframes kiki-yawn-pacifier {
    30%, 70% {
      transform: translateY(12px);
    }
  }
  .kiki--yawn .kiki__head {
    transform: rotate(-4deg) translateY(-4px);
    transition-duration: 700ms;
  }
  .kiki--yawn .kiki__body {
    animation: kiki-sigh 2.2s ease-in-out 1;
  }
  .kiki--smug .kiki__head {
    transform: rotate(6deg);
  }

  /* — Rattle: shaken in her raised hoof, head bobbing along. — */
  .kiki--rattle .kiki__head {
    animation: kiki-bob 440ms ease-in-out infinite;
  }
  @keyframes kiki-bob {
    25% {
      transform: rotate(-4deg);
    }
    75% {
      transform: rotate(4deg);
    }
  }
  .kiki__paw {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: kiki-rattle 150ms ease-in-out infinite alternate;
  }
  @keyframes kiki-rattle {
    from {
      transform: rotate(-12deg);
    }
    to {
      transform: rotate(10deg);
    }
  }
`;
