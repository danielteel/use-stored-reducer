# useStoredReducer [![Node.js CI](https://github.com/danielteel/use-stored-reducer/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/danielteel/use-stored-reducer/actions/workflows/node.js.yml)

### Description
useStoredReducer is a reducer hook that syncs to localStorage. If the localStorage value is changed, useStoredReducer updates to the new value. If another useStoredReducer hook in the application is utilizing the same keyName, the update is almost immediate. 

For performance optimization, it optionally takes a hysterisis argument, which is how long it should wait before comitting the new value to localStorage (the change is made immediately to all the current app's hooks, but it will wait to write to localStorage). This prevents writing to the disk until the state has not changed in XXX milliseconds. If not specified, the localStorage is written to immediately. Writing immediately should be fine for simple values, but if using JSON.stringify/JSON.parse with large objects, it might make more sense to set the hysterisis to 100ms.

### How to use it

The hooks signature is 
```javascript
const [state, dispatchRef] = useStoredReducer(keyName, reducer, initialValue, withHysterisis=null)
```
Returned
- **state** - the current state of the hook
- **dispatchRef** - a ref to the dispatch function. To use, call dispatchRef.current('action', payload)

Passed
- **keyName** (string)   - this is the key name the hook will use to read/write localStorage
- **reducer** (callback) - pass in a function that handles the dispatch calls, [example](#reducer-function). This is different then reacts useReducer.
- **initialValue** (any) - if the keyName is not found in localStorage, the initial state will be set to this, and it will be saved to localStorage
- **hysterisis** (optional, number) - this defines how long the hysterisis is before localStorage is written to. If not passed, or set to null, there is no hysterisis and state is stored to localStorage immediately.


#### Reducer function
The parameters to your reducer function are,
- **state** - the current state
- **action** - a string representing an action
- **payload** - this is the optional data sent with the action from dispatch()

Whatever you return from your reducer function is what the state gets set to.

Below is a simple example
```javascript
function reducer(state, action, payload) {
    switch (action) {
        case 'age':
            return {...state, age: Number(payload)};
        case 'name':
            return {...state, name: payload};
        case 'reset':
            return {age: 0, name: ''};
        default:
            throw Error('undefined action');
    }
}
```


