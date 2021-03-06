import React from 'react';
import {screen, render, fireEvent, act, waitFor} from '@testing-library/react';
import 'regenerator-runtime/runtime';

import {newFakeStorage, setupStorageMocks, resetStorageMocks, teardownStorageMocks} from './common';

import UseStoredStateContainer from './TestUseStoredReducer';

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

beforeAll(()=>{
    jest.useFakeTimers('modern');
    setupStorageMocks();
});

afterAll(()=>{
    teardownStorageMocks();
});

beforeEach(()=>{
    resetStorageMocks();
    jest.clearAllMocks();
})



describe('useStoredReducer',()=>{
    it('Render default values on render', ()=>{
        //Setup
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'Jim', age: '22'}}/>);

        //Assert
        screen.getByDisplayValue('Jim');
        screen.getByDisplayValue('22');
    });

    it('Render default lazy values on render', ()=>{
        //Setup
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={()=>({name: 'Jim', age: '22'})}/>);

        //Assert
        screen.getByDisplayValue('Jim');
        screen.getByDisplayValue('22');
    });

    it('Renders default values from storage', ()=>{
        //Setup
        localStorage.setItem('test-key', JSON.stringify({age: '34', name: 'Jeffrey'}));
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'Bob', age: '23'}}/>);

        //Assert
        screen.getByDisplayValue('Jeffrey');
        screen.getByDisplayValue('34');
    });

    it("updating keyName prop to uninitialized key will render default values", ()=>{
        //Setup
        localStorage.setItem('test-key', JSON.stringify({age: '34', name: 'Jeffrey'}));
        const {rerender} = render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'}/>);

        //Exercise
        rerender(<UseStoredStateContainer storageObject={localStorage} keyName={'different-test-key'} defaultValue={{name: 'I should be found', age: 'same with me'}}/>);

        //Assert
        screen.getByDisplayValue('I should be found');
        screen.getByDisplayValue('same with me');
    });

    it("updating defaultValue will not change state",()=>{
        //Setup
        const {rerender} = render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'Bob', age: '23'}}/>);
        
        //Exercise
        rerender(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'Dan', age: '32'}}/>);

       //Assert
       screen.getByDisplayValue('Bob');
       screen.getByDisplayValue('23');

    });

    it("updating state in one hook will change state of other hooks with same keyName",()=>{
        //Setup
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'Bob', age: '23'}}/>);
        
        const nameInput = screen.getByDisplayValue('Bob');
        const ageInput = screen.getByDisplayValue('23');

        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'}/>);
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'}/>);

        //Exercise
        fireEvent.change(nameInput, {target: {value: 'Jessica'}});
        fireEvent.change(ageInput, {target: {value: '65'}});

        //Assert
       expect(screen.getAllByDisplayValue('Jessica')).toHaveLength(3);
       expect(screen.getAllByDisplayValue('65')).toHaveLength(3);
    });

    it("updating state in one hook will does not affect state of other hooks with different keyNames",()=>{
        //Setup
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key1'} defaultValue={{name: 'Bob', age: '23'}}/>);
        
        const nameInput = screen.getByDisplayValue('Bob');
        const ageInput = screen.getByDisplayValue('23');

        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key2'} defaultValue={{name: 'Jimbo', age: '12'}}/>);
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key3'} defaultValue={{name: 'Jonbo', age: '34'}}/>);

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
        const {rerender} = render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'initial-name', age: 99}}/>);

        const nameInput = screen.getByDisplayValue('initial-name');

        const spy = jest.spyOn(localStorage, 'setItem');

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
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'name-input', age: '99'}} hysterisis={100}/>);

        const nameInput = screen.getByDisplayValue('name-input');
        const ageInput = screen.getByDisplayValue('99');

        const spy = jest.spyOn(localStorage, 'setItem');

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
        }, {timeout: 1000});
    });

    it("updating keyName or defaultValue or hysterisisTime wont leave stale closure",()=>{
        //Setup
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'name-input', age: '99'}}/>);

        const nameInput = screen.getByDisplayValue('name-input');
        const ageInput = screen.getByDisplayValue('99');

        //Exercise
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'different-test-key'} defaultValue={{name: 'Aba', age: '21'}} hysterisis={10}/>);
        fireEvent.change(nameInput, {target: {value: 'Jess'}});
        fireEvent.change(ageInput, {target: {value: '65'}});

        //Assert
        screen.getByDisplayValue('Jess');
        screen.getByDisplayValue('65');
    });

    it('updates state from localStorage StorageEvents', () => {
        //Setup
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'name-input', age: '99'}}/>);

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
                <UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'name-input', age: '99'}}/>
                <UseStoredStateContainer storageObject={localStorage} keyName={'test-key'}/>
            </>
        );


        //Exercise
        const firstNameInput = screen.getAllByDisplayValue('name-input')[0];
        fireEvent.change(firstNameInput, {target: {value: 'Jess'}});
        const secondNameInput = screen.getAllByDisplayValue('Jess')[1];

        rerender(
            <>
                <UseStoredStateContainer storageObject={localStorage} keyName={'other-key'} defaultValue={{name: 'name-input', age: '99'}}/>
                <UseStoredStateContainer storageObject={localStorage} keyName={'test-key'}/>
            </>
        );

        fireEvent.change(firstNameInput, {target: {value: '1'}});
        fireEvent.change(secondNameInput, {target: {value: '2'}});

        rerender(
            <>
                <UseStoredStateContainer storageObject={localStorage} keyName={'test-key'}/>
                <UseStoredStateContainer storageObject={localStorage} keyName={'test-key'}/>
            </>
        );

        fireEvent.change(firstNameInput, {target: {value: 'abcde'}});

        //Assert
        expect(screen.getAllByDisplayValue('abcde')).toHaveLength(2);
    });

    it('same key name different storage objects dont sync to each other', ()=>{
        //Setup
        const fakeStorage = newFakeStorage();
        
        render(<>
            <UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'local-name', age: '11'}}/>
            <UseStoredStateContainer storageObject={fakeStorage} keyName={'test-key'} defaultValue={{name: 'fake-name', age: '22'}}/>
        </>);

        //Assert, defaultValues are being saved on first render
        expect(localStorage.getItem('test-key')).toBe(JSON.stringify({name: 'local-name', age: '11'}))
        expect(fakeStorage.getItem('test-key')).toBe(JSON.stringify({name: 'fake-name', age: '22'}))
        
        //Exercise, change localStorage and fakeStorage values
        const firstNameInput = screen.getByDisplayValue('local-name');
        fireEvent.change(firstNameInput, {target: {value: 'Im Real'}});

        const secondNameInput = screen.getByDisplayValue('fake-name');
        fireEvent.change(secondNameInput, {target: {value: 'Im Fake'}});

        //Assert, changes save over the default values saved
        expect(localStorage.getItem('test-key')).toBe(JSON.stringify({name: 'Im Real', age: '11'}))
        expect(fakeStorage.getItem('test-key')).toBe(JSON.stringify({name: 'Im Fake', age: '22'}))
    });

    
    it("callback gets called",()=>{
        //Setup
        render(<UseStoredStateContainer storageObject={localStorage} keyName={'test-key'} defaultValue={{name: 'Bob', age: '23', callback:'callback'}}/>);
        
        const callbackInput = screen.getByDisplayValue('callback');


        //Exercise
        fireEvent.change(callbackInput, {target: {value: 'abcdefg'}});

        //Assert
       expect(screen.getAllByDisplayValue('abcdefg')).toHaveLength(1);
    });
});