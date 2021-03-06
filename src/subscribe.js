import {saveToStorage} from './saveToStorage';

let subscriptions = [];
let newSubscriptionId = 0;
let hasStorageEventListener = false;
const storageObjectList=[];
let storageObjectListCounter=0;
const dataStore = {};

function getDataStoreStorageObjectId(storageObject){
    let storageRecord = storageObjectList.find( o => o.object === storageObject );
    if (!storageRecord){
        storageRecord={object: storageObject, id: String(storageObjectListCounter++)};
        storageObjectList.push(storageRecord);
    }
    return storageRecord.id;
}

function makeKey(storageObject, key){
    return getDataStoreStorageObjectId(storageObject)+':'+key;
}

function localAndSessionStorageHandler(e) {
    if ((e.storageArea !== localStorage) && (e.storageArea !== sessionStorage)) return;

    if (e.key === null) { // All keys have been cleared or this key has been deleted
        broadcastChange(e.storageArea, null, null, null, true);
    } else {
        if (e.newValue === null) {
            broadcastChange(e.storageArea, e.key, undefined, null, true);
        }else{
            try {
                broadcastChange(e.storageArea, e.key, JSON.parse(e.newValue), null, true);
            } catch {
                console.error("localAndSessionStorageHandler: failed to parse new value from storageEvent");
            }
        }
    }
}

function customStorageEventHandler(storageObject, key, newValue){
    broadcastChange(storageObject, key, newValue);
}

function subscribeToKeyEvents(storageObject, key, callback) {
    if (!hasStorageEventListener && (storageObject===localStorage || storageObject===sessionStorage)) {
        hasStorageEventListener = true;
        window.addEventListener('storage', localAndSessionStorageHandler);
    }else if (storageObject!==localStorage && storageObject!==sessionStorage){
        //If storage object is not local or session storage and has subscribe method, subscribe to it
        if (typeof storageObject.subscribe === 'function'){
            storageObject.subscribe(customStorageEventHandler);
        }
    }

    subscriptions.push({id: newSubscriptionId, storageObject, key, callback});
    return newSubscriptionId++;
}

function unsubscribeToKeyEvents(subscriberId) {
    const subscription = subscriptions.find( o => o.id===subscriberId );

    subscriptions = subscriptions.filter( o => !(o.id === subscriberId));

    if (subscription.key) {
        const hasOne = subscriptions.find( o => (o.key === subscription.key && o.storageObject === subscription.storageObject));
        if (!hasOne) {
            delete dataStore[makeKey(subscription.storageObject, subscription.key)];
        }
    }
}

function broadcastChange(storageObject, key, newValue, withHysterisis, fromStorage = false) {
    if (key === null && newValue === null) {
        subscriptions.forEach( o => {
            if (o.storageObject === storageObject) o.callback(undefined) 
        });
    } else {
        dataStore[makeKey(storageObject, key)] = newValue;

        if (!fromStorage){
            try {
                if (withHysterisis){
                    saveToStorage(storageObject, key, newValue, Number(withHysterisis));
                }else{
                    storageObject.setItem(key, JSON.stringify(newValue));
                }
            } catch {
                console.error("broadcastChange: failed to save value to storage", makeKey(storageObject, key), newValue);
            }
        }
        
        subscriptions.forEach( o => {
            if (o.key === key && o.storageObject === storageObject) o.callback(newValue);
        });
    }
}


function getFromDataStore(storageObject, key){
    return dataStore[makeKey(storageObject, key)];
}

function setInDataStore(storageObject, key, value){
    dataStore[makeKey(storageObject, key)] = value;
}

function initInDataStore(storageObject, key, initialValue) {
    if (getFromDataStore(storageObject, key) === undefined) {
        try {
            const storedVal = storageObject.getItem(key);
            if (storedVal===null || storedVal===undefined){
                setInDataStore(storageObject, key, initialValue);
                return true;
            }else{
                setInDataStore(storageObject, key, JSON.parse(storedVal));
            }
        } catch {
            setInDataStore(storageObject, key, null);
            console.error("initInDataStore: failed to get value", key);
        }
    }
    return false;
}

export {initInDataStore, getFromDataStore, setInDataStore, broadcastChange, subscribeToKeyEvents, unsubscribeToKeyEvents};