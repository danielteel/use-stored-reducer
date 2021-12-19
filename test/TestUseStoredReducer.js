import React from 'react';
import { useStoredReducer } from "../src/useStoredReducer";

function reducer(state, action, payload, callback) {
    switch (action) {
        case 'age':
            return {...state, age: Number(payload)};
        case 'name':
            return {...state, name: payload};
        case 'callback':
            return {...state, callback: callback('123')};
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
            <input data-testid='callback-input' type='text' value={state?.callback || ' '} onChange={(e)=>dispatchRef.current('callback', null, ()=>e.target.value)}/>
        </>
    );
}