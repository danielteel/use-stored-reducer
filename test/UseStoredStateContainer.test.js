import React from 'react';
import {screen, render, fireEvent, act, waitFor} from '@testing-library/react';
import 'regenerator-runtime/runtime';

import UseStoredStateContainer from './UseStoredStateContainer';

class StorageEvent extends Event {
    constructor(key, newValue, storageArea){
        super('storage');
        this.key=key;
        this.newValue=newValue;
        this.storageArea=storageArea;
    }
}
function storageEvent(storageObject, key, newValue){
    act(()=>{
        window.dispatchEvent(new StorageEvent(key, newValue, storageObject));
    });
}

//LocalStorage Mocking - JSDOM needs it to be with defineProperty
let oldLocalStorage=null;
let newLocalStorage=null;
beforeAll(()=>{
    oldLocalStorage=localStorage;
    newLocalStorage = {
        clear: ()=>oldLocalStorage.clear(),
        key: (...args)=>oldLocalStorage.key(...args),
        removeItem: (...args)=>oldLocalStorage.removeItem(...args),
        getItem: (...args)=>oldLocalStorage.getItem(...args),
        setItem: (...args) =>oldLocalStorage.setItem(...args)
    };
    Object.defineProperty(window, 'localStorage', {value: newLocalStorage, writable: false});
});

afterAll(()=>{
    Object.defineProperty(window, 'localStorage', {value: oldLocalStorage, writable: false});
});

beforeEach(()=>{
    newLocalStorage.clear();
    jest.clearAllMocks();
})



