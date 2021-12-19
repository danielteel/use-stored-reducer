# useStoredReducer [![Node.js CI](https://github.com/danielteel/use-stored-reducer/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/danielteel/use-stored-reducer/actions/workflows/node.js.yml)

## Description
useStoredReducer is a reducer hook that syncs to localStorage. If the localStorage value is changed, useStoredReducer updates to the new value. If another useStoredReducer hook in the application is utilizing the same keyName, the update is almost immediate. 

For performance optimization, it optionally takes a hysterisis argument, which is how long it should wait before comitting the new value to localStorage (the change is made immediately to all the current app's hooks, but it will wait to write to localStorage). This prevents writing to the disk until the state has not changed in XXX milliseconds. If not specified, the localStorage is written to immediately. Writing immediately should be fine for simple values, but if using JSON.stringify/JSON.parse with large objects, it might make more sense to set the hysterisis to 100ms.

## Add it to your project
Install the package from npm with
```sh
npm install @dteel/use-stored-reducer
```
And import it into one of your react components
```javascript
import {useStoredReducer} from '@dteel/use-stored-reducer';
```

## The hook

The hooks signature is 
```javascript
const [state, {current: dispatchRef}] = useStoredReducer(keyName, reducer, initialValue, storageObject, hysterisis=null)
```
### Returned
- **state** - the current state of the hook
- **dispatchRef** - a ref to the dispatch function. To use, call dispatchRef.current('action', payload, callback)

### Passed
- **keyName** (string)   - this is the key name the hook will use to read/write localStorage
- **reducer** (callback) - pass in a function that handles the dispatch calls, [example](#reducer-function). This is different then reacts useReducer.
- **initialValue** (any) - if the keyName is not found in localStorage, the initial state will be set to this, and it will be saved to localStorage
- **storageObject** (optional, StorageObject) - what storage object to use. Can be localStorage, sessionStorage, or a custom object that implements Storage
- **hysterisis** (optional, number) - this defines how long the hysterisis is before localStorage is written to. If not passed, or set to null, there is no hysterisis and state is stored to localStorage immediately.


### Reducer function
The parameters to your reducer function are,
- **state** - the current state
- **action** - a string representing an action
- **payload** - this is the optional data sent with the action from dispatch()
- **callback** - this is a function supplied from dispatch()

Whatever you return from your reducer function is what the state gets set to.

Below is a simple example
```javascript
function reducer(state, action, payload, callback) {
    switch (action) {
        case 'age':
            return {...state, age: Number(payload)};
        case 'name':
            return {...state, name: payload};
        case 'reset':
            return {age: 0, name: ''};
        case 'get':
            callback(state);
            return state;
        default:
            throw Error('undefined action');
    }
}
```

# Small example component
```javascript
import { useStoredReducer } from '@dteel/use-stored-reducer';

//The reducer function we pass to the hook, when you call dispatchRef.current(action, payload) 
//this function gets called with the current state and the action/payload you passed to it.
//what you return is what the state gets set to
function reducer(state, action, payload) {
    switch (action) {
        case 'age':
            return {...state, age: Number(payload)};
        case 'name':
            return {...state, name: payload};
        default:
            return state;
    }
}

export default function ExampleComponent(){
    //We're reading/writing to localStorage key 'person' with a hysterisis of 500ms
    //If someones typing, it wont save to storage until they have a 500ms break in key events
    const [state, {current: dispatch}] = useStoredReducer('person', reducer, {age: 0, name: ''}, localStorage, 500);
    return (
        <>
            <input type='text'  value={state?.age || ' '}   onChange={ (e) => dispatch('age', e.target.value) } />
            <input type='text'  value={state?.name || ' '}  onChange={ (e) => dispatch('name', e.target.value) } />
        </>
    );
}
```


