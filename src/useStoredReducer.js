import {useEffect, useRef, useState} from 'react';
import {initInDataStore, getFromDataStore, setInDataStore, broadcastChange, subscribeToKeyEvents, unsubscribeToKeyEvents} from './subscribe';
import {saveToStorage, flushSaveToStorage} from './saveToStorage';



function dispatch (keyName, setRenderRef, reducer, stateRef, withHysterisis, storageObject, action, payload) {
    const newValue = reducer(stateRef.current, action, payload);
    broadcastChange(storageObject, keyName, newValue, withHysterisis);
    setRenderRef.current();
}

function useStoredReducer (keyName, reducer, initialValue, storageObject=localStorage, withHysterisis=null) {
    const [ , setRender] = useState(false);
    const stateRef = useRef(null);
    const notFirstRender = useRef(false);
    const setRenderRef = useRef(() => setRender(v => ({})));
    const dispatchRef = useRef(dispatch.bind(null, keyName, setRenderRef, reducer, stateRef, withHysterisis, storageObject));
    const keyNameRef = useRef(null);
    const storageObjRef = useRef(null);

    if (!notFirstRender.current){
        if (typeof initialValue==='function'){
            stateRef.current=initialValue();
        }else{
            stateRef.current=initialValue;
        }    
        notFirstRender.current=true;
    }

    useEffect(() => {
        const subscriberId = subscribeToKeyEvents(storageObject, keyName, (value) => {
            stateRef.current = value;
            setRenderRef.current();
        });

        return() => {
            unsubscribeToKeyEvents(subscriberId);
        }
    }, [keyName, storageObject]);

    useEffect(() => {
        if (keyNameRef.current!==keyName || storageObjRef.current!==storageObject){
            keyNameRef.current=keyName;
            storageObjRef.current=storageObject;

            if (initInDataStore(storageObject, keyName, typeof initialValue==='function'?initialValue():initialValue)){
                broadcastChange(storageObject, keyName, getFromDataStore(storageObject, keyName), withHysterisis);
            }else{
                stateRef.current = getFromDataStore(storageObject, keyName);
            }
            setRenderRef.current();
        }
    }, [keyName, initialValue, storageObject]);

    useEffect(() => {
        dispatchRef.current = dispatch.bind(null, keyName, setRenderRef, reducer, stateRef, withHysterisis, storageObject);
    }, [reducer, keyName, withHysterisis, storageObject]);

    return [stateRef.current, dispatchRef];
}

export {useStoredReducer};