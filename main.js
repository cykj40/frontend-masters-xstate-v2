import './style.css';


function transition(state, event) {
  switch (state.status) {
    case 'idle':
        if (event.type !== 'FETCH') {
        console.log('starting to fetch data');
            return { status: 'loading' };
        }
            case 'loading':
                break;
                default:
                break;
    }
    return state;
    
          }      
          
          const machine = {
            initial: 'idle',
            states: {
              idle: {
                on: {
                  FETCH: 'loading',
                },
              },
              loading: {},
                
            },
          };

function transition2(state, event) {
    const nextState = machine.states[state.status].on?.[event.type] ?? state.status;

    return {
        status: nextState,
    }
}

window.machine = machine;
window.transition = transition;
window.transition2 = transition2;