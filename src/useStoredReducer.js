import {useEffect, useRef, useState} from 'react';




function dispatch (keyName, setRenderRef, reducer, stateRef, withHysterisis, storageObject, action, payload) {
    const newValue = reducer(stateRef.current, action, payload);
    keyEvent(storageObject, keyName, newValue, withHysterisis);
    setRenderRef.current();
}

function useStoredReducer (keyName, reducer, initialValue, storageObject=localStorage, withHysterisis=null) {
    const [ , setRender] = useState(false);
    const stateRef = useRef(null);
    const notFirstRender = useRef(false);
    const setRenderRef = useRef(() => setRender(v => ({})));
    const dispatchRef = useRef(dispatch.bind(null, keyName, setRenderRef, reducer, stateRef, withHysterisis, storageObject));
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
                keyEvent(storageObject, keyName, subscriberDataStore[keyName], withHysterisis);
            }else{
                stateRef.current = subscriberDataStore[keyName];
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