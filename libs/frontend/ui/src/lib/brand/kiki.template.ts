/** Kiki's drawing: the validated mascot, split into groups that can move. */
export const KIKI_TEMPLATE = `
    <svg
      #svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="80 26 270 430"
      width="270"
      height="430"
      role="img"
      [attr.aria-label]="label()"
      [attr.class]="'kiki kiki--' + mood() + ' kiki--eyes-' + eyes()"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)"
      (pointerdown)="onTap()"
    >
      <defs>
        <clipPath [attr.id]="clipId">
          <path d="M120,370 C120,312 160,290 200,290 C240,290 280,312 280,370 C280,420 250,440 200,440 C150,440 120,420 120,370 Z" />
        </clipPath>
      </defs>
      <g class="kiki__all" stroke="#3F5A3C" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
        <g class="kiki__tail">
          <path d="M272,392 C308,392 322,406 326,426" fill="none" />
          <path d="M318,422 C312,438 324,450 336,444 C346,436 340,422 326,420 Z" fill="#C9A86A" />
        </g>
        <path d="M168,304 L176,200 L224,200 L232,304 Z" fill="#F3DE9A" />
        <g fill="#C9A86A" stroke="none">
          @for (spot of neckSpots; track spot.d) {
            <path class="kiki__spot" [attr.d]="spot.d" [style.--dx]="spot.dx + 'px'" [style.--dy]="spot.dy + 'px'" />
          }
        </g>

        <g class="kiki__body" (click)="tickle()" (pointermove)="onScrub($event)">
          <path d="M120,370 C120,312 160,290 200,290 C240,290 280,312 280,370 C280,420 250,440 200,440 C150,440 120,420 120,370 Z" fill="#F3DE9A" />
          <g [attr.clip-path]="'url(#' + clipId + ')'" fill="#C9A86A" stroke="none">
            @for (spot of bodySpots; track spot.d) {
              <path class="kiki__spot" [attr.d]="spot.d" [style.--dx]="spot.dx + 'px'" [style.--dy]="spot.dy + 'px'" />
            }
          </g>
          <path d="M120,370 C120,312 160,290 200,290 C240,290 280,312 280,370 C280,420 250,440 200,440 C150,440 120,420 120,370 Z" fill="none" />
          <ellipse cx="130" cy="404" rx="34" ry="30" fill="#F3DE9A" />
          <ellipse cx="270" cy="404" rx="34" ry="30" fill="#F3DE9A" />
          @if (soap() < 0.97) {
            <!-- Bath foam, thicker as her spots wash out. -->
            <g class="kiki__foam" fill="#FFFFFF" stroke="#9CC3D5" stroke-width="1.5" [style.opacity]="(1 - soap()) * 1.3">
              <circle cx="150" cy="334" r="9" /><circle cx="162" cy="326" r="6" /><circle cx="236" cy="330" r="8" />
              <circle cx="248" cy="342" r="5" /><circle cx="196" cy="366" r="10" /><circle cx="210" cy="358" r="6" />
              <circle cx="138" cy="392" r="7" /><circle cx="262" cy="384" r="8" /><circle cx="204" cy="410" r="6" />
            </g>
          }
        </g>
        <ellipse cx="112" cy="434" rx="22" ry="11" fill="#22301F" />
        <ellipse cx="288" cy="434" rx="22" ry="11" fill="#22301F" />
        <path d="M166,378 L166,440 Q166,448 174,448 L186,448 Q194,448 194,440 L194,378" fill="#F3DE9A" />
        <path d="M166,430 L194,430 L194,441 Q194,448 187,448 L173,448 Q166,448 166,441 Z" fill="#22301F" />
        @if (mood() !== 'rattle') {
          <path d="M206,378 L206,440 Q206,448 214,448 L226,448 Q234,448 234,440 L234,378" fill="#F3DE9A" />
          <path d="M206,430 L234,430 L234,441 Q234,448 227,448 L213,448 Q206,448 206,441 Z" fill="#22301F" />
        }
        <path d="M178,306 Q200,316 222,306 L203,340 Q200,344 197,340 Z" fill="#8FA98A" />
        <path d="M164,288 Q200,304 236,288 L238,302 Q200,320 162,302 Z" fill="#8FA98A" />
        <path d="M226,308 Q232,322 234,334" fill="none" stroke-width="2.5" />
        <g transform="rotate(10 256 344)">
          <path d="M234,332 L276,332 Q280,332 280,336 L280,352 Q280,356 276,356 L234,356 L226,344 Z" fill="#FBF7EE" stroke-width="3" />
          <circle cx="234" cy="344" r="2.5" fill="#22301F" stroke="none" />
          <text x="257" y="350" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="18" fill="#22301F" stroke="none">{{ name() }}</text>
        </g>
        @if (mood() === 'rattle') {
          <!-- Her right front leg raised, shaking her rattle in its hoof. -->
          <g transform="rotate(28 220 392)">
            <g class="kiki__paw">
              <path d="M220,318 L220,286" stroke-width="7" fill="none" />
              <path d="M220,318 L220,286" stroke="#8FA98A" stroke-width="3" fill="none" />
              <circle cx="220" cy="274" r="14" fill="#F3DE9A" />
              <path d="M208,268 Q220,276 232,268 M207,278 Q220,286 233,278" fill="none" stroke="#C9A86A" stroke-width="3" />
              <circle cx="214" cy="268" r="2.2" fill="#FBF7EE" stroke="none" />
              <path d="M206,392 L206,330 Q206,322 214,322 L226,322 Q234,322 234,330 L234,392" fill="#F3DE9A" />
              <path d="M206,340 L234,340 L234,329 Q234,322 227,322 L213,322 Q206,322 206,329 Z" fill="#22301F" />
            </g>
          </g>
        }

        <g class="kiki__head" (pointermove)="onPet($event)">
          <g class="kiki__horns" (click)="tapHorns($event)">
            <path d="M178,86 L172,46" stroke-width="14" fill="none" />
            <path d="M178,86 L172,46" stroke="#F3DE9A" stroke-width="7.6" fill="none" />
            <circle cx="172" cy="42" r="10" fill="#C9A86A" />
            <path d="M222,86 L228,46" stroke-width="14" fill="none" />
            <path d="M222,86 L228,46" stroke="#F3DE9A" stroke-width="7.6" fill="none" />
            <circle cx="228" cy="42" r="10" fill="#C9A86A" />
          </g>
          <g class="kiki__ear kiki__ear--left" [class.kiki__ear--pulled]="ears().left > 1" [style.transform]="'scaleX(' + ears().left + ')'" (pointerdown)="grabEar($event, 'left')">
            <path d="M142,110 C112,94 92,102 86,118 C100,132 124,132 142,126 Z" fill="#F3DE9A" />
            <path d="M134,114 C114,106 102,110 98,118 C108,125 122,125 134,122 Z" fill="#E6D5B8" stroke="none" />
            <!-- A roomier invisible handle: the ear itself is a small target. -->
            <ellipse class="kiki__ear-hit" cx="102" cy="110" rx="46" ry="36" fill="transparent" stroke="none" />
          </g>
          <g class="kiki__ear kiki__ear--right" [class.kiki__ear--pulled]="ears().right > 1" [style.transform]="'scaleX(' + ears().right + ')'" (pointerdown)="grabEar($event, 'right')">
            <path d="M258,110 C288,94 308,102 314,118 C300,132 276,132 258,126 Z" fill="#F3DE9A" />
            <path d="M266,114 C286,106 298,110 302,118 C292,125 278,125 266,122 Z" fill="#E6D5B8" stroke="none" />
            <ellipse class="kiki__ear-hit" cx="298" cy="110" rx="46" ry="36" fill="transparent" stroke="none" />
          </g>
          <circle cx="200" cy="138" r="68" fill="#F3DE9A" />
          <g fill="#C9A86A" stroke="none">
            @for (spot of headSpots; track spot.d) {
              <path class="kiki__spot" [attr.d]="spot.d" [style.--dx]="spot.dx + 'px'" [style.--dy]="spot.dy + 'px'" />
            }
          </g>
          <path d="M201,74 C190,62 196,48 208,51 C218,54 216,67 205,66" fill="none" stroke-width="5" />
          <ellipse cx="200" cy="182" rx="56" ry="38" fill="#FBF7EE" />
          <g class="kiki__cheeks" fill="#A4442A" stroke="none">
            <ellipse cx="146" cy="160" rx="13" ry="8" />
            <ellipse cx="254" cy="160" rx="13" ry="8" />
          </g>

          @switch (eyes()) {
            @case ('open') {
              <g class="kiki__look" stroke="none">
                <g class="kiki__eye">
                  <ellipse cx="174" cy="128" rx="11" ry="13" fill="#22301F" />
                  <circle cx="178" cy="122" r="4.2" fill="#FBF7EE" /><circle cx="170.5" cy="133" r="2" fill="#FBF7EE" />
                </g>
                <g class="kiki__eye">
                  <ellipse cx="226" cy="128" rx="11" ry="13" fill="#22301F" />
                  <circle cx="230" cy="122" r="4.2" fill="#FBF7EE" /><circle cx="222.5" cy="133" r="2" fill="#FBF7EE" />
                </g>
              </g>
            }
            @case ('happy') {
              <g fill="none" stroke="#22301F" stroke-width="4.5">
                <path d="M163,132 Q174,116 185,132" />
                <path d="M215,132 Q226,116 237,132" />
              </g>
            }
            @case ('squeeze') {
              <g fill="none" stroke="#22301F" stroke-width="4.5">
                <path d="M164,120 L183,128 L164,136" />
                <path d="M236,120 L217,128 L236,136" />
              </g>
            }
            @case ('sleep') {
              <g fill="none" stroke="#22301F" stroke-width="4.5">
                <path d="M163,126 Q174,138 185,126" />
                <path d="M215,126 Q226,138 237,126" />
              </g>
            }
            @case ('cross') {
              <!-- Cross-eyed: both pupils meet at her nose. -->
              <g stroke="none">
                <ellipse cx="174" cy="128" rx="11" ry="13" fill="#FBF7EE" stroke="#22301F" stroke-width="2.5" />
                <circle cx="181" cy="131" r="5.5" fill="#22301F" />
                <ellipse cx="226" cy="128" rx="11" ry="13" fill="#FBF7EE" stroke="#22301F" stroke-width="2.5" />
                <circle cx="219" cy="131" r="5.5" fill="#22301F" />
              </g>
            }
            @case ('wink') {
              <path d="M163,132 Q174,116 185,132" fill="none" stroke="#22301F" stroke-width="4.5" />
              <g stroke="none">
                <ellipse cx="226" cy="128" rx="11" ry="13" fill="#22301F" />
                <circle cx="230" cy="122" r="4.2" fill="#FBF7EE" />
              </g>
            }
          }

          <ellipse cx="186" cy="174" rx="4" ry="3" fill="#22301F" stroke="none" />
          <ellipse cx="214" cy="174" rx="4" ry="3" fill="#22301F" stroke="none" />

          @if (mood() === 'yawn') {
            <ellipse class="kiki__yawn" cx="200" cy="205" rx="13" ry="15" fill="#22301F" />
          }
          @if (pacifier() === 'mouth') {
            <g
              class="kiki__pacifier"
              [class.kiki__pacifier--yawn]="mood() === 'yawn'"
              [attr.role]="interactive() ? 'button' : null"
              [attr.tabindex]="interactive() ? 0 : null"
              [attr.aria-label]="interactive() ? 'Retirer la tétine de ' + name() : null"
              (pointerdown)="grab($event)"
              (keydown.enter)="pull($event)"
              (keydown.space)="pull($event)"
            >
              <path d="M178,194 C178,182 190,184 200,186 C210,184 222,182 222,194 C222,206 210,204 200,202 C190,204 178,206 178,194 Z" fill="#8FA98A" stroke-width="3.5" />
              <circle cx="200" cy="208" r="9" fill="none" stroke-width="3.5" />
              <circle cx="200" cy="194" r="5" fill="#F3DE9A" stroke-width="3" />
              <!-- A wider invisible hit area, easier to catch with a finger. -->
              <circle class="kiki__hit" cx="200" cy="198" r="26" fill="transparent" stroke="none" />
            </g>
          } @else {
            @switch (mood()) {
              @case ('cry') {
                <path d="M186,198 Q200,186 214,198 Q214,214 200,214 Q186,214 186,198 Z" fill="#22301F" />
                <path d="M192,209 Q200,203 208,209 Q204,213 200,213 Q196,213 192,209 Z" fill="#C97B6B" stroke="none" />
              }
              @case ('pout') {
                <ellipse cx="200" cy="198" rx="5" ry="4.5" fill="#22301F" />
              }
              @case ('sleep') {
                <path d="M193,199 Q200,203 207,199" fill="none" />
              }
              @case ('yawn') {}
              @default {
                <path d="M186,195 Q200,210 214,195" fill="none" />
              }
            }
          }
          @if (mood() === 'tongue' || mood() === 'lick') {
            <g class="kiki__tongue">
              <path d="M210,200 Q228,196 234,212 Q238,232 222,233 Q210,231 210,200 Z" fill="#E59A8A" />
              <path d="M222,208 L224,224" fill="none" stroke-width="2" />
            </g>
          }
        </g>

        <!-- Tears, Zzz, hearts and the snot bubble live outside the head so
             they don't move its transform origin. -->
        @if (mood() === 'cry') {
          <g class="kiki__tears" fill="#9CC3D5" stroke="#5B8BA0" stroke-width="1.5">
            <path class="kiki__tear" d="M166,142 q-5,8 0,11 q5,-3 0,-11 z" />
            <path class="kiki__tear kiki__tear--late" d="M171,142 q-5,8 0,11 q5,-3 0,-11 z" />
            <path class="kiki__tear" d="M234,142 q-5,8 0,11 q5,-3 0,-11 z" />
            <path class="kiki__tear kiki__tear--late" d="M229,142 q-5,8 0,11 q5,-3 0,-11 z" />
          </g>
        }
        @if (mood() === 'sleep') {
          <circle class="kiki__snot" cx="219" cy="182" r="5" fill="#CFE6EF" fill-opacity="0.75" stroke="#5B8BA0" stroke-width="1.5" />
          <g class="kiki__zzz" fill="#3F5A3C" stroke="none" font-family="Caveat, cursive" font-weight="700">
            <text x="262" y="92" font-size="22">z</text>
            <text x="282" y="70" font-size="28">z</text>
            <text x="304" y="46" font-size="34">Z</text>
          </g>
        }
        @if (mood() === 'shakeoff') {
          <g class="kiki__drops" fill="#9CC3D5" stroke="#5B8BA0" stroke-width="1.5">
            @for (drop of drops; track $index) {
              <path class="kiki__drop" [attr.d]="'M' + drop.x + ',' + drop.y + ' q-5,8 0,11 q5,-3 0,-11 z'" [style.--dx]="drop.dx + 'px'" [style.--dy]="drop.dy + 'px'" />
            }
          </g>
        }
        @if (mood() === 'hug') {
          <!-- Her doudou, held against her neck (same shapes as lib-doudou). -->
          <g class="kiki__doudou" stroke-width="2">
            <g transform="translate(170 248) scale(1.5)">
              <ellipse cx="13" cy="13" rx="4.5" ry="11" fill="#8FA98A" transform="rotate(-14 13 13)" />
              <ellipse cx="13" cy="14" rx="2" ry="7" fill="#F3DE9A" stroke="none" transform="rotate(-14 13 13)" />
              <ellipse cx="27" cy="13" rx="4.5" ry="11" fill="#8FA98A" transform="rotate(14 27 13)" />
              <ellipse cx="27" cy="14" rx="2" ry="7" fill="#F3DE9A" stroke="none" transform="rotate(14 27 13)" />
              <ellipse cx="20" cy="43" rx="11" ry="9.5" fill="#8FA98A" />
              <ellipse cx="20" cy="44" rx="5.5" ry="5" fill="#FBF7EE" stroke="none" />
              <circle cx="20" cy="27" r="11" fill="#8FA98A" />
              <circle cx="16" cy="26" r="1.7" fill="#22301F" stroke="none" />
              <circle cx="24" cy="26" r="1.7" fill="#22301F" stroke="none" />
              <circle cx="20" cy="30" r="1.4" fill="#A4442A" stroke="none" />
              <path d="M14,36 L20,39 L26,36 L26,41 L20,39 L14,41 Z" fill="#F3DE9A" stroke-width="1.6" />
            </g>
          </g>
        }
        @if (mood() === 'love' || mood() === 'hug') {
          <g class="kiki__hearts" fill="#C9614A" stroke="none">
            <path class="kiki__heart" d="M150,70 c-6,-8 -18,-2 -12,8 l12,12 l12,-12 c6,-10 -6,-16 -12,-8 z" />
            <path class="kiki__heart" d="M200,52 c-6,-8 -18,-2 -12,8 l12,12 l12,-12 c6,-10 -6,-16 -12,-8 z" />
            <path class="kiki__heart" d="M252,70 c-6,-8 -18,-2 -12,8 l12,12 l12,-12 c6,-10 -6,-16 -12,-8 z" />
          </g>
        }
      </g>

      @if (pacifier() !== 'mouth') {
        <g
          class="kiki__pacifier kiki__pacifier--free"
          [class.kiki__pacifier--falling]="falling()"
          [style.transform]="'translate(' + (free().x - mouth.x) + 'px, ' + (free().y - mouth.y) + 'px)'"
          stroke="#3F5A3C"
          stroke-width="3.2"
          [attr.role]="interactive() ? 'button' : null"
          [attr.tabindex]="interactive() ? 0 : null"
          [attr.aria-label]="'Rendre sa tétine à ' + name()"
          (pointerdown)="grab($event)"
          (keydown.enter)="giveBack($event)"
          (keydown.space)="giveBack($event)"
        >
          <path d="M178,194 C178,182 190,184 200,186 C210,184 222,182 222,194 C222,206 210,204 200,202 C190,204 178,206 178,194 Z" fill="#8FA98A" stroke-width="3.5" />
              <circle cx="200" cy="208" r="9" fill="none" stroke-width="3.5" />
              <circle cx="200" cy="194" r="5" fill="#F3DE9A" stroke-width="3" />
              <!-- A wider invisible hit area, easier to catch with a finger. -->
              <circle class="kiki__hit" cx="200" cy="198" r="26" fill="transparent" stroke="none" />
        </g>
      }

      @if (bubble(); as text) {
        <g class="kiki__bubble" stroke="#22301F" stroke-width="2.5" stroke-linejoin="round">
          <path [attr.d]="bubbleShape().path" fill="#FBF7EE" />
          <text text-anchor="middle" font-family="Caveat, cursive" font-weight="700" [attr.font-size]="bubbleShape().font" fill="#22301F" stroke="none">
            @for (line of bubbleShape().lines; track $index) {
              <tspan [attr.x]="bubbleShape().centerX" [attr.y]="line.y">{{ line.text }}</tspan>
            }
          </text>
        </g>
      }

    </svg>
    <span class="kiki__live" aria-live="polite">{{ announcement() }}</span>
  
`;
