import { saveToStorage, flushSaveToStorage } from "../src/saveToStorage";

import 'regenerator-runtime/runtime';
import {setupStorageMocks, resetStorageMocks, teardownStorageMocks} from './common';

beforeAll(()=>{
    jest.useFakeTimers('modern');
    setupStorageMocks();
});

afterAll(()=>{
    teardownStorageMocks();
});

beforeEach(()=>{
    resetStorageMocks();
    jest.clearAllMocks();
})

describe('saveToStorage', ()=>{
    it('saves to storage immediately',()=>{
        //setup
        const dataToStore = {value: 100};
        const keyName = 'key';
        const setItemSpy = jest.spyOn(localStorage, 'setItem');

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
        const setItemSpy = jest.spyOn(localStorage, 'setItem');
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
        const setItemSpy = jest.spyOn(localStorage, 'setItem');
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
        const setItemSpy = jest.spyOn(localStorage, 'setItem');
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
        const setLocalSpy = jest.spyOn(localStorage, 'setItem');
        const setSessionSpy = jest.spyOn(sessionStorage, 'setItem');

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