import React from 'react';
import { useStoredReducer } from "../src/useStoredReducer";

function reducer(state, action, payload) {
    switch (action) {
        case 'increment':
            return state + 1;
        case 'decrement':
            return state - 1;
        case 'reset':
            return 0;
        case 'set':
            return Number(payload);
        default:
            throw Error("undefined reducer action", state, action, payload);
    }
}

export default function NoHysterisis({includeControls}){
    const [state, dispatchRef] = useStoredReducer('count', reducer, 0);
    return (
        <>
            <input data-testid='value-input' type='text' value={state} onChange={(e)=>dispatchRef.current('set', e.target.value)}/>
            {
                (includeControls)?(
                    <>
                    <button type='button' onClick={()=>dispatchRef.current('increment')}>Increment</button>
                    <button type='button' onClick={()=>dispatchRef.current('decrement')}>Decrement</button>
                    <button type='button' onClick={()=>dispatchRef.current('reset')}>Reset</button>
                    </>
                ):(
                    null
                )
            }
        </>
    );
}