/** Kiki's motion, kept apart from the component so each file stays readable. */
export const KIKI_STYLES = `
    :host {
      display: block;
      line-height: 0;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
      -webkit-tap-highlight-color: transparent;
    }
    .kiki__live {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    /* — Always on: breathing, blinking, a lazy tail. — */
    .kiki__all,
    .kiki__head,
    .kiki__body,
    .kiki__tail,
    .kiki__eye,
    .kiki__spot,
    .kiki__heart,
    .kiki__tear,
    .kiki__snot,
    .kiki__zzz text,
    .kiki__bubble,
    .kiki__pacifier {
      transform-box: fill-box;
    }
    .kiki__all {
      transform-origin: 50% 100%;
    }
    .kiki__body {
      transform-origin: 50% 100%;
      animation: kiki-breathe 3.2s ease-in-out infinite;
    }
    @keyframes kiki-breathe {
      50% {
        transform: scale(1.025, 1.035);
      }
    }
    .kiki__tail {
      transform-origin: 0% 0%;
      animation: kiki-tail 2.6s ease-in-out infinite;
    }
    @keyframes kiki-tail {
      50% {
        transform: rotate(-12deg);
      }
    }
    .kiki__head {
      /* The neck joint, at the bottom of the head's box. */
      transform-origin: 50% 94%;
      transform: rotate(var(--kiki-tilt, 0deg));
      transition: transform 260ms cubic-bezier(0.23, 1, 0.32, 1);
    }
    .kiki__look {
      transform: translate(var(--kiki-look-x, 0px), var(--kiki-look-y, 0px));
    }
    .kiki__eye {
      transform-origin: 50% 50%;
      animation: kiki-blink 4.6s infinite;
    }
    .kiki__eye + .kiki__eye {
      animation-delay: 40ms;
    }
    @keyframes kiki-blink {
      0%, 93%, 100% {
        transform: scaleY(1);
      }
      95% {
        transform: scaleY(0.1);
      }
    }
    .kiki__cheeks ellipse {
      fill-opacity: 0.22;
      transition: fill-opacity 400ms ease;
    }

    /* — Interactive affordances. — */
    :host(.kiki-host--interactive) .kiki__pacifier {
      cursor: grab;
      touch-action: none;
      outline: none;
    }
    :host(.kiki-host--interactive) .kiki__pacifier:focus-visible .kiki__hit {
      stroke: var(--app-color-sage-strong, #3f5a3c);
      stroke-width: 3;
      stroke-dasharray: 5 4;
    }
    :host(.kiki-host--interactive) .kiki__body,
    :host(.kiki-host--interactive) .kiki__horns {
      cursor: pointer;
    }
    .kiki--drag .kiki__pacifier--free,
    .kiki__pacifier--free:active {
      cursor: grabbing;
    }
    .kiki__pacifier--falling {
      transition: transform 520ms cubic-bezier(0.55, 0, 1, 0.45);
    }

    /* — Moods. — */
    .kiki--pout .kiki__head {
      animation: kiki-quiver 140ms linear 4;
    }
    @keyframes kiki-quiver {
      50% {
        transform: rotate(1.5deg);
      }
    }
    .kiki--cry .kiki__head {
      animation: kiki-sob 0.6s ease-in-out infinite;
    }
    @keyframes kiki-sob {
      25% {
        transform: rotate(-3deg) translateY(1px);
      }
      75% {
        transform: rotate(3deg) translateY(1px);
      }
    }
    .kiki__tear {
      animation: kiki-tear 0.9s ease-in infinite;
    }
    .kiki__tear--late {
      animation-delay: 0.45s;
    }
    @keyframes kiki-tear {
      0% {
        transform: translate(0, 0) scale(0.6);
        opacity: 0;
      }
      15% {
        opacity: 1;
      }
      100% {
        transform: translate(0, 54px) scale(1.1);
        opacity: 0;
      }
    }
    .kiki--hug .kiki__cheeks ellipse,
    .kiki--relief .kiki__cheeks ellipse,
    .kiki--love .kiki__cheeks ellipse,
    .kiki--giggle .kiki__cheeks ellipse,
    .kiki--joy .kiki__cheeks ellipse {
      fill-opacity: 0.5;
    }
    .kiki--relief .kiki__body {
      animation: kiki-sigh 1.2s ease-in-out 1;
    }
    @keyframes kiki-sigh {
      40% {
        transform: scale(1.06, 1.08);
      }
    }
    .kiki--giggle .kiki__all {
      animation: kiki-wiggle 130ms ease-in-out 8;
    }
    @keyframes kiki-wiggle {
      25% {
        transform: rotate(-3deg);
      }
      75% {
        transform: rotate(3deg);
      }
    }
    .kiki--shake .kiki__head {
      animation: kiki-shake 170ms ease-in-out 4;
    }
    @keyframes kiki-shake {
      25% {
        transform: rotate(-9deg);
      }
      75% {
        transform: rotate(9deg);
      }
    }
    .kiki--love .kiki__head {
      transform: rotate(-7deg);
    }
    /* Cuddling the doudou: a slow rock, head bowed onto it. */
    .kiki--hug .kiki__all {
      animation: kiki-cuddle 1.1s ease-in-out 3;
    }
    @keyframes kiki-cuddle {
      25% {
        transform: rotate(-3deg);
      }
      75% {
        transform: rotate(3deg);
      }
    }
    .kiki--hug .kiki__head {
      transform: rotate(-5deg) translateY(4px);
    }
    .kiki__doudou {
      transform-box: fill-box;
      transform-origin: 50% 100%;
      animation: kiki-doudou-in 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    @keyframes kiki-doudou-in {
      from {
        transform: translateY(30px) scale(0.4);
        opacity: 0;
      }
    }
    .kiki--lost .kiki__head {
      transform: rotate(6deg) translateY(2px);
    }
    .kiki__heart {
      transform-origin: 50% 100%;
      animation: kiki-heart 1.6s ease-out both;
    }
    .kiki__heart:nth-child(2) {
      animation-delay: 0.2s;
    }
    .kiki__heart:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes kiki-heart {
      0% {
        transform: translateY(20px) scale(0.2);
        opacity: 0;
      }
      30% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      100% {
        transform: translateY(-50px) scale(0.9);
        opacity: 0;
      }
    }
    .kiki--sleep .kiki__head {
      transform: rotate(9deg) translateY(4px);
      transition-duration: 1.2s;
    }
    .kiki--sleep .kiki__body {
      animation-duration: 5s;
    }
    .kiki__snot {
      transform-origin: 0% 50%;
      animation: kiki-snot 2.6s ease-in-out infinite;
    }
    @keyframes kiki-snot {
      0%, 100% {
        transform: scale(0.5);
      }
      50% {
        transform: scale(1.7);
      }
    }
    .kiki__zzz text {
      transform-origin: 50% 50%;
      animation: kiki-zzz 2.4s ease-in-out infinite both;
    }
    .kiki__zzz text:nth-child(2) {
      animation-delay: 0.6s;
    }
    .kiki__zzz text:nth-child(3) {
      animation-delay: 1.2s;
    }
    @keyframes kiki-zzz {
      0% {
        opacity: 0;
        transform: translate(-6px, 8px) scale(0.6);
      }
      30%, 70% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translate(8px, -10px) scale(1.05);
      }
    }
    .kiki--startle .kiki__all {
      animation: kiki-startle 460ms cubic-bezier(0.23, 1, 0.32, 1) 1;
    }
    @keyframes kiki-startle {
      35% {
        transform: translateY(-16px) scale(1.03, 0.97);
      }
    }
    .kiki--sneeze .kiki__all {
      animation: kiki-sneeze 700ms cubic-bezier(0.23, 1, 0.32, 1) 1;
    }
    @keyframes kiki-sneeze {
      30% {
        transform: rotate(-4deg) translateY(-4px);
      }
      45% {
        transform: rotate(5deg) scale(1.04);
      }
    }
    .kiki__spot {
      transform-origin: 50% 50%;
    }
    .kiki--sneeze .kiki__spot {
      animation: kiki-spot-fly 2.6s cubic-bezier(0.23, 1, 0.32, 1) 1 both;
    }
    @keyframes kiki-spot-fly {
      10% {
        transform: none;
        opacity: 1;
      }
      35% {
        transform: translate(var(--dx), var(--dy)) rotate(160deg);
        opacity: 0;
      }
      75% {
        transform: scale(0);
        opacity: 0;
      }
      100% {
        transform: none;
        opacity: 1;
      }
    }
    .kiki--joy .kiki__all {
      animation: kiki-dance 520ms ease-in-out 5;
    }
    @keyframes kiki-dance {
      25% {
        transform: rotate(-6deg) translateY(-10px);
      }
      50% {
        transform: translateY(0);
      }
      75% {
        transform: rotate(6deg) translateY(-10px);
      }
    }
    .kiki--joy .kiki__ear--left,
    .kiki--giggle .kiki__ear--left {
      transform-box: fill-box;
      transform-origin: 100% 50%;
      animation: kiki-ear 260ms ease-in-out infinite alternate;
    }
    .kiki--joy .kiki__ear--right,
    .kiki--giggle .kiki__ear--right {
      transform-box: fill-box;
      transform-origin: 0% 50%;
      animation: kiki-ear 260ms ease-in-out infinite alternate-reverse;
    }
    @keyframes kiki-ear {
      to {
        transform: rotate(12deg);
      }
    }
    .kiki__bubble {
      transform-origin: 100% 100%;
      animation: kiki-bubble 260ms cubic-bezier(0.23, 1, 0.32, 1) both;
    }
    @keyframes kiki-bubble {
      from {
        opacity: 0;
        transform: scale(0.6);
      }
    }
`;
