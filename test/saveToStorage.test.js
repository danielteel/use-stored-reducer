import { saveToStorage, flushSaveToStorage } from "../src/saveToStorage";

import 'regenerator-runtime/runtime';
import {screen, render, fireEvent, act, waitFor} from '@testing-library/react';

//LocalStorage Mocking - JSDOM needs it to be with defineProperty
let oldLocalStorage=null;
let newLocalStorage=null;
beforeAll(()=>{
    oldLocalStorage=localStorage;
    newLocalStorage = {
        clear: ()=>oldLocalStorage.clear(),
        key: (...args)=>oldLocalStorage.key(...args),
        removeItem: (...args)=>oldLocalStorage.removeItem(...args),
        getItem: (...args)=>oldLocalStorage.getItem(...args),
        setItem: (...args) =>oldLocalStorage.setItem(...args)
    };
    Object.defineProperty(window, 'localStorage', {value: newLocalStorage, writable: false});
});

afterAll(()=>{
    Object.defineProperty(window, 'localStorage', {value: oldLocalStorage, writable: false});
});

beforeEach(()=>{
    newLocalStorage.clear();
    jest.clearAllMocks();
})

describe('saveToStorage', ()=>{
    it('saves to storage immediately',()=>{
        //setup
        const dataToStore = {value: 100};
        const keyName = 'key';
        const setItemSpy = jest.spyOn(newLocalStorage, 'setItem');

        //exercise
        saveToStorage(localStorage, keyName, dataToStore);

        //assert
        expect(setItemSpy).toHaveBeenCalledWith(keyName, JSON.stringify(dataToStore));
    })

    it('saves to storage with hysterisis',async ()=>{
        //setup
        const timeoutTime = 500;
        const dataToStore = {value: 99};
        const keyName = 'name';
        const setItemSpy = jest.spyOn(newLocalStorage, 'setItem');
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

        //exercise
        saveToStorage(localStorage, keyName, dataToStore, timeoutTime);

        //assert
        expect(setTimeoutSpy.mock.calls[0][1]).toBe(timeoutTime);
        await waitFor( () => {
            expect(setItemSpy).toHaveBeenCalledWith(keyName, JSON.stringify(dataToStore));
        }, {timeout: 1000})
    })

    it('only one setItem call happens within hysterisis time period',async ()=>{
        //setup
        const timeoutTime = 100;
        const dataToStore = {value: 90};
        const keyName = 'asdad';
        const setItemSpy = jest.spyOn(newLocalStorage, 'setItem');
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        //exercise
        saveToStorage(localStorage, keyName, 1, timeoutTime);
        saveToStorage(localStorage, keyName, 2, timeoutTime);
        saveToStorage(localStorage, keyName, dataToStore, timeoutTime);

        expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
        //assert
        await waitFor( () => {
            expect(setItemSpy).toHaveBeenCalledWith(keyName, JSON.stringify(dataToStore));
        }, {timeout: 1000})
    })

    it('only one setItem call happens within hysterisis time period',async ()=>{
        //setup
        const timeoutTime = 100;
        const dataToStore = {value: 90};
        const keyName = 'asdad';
        const setItemSpy = jest.spyOn(newLocalStorage, 'setItem');
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        //exercise
        saveToStorage(localStorage, keyName, 1, timeoutTime);
        saveToStorage(localStorage, keyName, 2, timeoutTime);
        saveToStorage(localStorage, keyName, dataToStore, timeoutTime+100);

        expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
        //assert
        await waitFor( () => {
            expect(setItemSpy).toHaveBeenCalledWith(keyName, JSON.stringify(dataToStore));
        }, {timeout: 1000})
    })

    
    it('flushSaveToStorage flushes saves entire queue',async ()=>{
        //setup
        const timeoutTime = 5000;
        const dataToStore = {value: 10};
        const keyName1 = 'dbsd';
        const keyName2 = 'gdfd';
        const setItemSpy = jest.spyOn(newLocalStorage, 'setItem');
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

        //exercise
        saveToStorage(localStorage, keyName1, dataToStore, timeoutTime);
        saveToStorage(localStorage, keyName2, dataToStore, timeoutTime);
        flushSaveToStorage();

        //assert
    })
});