import {useEffect, useRef, useState} from 'react';



let saveToStorageWithHystersis_List=[];
let saveToStorageWithHystersis_FirstTime=true;

function cancelSaveToStorageWithHystersis(key){
    let existingSaveIndex = saveToStorageWithHystersis_List.findIndex( item => item.key===key );
    while (existingSaveIndex>=0){
        clearTimeout(saveToStorageWithHystersis_List[existingSaveIndex].timeoutId);
        saveToStorageWithHystersis_List.splice(existingSaveIndex, 1);
        existingSaveIndex = saveToStorageWithHystersis_List.findIndex( item => item.key===key );
    }
}

function flushSaveToStorageQueue(storageObject){
    for (let savePair of saveToStorageWithHystersis_List){
        clearTimeout(savePair.timeoutId);
        try {
            storageObject.setItem(savePair.key, JSON.stringify(savePair.value));
        } catch {
            console.error("flushSaveToStorageQueue: cant save to storageObject key:", savePair.key," value:",savePair.value)
        }
    }
    saveToStorageWithHystersis_List=[];
}

function saveToStorageWithHystersis(storageObject, key, value, hystersisTime=500){
    if (saveToStorageWithHystersis_FirstTime){
        saveToStorageWithHystersis_FirstTime=false;
        window.addEventListener('beforeunload', flushSaveToStorageQueue.bind(null, storageObject));
    }

    cancelSaveToStorageWithHystersis(key);

    const timeoutId = setTimeout( () => {
        const existingSaveIndex = saveToStorageWithHystersis_List.findIndex( item => item.key===key );
        
        if (existingSaveIndex>=0){
            saveToStorageWithHystersis_List.splice(existingSaveIndex, 1);
            try {
                storageObject.setItem(key, JSON.stringify(value));
            } catch {
                console.error("saveToStorageWithHystersis: cant save to storage, key:", key," value:",value)
            }
        }
    }, hystersisTime)

    saveToStorageWithHystersis_List.push({key, value, timeoutId});
}



let subscribers = [];
let subscriberIdCount = 0;
let subscriberDataStore = {};
let subscriberFirstTime = true;

function subscriberStorageHandler(e) {
    if (e.storageArea !== localStorage) return;

    if (e.key === null) { // All keys have been cleared or this key has been deleted
        keyEvent(null, null, null, true);
    } else {
        if (e.newValue === null) {
            keyEvent(e.key, undefined, null, true);
        }
        try {
            keyEvent(e.key, JSON.parse(e.newValue), null, true);
        } catch {
            console.error("subscriberStorageHandler: failed to parse new value from storageEvent");
        }
    }
}

function subscribeToKeyEvents(key, callback) {
    if (subscriberFirstTime) {
        subscriberFirstTime = false;
        window.addEventListener('storage', subscriberStorageHandler);
    }
    const subscriberId = subscriberIdCount++;
    subscribers.push({id: subscriberId, callback, key});
    return subscriberId;
}

function unsubscribeToKeyEvents(subscriberId) {
    let key = null;
    for (const subscriber of subscribers) {
        if (subscriber.id === subscriberId) {
            key = subscriber.key;
        }
    }

    subscribers = subscribers.filter(item => !(item.id === subscriberId));

    if (key) {
        const hasOne = subscribers.find(item => item.key === key);
        if (!hasOne) {
            delete subscriberDataStore[key];
        }
    }
}

function keyEvent(key, newValue, withHysterisis, fromStorage = false) {
    if (key === null && newValue === null) {
        for (let subscriber of subscribers) {
            subscriber.callback(undefined);
        }
    } else {
        subscriberDataStore[key] = newValue;

        if (!fromStorage){
            try {
                if (withHysterisis){
                    saveToStorageWithHystersis(localStorage, key, newValue, Number(withHysterisis));
                }else{
                    localStorage.setItem(key, JSON.stringify(newValue));
                }
            } catch {
                console.error("keyEvent: failed to save value to storage", key, newValue);
            }
        }
        
        for (let subscriber of subscribers) {
            if (subscriber.key === key) subscriber.callback(newValue);
        }
    }
}

function initSubscribeStorage(key, init) {
    if (subscriberDataStore[key] === undefined) {
        try {
            const storedVal = localStorage.getItem(key);
            if (storedVal===null){
                subscriberDataStore[key] = init;
                return true;
            }else{
                subscriberDataStore[key] = JSON.parse(storedVal);
            }
        } catch {
            subscriberDataStore[key] = null;
            console.error("initSubscribeStorage: failed to get value", key);
        }
    }
    return false;
}

function dispatch (keyName, setRenderRef, reducer, stateRef, withHysterisis, action, payload) {
    const newValue = reducer(stateRef.current, action, payload);
    keyEvent(keyName, newValue, withHysterisis);
    setRenderRef.current();
}

function useStoredReducer (keyName, reducer, initialValue, withHysterisis=null) {
    const [, setRender] = useState(false);
    const stateRef = useRef(null);
    const notFirstRender = useRef(false);
    const setRenderRef = useRef(() => setRender(v => ({})));
    const dispatchRef = useRef(dispatch.bind(null, keyName, setRenderRef, reducer, stateRef, withHysterisis));
    const keyNameRef = useRef(null);

    if (!notFirstRender.current){
        if (typeof initialValue==='function'){
            stateRef.current=initialValue();
        }else{
            stateRef.current=initialValue;
        }    
        notFirstRender.current=true;
    }

    useEffect(() => {
        const subscriberId = subscribeToKeyEvents(keyName, (value) => {
            stateRef.current = value;
            setRenderRef.current();
        });

        return() => {
            unsubscribeToKeyEvents(subscriberId);
        }
    }, [keyName]);

    useEffect(() => {
        if (keyNameRef.current!==keyName){
            keyNameRef.current=keyName;
            if (initSubscribeStorage(keyName, typeof initialValue==='function'?initialValue():initialValue)){
                keyEvent(keyName, subscriberDataStore[keyName], withHysterisis);
            }else{
                stateRef.current = subscriberDataStore[keyName];
            }
            setRenderRef.current();
        }
    }, [keyName, initialValue]);

    useEffect(() => {
        dispatchRef.current = dispatch.bind(null, keyName, setRenderRef, reducer, stateRef, withHysterisis);
    }, [reducer, keyName, withHysterisis]);

    return [stateRef.current, dispatchRef];
}

export {useStoredReducer};