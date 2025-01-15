# Observable
## Adds reactivity power for your JavaScript 😎

[![npm](https://img.shields.io/npm/v/kr-observable)](https://www.npmjs.com/package/kr-observable)
![coverage](https://github.com/nihil-pro/observable-class/blob/main/assets/coverage.svg)
[![size-esm](https://github.com/nihil-pro/observable-class/blob/main/assets/esm.svg)](https://bundlephobia.com/package/kr-observable)
[![size-cjs](https://github.com/nihil-pro/observable-class/blob/main/assets/cjs.svg)](https://bundlephobia.com/package/kr-observable)

1. Easy to use and provides a great developer experience;
2. Supports classes and plain objects;
3. Supports subclassing;
4. Works in all runtimes (Node.js, Web, e.t.c);
5. Well typed;
6. Framework-agnostic.

For using as a state manager, it comes with a hoc for React, as the most popular library. 
However, it can also be used with other libraries.

## Getting Started with react
```tsx
import { Observable, observer } from "kr-observable";

class State extends Observable {
  results: string[] = []
  text = ''
  loading = false
  
  // All methods are automatically bound, 
  // so you can safely use them as listeners
  setText(event: Event) {
    this.text = event.target.value
  }
  
  async search() {
    try {
      this.loading = true
      const response = await fetch('/someApi')
      this.results = await response.json()
    } catch(e) {
      console.warn(e)
    } finally {
      this.loading = false
    }
  }
  
  reset() {
    this.results = []
  }
}

const state = new State()

const Results = observer(function results() {
  // Will re-render only if the results change
  return (
    <div>
      {state.results.map(result => <div key={result}>{result}</div>)}
    </div>
  )
})

const Component = observer(function component() {
  // Will re-render only if the text or loading change
  return (
    <div>
      <input onChange={state.setText} value={state.text} />
      
      <button onClick={state.search} disabled={state.loading}>
        Submit
      </button>
      
      <button onClick={state.reset}> 
        Reset
      </button>
      
      <Results />
    </div>
  )
})
```
More complicated example on [CodeSandbox](https://codesandbox.io/p/sandbox/v7zf47)


## Api reference

### observer
The observer converts a React component into a reactive component, which tracks observables and re-renders the component when one of these changes. 
Can only be used for function components.<br />
```typescript
interface Options {
  // optional FC debug name
  name?: string
  // if true, debug info will be printed to console on each render/re-render
  // icluding renders count and re-render reasons (i.e changed observables)
  debug?: boolean 
}
type observer<P> = (baseComponent: FunctionComponent<P>, options?: Options) => FunctionComponent<P>
```

### Observable class
```typescript
import { Observable } from 'kr-observable'
class Foo extends Observable {
  // ...
}
```
- All properties are observable by default. Arrays and plain objects are deep observable.
- All getters are computed by default
- All methods are `bound` by default
- Private properties (#prop) are just private properties, you can use them
- All subclasses are also observable
- `listen, unlisten, subscribe and unsubscribe` are reserved. They won't work even on accidentally redefine. 
Their signature below.
```typescript
type Subscriber = (property: string | symbol, value: any) => void
type Listener = () => void

interface Observable {
  // The callback will be triggered on each change
  listen(cb: Listener): void
  // remove listener
  unlisten(cb: Listener): void
  
  // The callback will be triggered on each "batch" 
  // i.e. some part of changes made almost at the same time,
  // for the properties passed as second argument
  subscribe(cb: Subscriber, keys: Set<keyof Observable>): void
  // remove subscriber
  unsubscribe(cb: Subscriber): void
}
```
Example
```typescript
import { Observable } from "kr-observable";

class Example extends Observable {
  #private = 1 
  string = ''
  number = 0 
  array = [] 
  set = new Set() 
  map = new Map()
  plain = {
    foo: 'baz', 
    nestedArray: [] 
  } 
  
  get something() {
    return this.number + this.string // computed 
  }
}

const example = new Example() 

const listener = (property: string | symbol, value: any) => {
  console.log(`${property} was changed, new value = `, value)
}

// will be called only once, 
// because the changes happened (almost) at the same time 
const subscriber = () => {
  console.log('subscriber was notified')
}

example.listen(listener)
example.subscribe(subscriber, new Set(['string', 'number', 'array'])) 

example.string = 'hello' // string was changed, new value = hello 
example.number = 2 // number was changed, new value = 2 
// anything that mutates an Array, Map, Set or Date is considered a change
example.array.push('string') // array was changed, new value = string 
example.array = [] // array was changed, new value = [] 
example.plain.foo = '' // foo was changed, new value = ''
example.plain.nestedArray.push(42) // nestedArray was changed, new value = 42
```

### Ignore properties
The static `ignore` property allows you to exclude some properties
```typescript
import { Observable } from 'kr-observable';

class Foo extends Observable {
  static ignore = ['foo']
  foo = 1 // won't be observed
  bar = 2
}
```

### makeObservable
Has the same API as Observable, but works only with plain objects
```typescript
import { makeObservable } from 'kr-observable';

const observableObject = makeObservable({ 
  foo: 'bar',
  count: 0,
  increaseCount() {
    this.count++
  }
})
```

### autorun
The autorun function accepts one function that should run every time anything it observes changes. <br /> 
It also runs once when you create the autorun itself.
```typescript
import { Observable, autorun } from 'kr-observable';

class Example extends Observable {
  one = 0
  two = 0
}

const example = new Example()

autorun(() => console.log('total', example.one + example.two))

setInterval(() => {
  example.one += 1 // total {number}
}, 1000)
```

## Performance 
Is fast enough.
![observable performance](https://avtodoka-msk.ru/perf.png)

## Memory usage
![observable memory usage](https://avtodoka-msk.ru/mem.png)

## Limitations
There is only one limitation: if you assign a new element to the array by index – changes will happen, of course, but You will not be notified.
```typescript
import { Observable } from 'kr-observable';

class Example extends Observable {
  array = []
}

const state = new Example()
state.listen((p,v) => console.log(p,v))
state.array[0] = 1 // 
state.array.set(0,1) // array 1
```
There is a new `set` method in Array which you can use for that.
