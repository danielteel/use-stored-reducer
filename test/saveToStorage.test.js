import { saveToStorage, flushSaveToStorage } from "../src/saveToStorage";

import 'regenerator-runtime/runtime';
import {screen, render, fireEvent, act, waitFor} from '@testing-library/react';

//LocalStorage Mocking - JSDOM needs it to be with defineProperty
let oldLocalStorage=null;
let newLocalStorage=null;
let oldSessionStorage=null;
let newSessionStorage=null;
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

    oldSessionStorage=sessionStorage;
    newSessionStorage = {
        clear: ()=>oldSessionStorage.clear(),
        key: (...args)=>oldSessionStorage.key(...args),
        removeItem: (...args)=>oldSessionStorage.removeItem(...args),
        getItem: (...args)=>oldSessionStorage.getItem(...args),
        setItem: (...args) =>oldSessionStorage.setItem(...args)
    };
    Object.defineProperty(window, 'sessionStorage', {value: newSessionStorage, writable: false});

    jest.useFakeTimers('modern');
});

afterAll(()=>{
    Object.defineProperty(window, 'localStorage', {value: oldLocalStorage, writable: false});
    Object.defineProperty(window, 'sessionStorage', {value: oldSessionStorage, writable: false});
});

beforeEach(()=>{
    newLocalStorage.clear();
    newSessionStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers('modern');
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
        const timeoutTime = 250;
        const dataToStore = {value: 99};
        const keyName = 'name';
        const setItemSpy = jest.spyOn(newLocalStorage, 'setItem');
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

        //exercise
        saveToStorage(localStorage, keyName, dataToStore, timeoutTime);

        //assert
        expect(setTimeoutSpy.mock.calls[0][1]).toBe(timeoutTime);

        //exercise
        jest.advanceTimersByTime(timeoutTime);

        //assert
        expect(setItemSpy).toHaveBeenCalledWith(keyName, JSON.stringify(dataToStore));
    })


    it('only one setItem call happens within hysterisis time period', ()=>{
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

        jest.advanceTimersByTime(timeoutTime);

        //assert
        expect(setTimeoutSpy).toHaveBeenCalledTimes(3);
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
        expect(setItemSpy).toHaveBeenCalledTimes(1);
        expect(setItemSpy).toHaveBeenCalledWith(keyName, JSON.stringify(dataToStore));
    })

    
    it('flushSaveToStorage flushes saves entire queue', ()=>{
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
   
        //assert
        expect(setItemSpy).not.toHaveBeenCalled();

        //exercise
        flushSaveToStorage();

        //assert
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);

        expect(setItemSpy).toHaveBeenCalledWith(keyName1, JSON.stringify(dataToStore));
        expect(setItemSpy).toHaveBeenCalledWith(keyName2, JSON.stringify(dataToStore));
    })

    it('flushSaveToStorage with specific storage/key', ()=>{
        //setup
        const timeoutTime = 5000;
        const dataToStore = {value: 10};
        const keyName1 = 'dbsd';
        const keyName2 = 'gdfd';
        const setLocalSpy = jest.spyOn(newLocalStorage, 'setItem');
        const setSessionSpy = jest.spyOn(newSessionStorage, 'setItem');

        //exercise
        saveToStorage(localStorage, keyName1, dataToStore, timeoutTime);
        saveToStorage(sessionStorage, keyName2, dataToStore, timeoutTime);
   
        //assert
        expect(setLocalSpy).not.toHaveBeenCalled();
        expect(setSessionSpy).not.toHaveBeenCalled();

        //exercise
        flushSaveToStorage(sessionStorage, keyName2);

        //assert
        expect(setSessionSpy).toHaveBeenCalledWith(keyName2, JSON.stringify(dataToStore));
        expect(setLocalSpy).not.toHaveBeenCalled();

        //exercise
        jest.advanceTimersByTime(timeoutTime);

        //assert
        expect(setLocalSpy).toHaveBeenCalled();
    })
});