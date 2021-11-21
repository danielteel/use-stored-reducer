let saveToStorageQueue=[];
let hasAddedBeforeUnload=false;

function cancelSaveToStorage(storageObject, key){
    let existingSaveIndex = saveToStorageQueue.findIndex( item => (item.key===key && item.storageObject===storageObject) );
    while (existingSaveIndex>=0){
        clearTimeout(saveToStorageQueue[existingSaveIndex].timeoutId);
        saveToStorageQueue.splice(existingSaveIndex, 1);
        existingSaveIndex = saveToStorageQueue.findIndex( item => item.key===key );
    }
}

function flushSaveToStorage(onlyThisStorageObject=null, onlyThisKey=null){
    for (let savePair of saveToStorageQueue){
        if ((onlyThisStorageObject===null || onlyThisKey===null) || (savePair.storageObject===onlyThisStorageObject && savePair.key===onlyThisKey)){
            clearTimeout(savePair.timeoutId);
            try {
                savePair.storageObject.setItem(savePair.key, JSON.stringify(savePair.value));
            } catch {
                console.error("flushSaveToStorage: cant save key:", savePair.key," value:",savePair.value)
            }
        }
    }
    saveToStorageQueue=[];
}

function saveToStorage(storageObject, key, value, hystersisTime=null){
    if (!hasAddedBeforeUnload && hystersisTime!==null){
        hasAddedBeforeUnload=true;
        window.addEventListener('beforeunload', flushSaveToStorage);
        window.addEventListener('pagehide', flushSaveToStorage);//for iOS
    }

    cancelSaveToStorage(storageObject, key);

    if (!hystersisTime){
        try {
            storageObject.setItem(key, JSON.stringify(value));
        } catch {
            console.error("saveToStorage: cant save key:", key," value:",value)
        }
    } else {
        const timeoutId = setTimeout( () => {
            console.log(key, value);
            const existingSaveIndex = saveToStorageQueue.findIndex( item => item.key===key );
            
            if (existingSaveIndex>=0){
                saveToStorageQueue.splice(existingSaveIndex, 1);
                try {
                    storageObject.setItem(key, JSON.stringify(value));
                } catch {
                    console.error("saveToStorage: cant save key:", key," value:",value)
                }
            }
        }, hystersisTime)

        saveToStorageQueue.push({key, value, timeoutId, storageObject});
    }
}

export {saveToStorage, flushSaveToStorage};