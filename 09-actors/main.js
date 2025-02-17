// @ts-check
import '../style.css';
import { createMachine, assign, interpret, send } from 'xstate';
import { raise } from 'xstate/lib/actions';
import { formatTime } from '../utils/formatTime';

import elements from '../utils/elements.js';

function createFakeAudio(duration) {
  let currentTime = 0;
  let interval;
  const observers = new Set();

  const notify = () => {
    observers.forEach((o) => o());
  };

  return {
    addEventListener: (event, fn) => {
      observers.add(fn);
      fn();
    },
    play: () => {
      interval = setInterval(() => {
        currentTime++;
        notify();
      }, 1000);
    },
    pause: () => {
      clearInterval(interval);
      notify();
    },
    get duration() {
      return duration;
    },
    get currentTime() {
      return currentTime;
    },
  };
}

const invokeAudio = (ctx) => (sendBack, receive) => {
  const audio = createFakeAudio(ctx.duration);

  audio.addEventListener('timeupdate', () => {
    sendBack({
      type: 'AUDIO.TIME',
      duration: parseInt(audio.duration),
      currentTime: Number(audio.currentTime),
    });
  });

  receive((event) => {
    switch (event.type) {
      case 'PLAY':
        audio.play();
        break;
      case 'PAUSE':
        audio.pause();
        break;
      default:
        break;
    }
  });
};

let songCounter = 0;
function loadSong() {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res({
        title: `Random Song #${songCounter++}`,
        artist: `Random Group`,
        duration: Math.floor(Math.random() * 100),
      });
    }, 1000);
  });
}

const playerMachine = createMachine({
  initial: 'loading',
  context: {
    title: undefined,
    artist: undefined,
    duration: 0,
    elapsed: 0,
    likeStatus: 'unliked', // or 'liked' or 'disliked'
    volume: 5,
  },
  type: 'parallel',
  states: {
    player: {
      initial: 'loading',
      states: {
        loading: {
          tags: ['loading'],
          // Instead of an external LOADED event,
          // invoke a promise that returns the song.
          // You can use the ready-made `loadSong` function.
          // Add an `onDone` transition to assign the song data
          // and transition to 'ready.hist'
        },
        ready: {
          // Invoke the audio callback (use `src: invokeAudio`)
          // Make sure to give this invocation an ID of 'audio'
          // so that it can receive events that this machine sends it
          initial: 'paused',
          states: {
            paused: {
              on: {
                PLAY: { target: 'playing' },
              },
            },
            playing: {
              entry: 'playAudio',
              exit: 'pauseAudio',
              on: {
                PAUSE: { target: 'paused' },
              },
            },
            hist: {
              type: 'history',
            },
          },
          always: {
            cond: (ctx) => ctx.elapsed >= ctx.duration,
            target: 'finished',
          },
        },
        finished: {
          type: 'final',
        },
      },
      onDone: {
        target: '.loading',
      },
      on: {
        SKIP: {
          target: '.loading',
        },
        LIKE: {
          actions: 'likeSong',
        },
        UNLIKE: {
          actions: 'unlikeSong',
        },
        DISLIKE: {
          actions: ['dislikeSong', raise('SKIP')],
        },
        'LIKE.TOGGLE': [
          {
            cond: (ctx) => ctx.likeStatus === 'liked',
            actions: raise('UNLIKE'),
          },
          {
            cond: (ctx) => ctx.likeStatus === 'unliked',
            actions: raise('LIKE'),
          },
        ],
        'AUDIO.TIME': {
          actions: 'assignTime',
        },
      },
    },
    volume: {
      initial: 'unmuted',
      states: {
        unmuted: {
          on: {
            'VOLUME.TOGGLE': 'muted',
          },
        },
        muted: {
          on: {
            'VOLUME.TOGGLE': 'unmuted',
          },
        },
      },
      on: {
        VOLUME: {
          cond: 'volumeWithinRange',
          actions: 'assignVolume',
        },
      },
    },
  },
}).withConfig({
  actions: {
    assignSongData: assign({
      title: (_, e) => e.data.title,
      artist: (_, e) => e.data.artist,
      duration: (ctx, e) => e.data.duration,
      elapsed: 0,
      likeStatus: 'unliked',
    }),
    likeSong: assign({
      likeStatus: 'liked',
    }),
    unlikeSong: assign({
      likeStatus: 'unliked',
    }),
    dislikeSong: assign({
      likeStatus: 'disliked',
    }),
    assignVolume: assign({
      volume: (_, e) => e.level,
    }),
    assignTime: assign({
      elapsed: (_, e) => e.currentTime,
    }),
    skipSong: () => {
      console.log('Skipping song');
    },
    // These actions should send events to that invoked audio actor:
    // playAudio should send 'PLAY'
    // pauseAudio should send 'PAUSE'
    playAudio: () => {},
    pauseAudio: () => {},
  },
  guards: {
    volumeWithinRange: (_, e) => {
      return e.level <= 10 && e.level >= 0;
    },
  },
});

const interpretPlayerMachine = interpret(playerMachine);
const service = interpretPlayerMachine.start();


elements.document.querySelector('#button-play').addEventListener('click', () => {
  service.send({ type: 'PLAY' });
});
elements.document.querySelector('#button-pause').addEventListener('click', () => {
  service.send({ type: 'PAUSE' });
});
elements.document.querySelector('#button-skip').addEventListener('click', () => {
  service.send({ type: 'SKIP' });
});
elements.document.querySelector('#button-like').addEventListener('click', () => {
  service.send({ type: 'LIKE.TOGGLE' });
});
elements.document.querySelector('#button-dislike').addEventListener('click', () => {
  service.send({ type: 'DISLIKE' });
});
elements.document.querySelector('#button-volume').addEventListener('click', () => {
  service.send({ type: 'VOLUME.TOGGLE' });
});
elements.document.querySelector('#scrubber').addEventListener('change', (e) => {
  console.log(e.target.valueAsNumber);
});
service.subscribe((state) => {
  console.log(state.event, state.value, state.context);
  const { context } = state;

  elements.document.querySelector('#button-loading').hidden = !state.hasTag('loading');
  elements.document.querySelector('#button-play').hidden = !state.can({ type: 'PLAY' });
  elements.document.querySelector('#button-pause').hidden = !state.can({ type: 'PAUSE' });
  elements.document.querySelector('#button-volume').dataset.level =
    context.volume === 0
      ? 'zero'
      : context.volume <= 2
      ? 'low'
      : context.volume >= 8
      ? 'high'
      : undefined;
  elements.document.querySelector('#button-volume').dataset.status = state.matches({ volume: 'muted' })
    ? 'muted'
    : undefined;

  elements.document.querySelector("#scrubber").setAttribute('max', context.duration);
  elements.document.querySelector('#scrubber').value = context.elapsed;
  elements.document.querySelector('#elapsed').innerHTML = formatTime(
    context.elapsed - context.duration
  );

  elements.document.querySelector('#button-like').dataset.likeStatus = context.likeStatus;
  elements.document.querySelector('.artist').innerHTML = context.artist || '--';
  elements.document.querySelector('.title').innerHTML = context.title || '--';
});
