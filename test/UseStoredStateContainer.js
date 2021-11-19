import React from 'react';
import { useStoredReducer } from "../src/useStoredReducer";

function reducer(state, action, payload) {
    switch (action) {
        case 'age':
            return {...state, age: Number(payload)};
        case 'name':
            return {...state, name: payload};
    }
}

export default function withHysterisis({keyName, defaultValue, hysterisis}){
    const [state, dispatchRef] = useStoredReducer(keyName, reducer, defaultValue, hysterisis);
    return (
        <>
            <input data-testid='age-input' type='text' value={state?.age || ' '} onChange={(e)=>dispatchRef.current('age', e.target.value)}/>
            <input data-testid='name-input' type='text' value={state?.name || ' '} onChange={(e)=>dispatchRef.current('name', e.target.value)}/>
        </>
    );
}