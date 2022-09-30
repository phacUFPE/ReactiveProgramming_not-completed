const { from, fromEvent, throwError, of, combineLatest, merge, reduce, skip } = rxjs;
const { filter, map, tap, startWith, flatMap,
  catchError, pairwise, mapTo, takeUntil } = rxjs.operators;

const URL = "";

const operation = (params, operation, valInput) => {
  const operators = {
    'ADD': function (a, b) { return a + b },
    'SUB': function (a, b) { return a - b },
    'MUL': function (a, b) { return a * b },
    'DIV': function (a, b) { return a / b }
  }
  return from(params)
  .pipe(
    map(param => param.value),
    map(value => {
      if (!Number.isInteger(value)) {
        value = reference(value, valInput)
      }
      return value
    }),
    reduce(operators[operation]),
    tap(value => console.log(value)),
  )
}

const reference = (value, valInput) => {
  let result = 'ERRO'
  const element = document.getElementById(value)
  if (element.id !== valInput.id) {
    result = element.value
  }
  return result
}

/* lógica principal */
const buildBussinessLogicStream = (expInput, valInput) => {
  fromEvent(expInput, "change")
  .pipe(
    map(evt => evt.target.value),
    map(CellParser.parse),
    // tap(valueParsed => console.log(valueParsed)),
  )
  .subscribe(valueParsed => {
    if (valueParsed.isError()) {
      valInput.value = valueParsed.value
    } else {
      if (valueParsed.isReference()) {
        const element = document.getElementById(valueParsed.value)
        valInput = reference(element.value, valInput)
      } else if (valueParsed.isOperation()) {
        observable = operation(valueParsed.value.params, valueParsed.value.operation, valInput)
        observable.subscribe(value => valInput.value = value)
      } else {
        valInput.value = valueParsed.value
      }
    }
  })
}

const buildEnterExitStreams = (cell, expInput, valInput) => {
  merge(
    fromEvent(cell, "click").pipe(mapTo(1)),
    fromEvent(expInput, "blur").pipe(mapTo(2))
  ).subscribe(evt => {
    if (evt === 1) {
      [valInput.hidden, expInput.hidden] = [true, false];
      expInput.focus();
    } else {
      [valInput.hidden, expInput.hidden] = [false, true];
    }
  });

  fromEvent(expInput, "keydown")
    .pipe(
      filter(evt => evt.key == "Enter" || evt.keyCode === 13),
      map(evt => evt.target.value),
      startWith(""), //todas as células começam com string vazias
      pairwise(),
      map(([prevVal, currVal]) => prevVal != currVal))
    .subscribe(isDifferent => {
      if (isDifferent) { //apenas emite se de fato houve mudança
        expInput.dispatchEvent(new Event("change"));
      }
      expInput.blur()
    });
}