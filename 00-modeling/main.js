import '../style.css';

const initialState = { value: 'loading' }

// Define a state machine using an object (transition lookup table)
const machine = {
  initial: 'loading',
  states: {
    loading: {
      on: {
        LOADED: 'playing'
      }
    },
    playing: {
      on: {
        PAUSE: 'paused'
      }
    },
    paused: {
      on: {
        PLAY: 'playing'
      }
    }
  }
};

// Create a state machine transition function
function machineTransition(state = {
  value: machine.initial
}, event) {
  const nextStateValue = machine.states[state.value].on?.[event.type];

  if (!nextStateValue) {
    return state;
  }

  return {
    ...state,
    value: nextStateValue,
  };
}

// Expose the machineTransition function to the global scope
window.machineTransition = machineTransition;

let currentState = { value: machine.initial };

const service = {
    send: (event) => {
        currentState = machineTransition(currentState, event);
        console.log(currentState);
    }
    };

    window.service = service;


// import '../style.css';


// const initialState = { value: 'loading' }

// // Create a state machine transition function either using:
// // - a switch statement (or nested switch statements)
// // - or an object (transition lookup table)

// // Also, come up with a simple way to "interpret" it, and
// // make it an object that you can `.send(...)` events to.

// function transition(state = initialState, event) {
//   switch (state.value) {
//     case 'loading':
//         if (event.type === 'LOADED') {
//             return {
//                 ...state,
//                 value: 'playing',
//             }
//         }


//         break;
//         case 'playing':
//             if (event.type === 'PAUSE') {
//                 return {
//                     ...state,
//                     value: 'paused',
//                 }
//             }
//             break;
//             case 'paused':
//                 if (event.type === 'PLAY') {
//                     return {
//                         ...state,
//                         value: 'playing',
//                     }
//                 }
//                 function machineTransition(state = {
//                     value: machine.initial
//                 }, event) {
//                     const nextStateValue =
//                       machine.states[state.value].on?.[event.type];
                  
//                     if (!nextStateValue) {
//                       return state;
//                     }
                  
//                     return {
//                       ...state,
//                       value: nextStateValue,
//                     };
//                   }
//                 }
//             }

//             window.machineTransition = machineTransition;