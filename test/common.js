const oldLocalStorage=localStorage;
let newLocalStorage=null;
const oldSessionStorage=sessionStorage;
let newSessionStorage=null;

function setupStorageMocks(){
    newLocalStorage = {
        clear: ()=>oldLocalStorage.clear(),
        key: (...args)=>oldLocalStorage.key(...args),
        removeItem: (...args)=>oldLocalStorage.removeItem(...args),
        getItem: (...args)=>oldLocalStorage.getItem(...args),
        setItem: (...args) =>oldLocalStorage.setItem(...args)
    };
    Object.defineProperty(window, 'localStorage', {value: newLocalStorage, writable: false});

    newSessionStorage = {
        clear: ()=>oldSessionStorage.clear(),
        key: (...args)=>oldSessionStorage.key(...args),
        removeItem: (...args)=>oldSessionStorage.removeItem(...args),
        getItem: (...args)=>oldSessionStorage.getItem(...args),
        setItem: (...args) =>oldSessionStorage.setItem(...args)
    };
    Object.defineProperty(window, 'sessionStorage', {value: newSessionStorage, writable: false});
}

function resetStorageMocks(){
    newLocalStorage.clear();
    newSessionStorage.clear();
}

function teardownStorageMocks(){
    Object.defineProperty(window, 'localStorage', {value: oldLocalStorage, writable: false});
    Object.defineProperty(window, 'sessionStorage', {value: oldSessionStorage, writable: false});
}


function newFakeStorage(){
    const fakeStorageData = {};
    return {
        getItem: (key) => fakeStorageData[key],
        setItem: (key, value) => fakeStorageData[key]=value
    };
}


export {newFakeStorage, setupStorageMocks, resetStorageMocks, teardownStorageMocks};