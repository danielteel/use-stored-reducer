import React from 'react';
import { useStoredReducer } from "../src/useStoredReducer";

function reducer(state, action, payload) {
    switch (action) {
        case 'age':
            return {...state, age: Number(payload)};
        case 'name':
            return {...state, name: payload};
        default:
            return state;
    }
}

export default function withHysterisis({keyName, defaultValue, hysterisis, storageObject}){
    const [state, dispatchRef] = useStoredReducer(keyName, reducer, defaultValue, storageObject, hysterisis);
    return (
        <>
            <input data-testid='age-input' type='text' value={state?.age || ' '} onChange={(e)=>dispatchRef.current('age', e.target.value)}/>
            <input data-testid='name-input' type='text' value={state?.name || ' '} onChange={(e)=>dispatchRef.current('name', e.target.value)}/>
        </>
    );
}