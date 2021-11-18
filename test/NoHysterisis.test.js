import React from 'react';
import {screen, render, fireEvent, act, waitFor} from '@testing-library/react';
import 'regenerator-runtime/runtime';

import NoHysterisis from './NoHysterisis';


//LocalStorage Mocking - JSDOM needs it to be with defineProperty
let oldLocalStorage=null;
beforeAll(()=>{
    oldLocalStorage=localStorage;
    const newLocalStorage = {
        ...oldLocalStorage,
        getItem: (...args)=>oldLocalStorage.getItem(...args),
        setItem: (...args) =>oldLocalStorage.setItem(...args)
    };
    Object.defineProperty(window, 'localStorage', {value: newLocalStorage, writable: false});
});

afterAll(()=>{
    Object.defineProperty(window, 'localStorage', {value: oldLocalStorage, writable: false});
});



//Render a basic thang and get the controls for each test
let incrementButton;
let decrementButton;
let resetButton;
let valueInput;

beforeEach(()=>{
    render(<NoHysterisis includeControls/>);

    incrementButton = screen.getByText("Increment");
    decrementButton = screen.getByText("Decrement");
    resetButton = screen.getByText("Reset");
    valueInput = screen.getByTestId('value-input');
});


class StorageEvent extends Event {
    constructor(key, newValue, storageArea){
        super('storage');
        this.key=key;
        this.newValue=newValue;
        this.storageArea=storageArea;
    }
}
function storageEvent(storageObject, key, newValue){
    act(()=>{
        window.dispatchEvent(new StorageEvent(key, newValue, storageObject));
    });
}

describe('Renders simple component using useStoredReducer that doesnt use hysterisis in saving to localStorage', () => {
    it('reducer function in component counts state up and down, and resets state to 0', () => {
        fireEvent.click(resetButton);

        for (let i=1;i<=10;i++){
            fireEvent.click(incrementButton);
            expect(screen.getByDisplayValue(`${i}`)).not.toBeNull();
        }

        fireEvent.click(resetButton);

        for (let i=1;i<=10;i++){
            fireEvent.click(decrementButton);
            expect(screen.getByDisplayValue(`${0-i}`)).not.toBeNull();
        }
    });

    it('stays in sync with other hook instances with same key name', () => {
        render(<NoHysterisis/>);//Append a control-less HookTest to document

        fireEvent.click(resetButton);

        for (let i=1;i<=10;i++){
            fireEvent.click(incrementButton);
            expect(screen.getAllByDisplayValue(`${i}`)).toHaveLength(2);
        }

        fireEvent.click(resetButton);

        for (let i=1;i<=10;i++){
            fireEvent.click(decrementButton);
            expect(screen.getAllByDisplayValue(`${0-i}`)).toHaveLength(2);
        }
    });



    it('updates state from localStorage StorageEvents', () => {
        storageEvent(localStorage, 'count', 123);
        expect(screen.getAllByDisplayValue(`${123}`)).not.toBeNull();

        storageEvent(localStorage, 'count', -321);
        expect(screen.getAllByDisplayValue(`${-321}`)).not.toBeNull();
    });



    it('updates localStorage', async () => {
        const spy = jest.spyOn(localStorage, 'setItem');

        fireEvent.click(resetButton);
        expect(spy).toHaveBeenLastCalledWith('count', '0');
        fireEvent.click(incrementButton);
        expect(spy).toHaveBeenLastCalledWith('count', '1');

        fireEvent.change(valueInput, {target: {value: '689'}})
        expect(spy).toHaveBeenLastCalledWith('count', '689');
    });
});