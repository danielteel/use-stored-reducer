import { useStoredReducer } from "../src/useStoredReducer";


function newCustomStorageObject(pollTime){
    const subscribers = [];
    const storage={};
    const storageObject = {
        getItem: (k) => storage[k], 
        setItem: (k, v) => storage[k]=v,
        subscribe: (callback) => {
            subscribers.push(callback);
        }
    }
    storageObject.broadcast = (k, v) => {
        subscribers.forEach( o => {
            o(storageObject, k, v);
        });
    }

    const pollFn = () => {
        let newCount = storageObject.getItem('count');
        if (!isFinite(newCount)) newCount=0;
        newCount++;

        storageObject.setItem('count', newCount);

        storageObject.broadcast('count', newCount);
        setTimeout(pollFn, pollTime);
    }

    setTimeout(pollFn, pollTime);

    return storageObject;
}

const customStorageObject=newCustomStorageObject(5000);

function reducer(state, action, payload) {
    switch (action) {
        case 'reset':
            return 0;
        default:
            return state;
    }
}

function TestCustomStorageObject(){
    const [data, dispatchRef] = useStoredReducer('count', reducer, 0, customStorageObject);

    return (
        <>
        <div>{data}</div>
        <button type='button' onClick={()=>dispatchRef.current('reset')}>Reset</button>
        </>
    );
}

export default TestCustomStorageObject;