import {initInDataStore, getFromDataStore, setInDataStore, broadcastChange, subscribeToKeyEvents, unsubscribeToKeyEvents} from '../src/subscribe';
import {newFakeStorage} from './common';

const fakeStorage1=newFakeStorage();
const fakeStorage2=newFakeStorage();
const initVal = {im: 'here'};

describe('Subscribe',()=>{
    it('initInDataStore initializes when value doesnt exist', ()=>{
        initInDataStore(fakeStorage1, 'doesnt-exist', initVal);

        expect(getFromDataStore(fakeStorage1, 'doesnt-exist')).toStrictEqual(initVal);
    })

    it('initInDataStore does not initialise when value does exist', ()=>{
        const newInitVal = {im: 'not here'};
        initInDataStore(fakeStorage1, 'doesnt-exist', newInitVal);

        expect(getFromDataStore(fakeStorage1, 'doesnt-exist')).toStrictEqual(initVal);
    })

    it('getFromDataStore gets two different values from different storageObjects with same keyname',()=>{
        setInDataStore(fakeStorage1, 'test-key', 1234);
        setInDataStore(fakeStorage2, 'test-key', 4321);

        expect(getFromDataStore(fakeStorage1, 'test-key')).toBe(1234);
        expect(getFromDataStore(fakeStorage2, 'test-key')).toBe(4321);
    })

    it('subscribing to key events calls callback and saves it', ()=>{
        //Setup
        const calls={callbackKey1: 0, callbackKey2: 0}
        const callbackKey1 = (newValue)=>{
            calls.callbackKey1++;
        }
        const callbackKey2 = (newValue)=>{
            calls.callbackKey2++;
        }

        const cb1Id = subscribeToKeyEvents(fakeStorage1, 'callback-key1', callbackKey1);
        const cb2Id = subscribeToKeyEvents(fakeStorage1, 'callback-key2', callbackKey2);

        //Exercise and Assert, doing changes calls callbacks
        broadcastChange(fakeStorage1, 'callback-key1', 'woah woah woah');
        expect(calls.callbackKey1).toBe(1);
        expect(calls.callbackKey2).toBe(0);

        broadcastChange(fakeStorage1, 'callback-key2', 'not today isis');
        expect(calls.callbackKey1).toBe(1);
        expect(calls.callbackKey2).toBe(1);

        //Assert values have been saved
        expect(getFromDataStore(fakeStorage1, 'callback-key1')).toBe('woah woah woah');
        expect(getFromDataStore(fakeStorage1, 'callback-key2')).toBe('not today isis');

        //Exercise and Teardown unsubscribing and then broadcasting changes
        unsubscribeToKeyEvents(cb1Id);
        unsubscribeToKeyEvents(cb2Id);

        broadcastChange(fakeStorage1, 'callback-key1', 'woah woah woah');
        broadcastChange(fakeStorage1, 'callback-key2', 'not today isis');

        //Assert that the callbacks havent been called
        expect(calls.callbackKey1).toBe(1);
        expect(calls.callbackKey2).toBe(1);
    })

    it('subscribing to key events calls callback only with correct storageObject', ()=>{
        //Setup
        const calls={callback1: 0, callback2: 0}
        const callback1 = (newValue)=>{
            calls.callback1++;
        }
        const callback2 = (newValue)=>{
            calls.callback2++;
        }

        const cb1Id = subscribeToKeyEvents(fakeStorage1, 'callback', callback1);
        const cb2Id = subscribeToKeyEvents(fakeStorage2, 'callback', callback2);

        //Exercise and Assert
        broadcastChange(fakeStorage1, 'callback', 'woah woah woah');
        expect(calls.callback1).toBe(1);
        expect(calls.callback2).toBe(0);

        //Exercise and Assert
        broadcastChange(fakeStorage2, 'callback', 'not today isis');
        expect(calls.callback1).toBe(1);
        expect(calls.callback2).toBe(1);

        //Teardown
        unsubscribeToKeyEvents(cb1Id);
        unsubscribeToKeyEvents(cb2Id);
    })
})