describe('useStoredReducer',()=>{
    it('Render default values on render', ()=>{
        //Setup
        render(<UseStoredStateContainer keyName={'test-key'} defaultValue={{name: 'Jim', age: '22'}}/>);

        //Assert
        screen.getByDisplayValue('Jim');
        screen.getByDisplayValue('22');
    });

    it('Render default lazy values on render', ()=>{
        //Setup
        render(<UseStoredStateContainer keyName={'test-key'} defaultValue={()=>({name: 'Jim', age: '22'})}/>);

        //Assert
        screen.getByDisplayValue('Jim');
        screen.getByDisplayValue('22');
    });

    it('Renders default values from storage', ()=>{
        //Setup
        newLocalStorage.setItem('test-key', JSON.stringify({age: '34', name: 'Jeffrey'}));
        render(<UseStoredStateContainer keyName={'test-key'} defaultValue={{name: 'Bob', age: '23'}}/>);

        //Assert
        screen.getByDisplayValue('Jeffrey');
        screen.getByDisplayValue('34');
    });

    it("updating keyName prop to uninitialized key will render default values", ()=>{
        //Setup
        newLocalStorage.setItem('test-key', JSON.stringify({age: '34', name: 'Jeffrey'}));
        const {rerender} = render(<UseStoredStateContainer keyName={'test-key'}/>);

        //Exercise
        rerender(<UseStoredStateContainer keyName={'different-test-key'} defaultValue={{name: 'I should be found', age: 'same with me'}}/>);

        //Assert
        screen.getByDisplayValue('I should be found');
        screen.getByDisplayValue('same with me');
    });

    it("updating defaultValue will not change state",()=>{
        //Setup
        const {rerender} = render(<UseStoredStateContainer keyName={'test-key'} defaultValue={{name: 'Bob', age: '23'}}/>);
        
        //Exercise
        rerender(<UseStoredStateContainer keyName={'test-key'} defaultValue={{name: 'Dan', age: '32'}}/>);

       //Assert
       screen.getByDisplayValue('Bob');
       screen.getByDisplayValue('23');

    });

    it("updating state in one hook will change state of other hooks with same keyName",()=>{
        //Setup
        render(<UseStoredStateContainer keyName={'test-key'} defaultValue={{name: 'Bob', age: '23'}}/>);
        
        const nameInput = screen.getByDisplayValue('Bob');
        const ageInput = screen.getByDisplayValue('23');

        render(<UseStoredStateContainer keyName={'test-key'}/>);
        render(<UseStoredStateContainer keyName={'test-key'}/>);

        //Exercise
        fireEvent.change(nameInput, {target: {value: 'Jessica'}});
        fireEvent.change(ageInput, {target: {value: '65'}});

        //Assert
       expect(screen.getAllByDisplayValue('Jessica')).toHaveLength(3);
       expect(screen.getAllByDisplayValue('65')).toHaveLength(3);
    });

    it("updating state in one hook will does not affect state of other hooks with different keyNames",()=>{
        //Setup
        render(<UseStoredStateContainer keyName={'test-key1'} defaultValue={{name: 'Bob', age: '23'}}/>);
        
        const nameInput = screen.getByDisplayValue('Bob');
        const ageInput = screen.getByDisplayValue('23');

        render(<UseStoredStateContainer keyName={'test-key2'} defaultValue={{name: 'Jimbo', age: '12'}}/>);
        render(<UseStoredStateContainer keyName={'test-key3'} defaultValue={{name: 'Jonbo', age: '34'}}/>);

        //Exercise
        fireEvent.change(nameInput, {target: {value: 'Jessica'}});
        fireEvent.change(ageInput, {target: {value: '65'}});

        //Assert
        screen.getByDisplayValue('Jessica');
        screen.getByDisplayValue('65');
        screen.getByDisplayValue('Jimbo');
        screen.getByDisplayValue('12');
        screen.getByDisplayValue('Jonbo');
        screen.getByDisplayValue('34');
    });

    it("updating state many times with hysterisis set to null will result in immediate setItem calls", async ()=>{
        //Setup
        const {rerender} = render(<UseStoredStateContainer keyName={'test-key'} defaultValue={{name: 'initial-name', age: 99}}/>);

        const nameInput = screen.getByDisplayValue('initial-name');

        const spy = jest.spyOn(newLocalStorage, 'setItem');

        //Exercise
        fireEvent.change(nameInput, {target: {value: 'Jess'}});
        fireEvent.change(nameInput, {target: {value: 'Bob'}});
        fireEvent.change(nameInput, {target: {value: 'Joseph'}});

        //Assert
        expect(spy.mock.calls[0][0]).toBe('test-key');
        expect(JSON.parse(spy.mock.calls[0][1])).toEqual({age: 99, name: 'Jess'})

        expect(spy.mock.calls[1][0]).toBe('test-key');
        expect(JSON.parse(spy.mock.calls[1][1])).toEqual({age: 99, name: 'Bob'})

        expect(spy.mock.calls[2][0]).toBe('test-key');
        expect(JSON.parse(spy.mock.calls[2][1])).toEqual({age: 99, name: 'Joseph'})

    });

    it("updating state with hysterisis multiple times within hysterisisTime period should result in only one setItem call", async ()=>{
        //Setup
        const {rerender} = render(<UseStoredStateContainer keyName={'test-key'} defaultValue={{name: 'name-input', age: '99'}} hysterisis={500}/>);

        const nameInput = screen.getByDisplayValue('name-input');
        const ageInput = screen.getByDisplayValue('99');

        const spy = jest.spyOn(newLocalStorage, 'setItem');

        //Exercise
        fireEvent.change(nameInput, {target: {value: 'Jess'}});
        fireEvent.change(ageInput, {target: {value: '23'}});

        fireEvent.change(nameInput, {target: {value: 'Bob'}});
        fireEvent.change(ageInput, {target: {value: '65'}});

        fireEvent.change(nameInput, {target: {value: 'Joseph'}});
        fireEvent.change(ageInput, {target: {value: '13'}});

        await waitFor( () => {
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toBe('test-key');
            expect(JSON.parse(spy.mock.calls[0][1])).toEqual({age: 13, name: 'Joseph'})
        }, {timeout: 1500});
    });

    it("updating keyName or defaultValue or hysterisisTime wont leave stale closure",()=>{
        //Setup
        const {rerender} = render(<UseStoredStateContainer keyName={'test-key'} defaultValue={{name: 'name-input', age: '99'}}/>);

        const nameInput = screen.getByDisplayValue('name-input');
        const ageInput = screen.getByDisplayValue('99');


        //Exercise
        render(<UseStoredStateContainer keyName={'different-test-key'} defaultValue={{name: 'Aba', age: '21'}} hysterisis={10}/>);
        fireEvent.change(nameInput, {target: {value: 'Jess'}});
        fireEvent.change(ageInput, {target: {value: '65'}});

        //Assert
        screen.getByDisplayValue('Jess');
        screen.getByDisplayValue('65');
    });

    it('updates state from localStorage StorageEvents', () => {
        //Setup
        render(<UseStoredStateContainer keyName={'test-key'} defaultValue={{name: 'name-input', age: '99'}}/>);

        //Exercise
        storageEvent(localStorage, 'test-key', JSON.stringify({name:'Jimbo', age:'15'}));
        
        //Assert
        screen.getByDisplayValue('Jimbo');
        screen.getByDisplayValue('15')
    });

    it('handles local cache subscription changes', () => {
        //Setup
        let {rerender} = render(
            <>
                <UseStoredStateContainer keyName={'test-key'} defaultValue={{name: 'name-input', age: '99'}}/>
                <UseStoredStateContainer keyName={'test-key'}/>
            </>
        );
        

        //Exercise
        const firstNameInput = screen.getAllByDisplayValue('name-input')[0];
        fireEvent.change(firstNameInput, {target: {value: 'Jess'}});
        const secondNameInput = screen.getAllByDisplayValue('Jess')[1];

        rerender(
            <>
                <UseStoredStateContainer keyName={'other-key'} defaultValue={{name: 'name-input', age: '99'}}/>
                <UseStoredStateContainer keyName={'test-key'}/>
            </>
        );

        fireEvent.change(firstNameInput, {target: {value: '1'}});
        fireEvent.change(secondNameInput, {target: {value: '2'}});

        rerender(
            <>
                <UseStoredStateContainer keyName={'test-key'}/>
                <UseStoredStateContainer keyName={'test-key'}/>
            </>
        );

        fireEvent.change(firstNameInput, {target: {value: 'abcde'}});

        
        //Assert
        expect(screen.getAllByDisplayValue('abcde')).toHaveLength(2);
    });
});