// @ts-check
import '../style.css';
import { createMachine, interpret } from 'xstate';

// Define a type for your elements
interface Elements {
  elPlayButton: HTMLButtonElement;
  elPauseButton: HTMLButtonElement;
  elLoadingButton: HTMLButtonElement;
  // Add more elements here as needed
}

const elements: Elements = {
  elPlayButton: document.querySelector('#button-play') as HTMLButtonElement,
  elPauseButton: document.querySelector('#button-pause') as HTMLButtonElement,
  elLoadingButton: document.querySelector('#button-loading') as HTMLButtonElement,
  // Add more elements here as needed
};

import { inspect } from '@xstate/inspect';

inspect({
  iframe: false,
  url: 'https://stately.ai/viz?inspect',
});

const playerMachine = createMachine({
  initial: 'loading',
  states: {
    loading: {
      on: {
        LOADED: 'playing',
      },
    },
    playing: {
      on: {
        PAUSE: 'paused',
      },
    },
    paused: {
      on: {
        PLAY: 'playing',
      },
    },
  },
});

const service = interpret(playerMachine, { devTools: true }).start();

elements.elPlayButton?.addEventListener('click', () => {
  service.send({ type: 'PLAY' });
});
elements.elPauseButton?.addEventListener('click', () => {
  service.send({ type: 'PAUSE' });
});

service.subscribe((state) => {
  console.log(state);
  elements.elLoadingButton.hidden = !state.matches('loading');
  elements.elPlayButton.hidden = !state.can('PLAY');
  elements.elPauseButton.hidden = !state.can('PAUSE');
});

service.send({ type: 'LOADED' });

