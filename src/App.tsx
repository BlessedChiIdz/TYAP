import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [display, setDisplay] = useState('0');
  const [base, setBase] = useState(10);
  const [memory, setMemory] = useState(0);
  const [memoryActive, setMemoryActive] = useState(false);
  const [history, setHistory] = useState([]);
  const [prevValue, setPrevValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [integerMode, setIntegerMode] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [oldBase, setOldBase] = useState(10)
  const digits = '0123456789ABCDEF'.slice(0, base);
  const point = integerMode ? '' : '.';

  const convertBase = (numStr:any, fromBase:any, toBase:any) => {
    if (numStr === '0' || numStr === '') return '0';

    // Разделяем на целую и дробную части
    const parts = numStr.split('.');
    let integerPart = parts[0] || '0';
    let fractionalPart = parts[1] || '';

    // Конвертируем целую часть
    let decimalValue = parseInt(integerPart, fromBase);
    let convertedInteger = decimalValue.toString(toBase).toUpperCase();

    // Конвертируем дробную часть, если она есть
    if (fractionalPart && !integerMode) {
      let fractionalValue = 0;
      for (let i = 0; i < fractionalPart.length; i++) {
        const digit = parseInt(fractionalPart[i], fromBase);
        fractionalValue += digit / Math.pow(fromBase, i + 1);
      }

      let convertedFractional = '';
      let temp = fractionalValue;
      for (let i = 0; i < 10 && temp > 0; i++) { // Ограничимся 10 знаками после точки
        temp *= toBase;
        const digit = Math.round(temp);
        convertedFractional += digit.toString(toBase).toUpperCase();
        temp -= digit;
      }

      return convertedInteger + (convertedFractional ? '.' + convertedFractional : '');
    }

    return convertedInteger;
  };

  useEffect(() => {
    // При изменении системы счисления правильно конвертируем текущее значение
    if (display !== '0') {
      const converted = convertBase(display, oldBase, base);
      setDisplay(converted);
    }
  }, [base]);

  useEffect(() => {
    const handleKeyDown = (e:any) => {
      const key = e.key.toUpperCase();

      // Обработка цифр (0-9 и A-F)
      if (digits.includes(key)) {
        handleDigitClick(key);
        return;
      }

      // Обработка операций
      switch (key) {
        case '+':
          handleOperationClick('+');
          break;
        case '-':
          handleOperationClick('-');
          break;
        case '*':
          handleOperationClick('*');
          break;
        case '/':
          handleOperationClick('/');
          break;
        case '=':
        case 'ENTER':
          calculateResult();
          break;
        case '.':
          if (!integerMode) handlePointClick();
          break;
        case 'BACKSPACE':
          handleBackspace();
          break;
        case 'ESCAPE':
          handleClear();
          break;
        case 'C':
          if (e.ctrlKey) {
            handleCopy();
          } else {
            handleClear();
          }
          break;
        case 'V':
          if (e.ctrlKey) {
            handlePaste();
          }
          break;
        case 'R':
          handleFunctionClick('Rev');
          break;
        case 'S':
          handleFunctionClick('Sqr');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [display, base, integerMode, digits]);


  const handleDigitClick = (digit:any) => {
    if (display === '0') {
      setDisplay(digit);
    } else {
      setDisplay(display + digit);
    }
  };

  const handlePointClick = () => {
    if (integerMode) return;
    if (!String(display).includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperationClick = (op:any) => {
    if (operation && prevValue !== null) {
      calculateResult();
    }
    // @ts-ignore
    setPrevValue(parseFloat(parseInt(display, base)));
    setOperation(op);
    setDisplay('0');
  };

  const handleFunctionClick = (func:any) => {
    let value = parseInt(display, base);
    let result;

    switch (func) {
      case 'Sqr':
        result = value * value;
        break;
      case 'Rev':
        result = 1 / value;
        break;
      default:
        return;
    }

    setDisplay(result.toString(base).toUpperCase());
    addToHistory(`${func}(${display}) = ${result.toString(base).toUpperCase()}`);
  };

  const calculateResult = () => {
    if (operation === null || prevValue === null) return;

    const currentDecimalValue = parseFloat(convertBase(display, base, 10));
    let result;

    switch (operation) {
      case '+':
        result = prevValue + currentDecimalValue;
        break;
      case '-':
        result = prevValue - currentDecimalValue;
        break;
      case '*':
        result = prevValue * currentDecimalValue;
        break;
      case '/':
        result = prevValue / currentDecimalValue;
        if(integerMode) result = Math.round(result)
          break;
      default:
        return;
    }

    const convertedResult = convertBase(result.toString(10), 10, base);
    setDisplay(convertedResult);
    // @ts-ignore
    addToHistory(`${convertBase(prevValue.toString(10), 10, base)} ${operation} ${display} = ${convertedResult}`);
    // @ts-ignore
    setPrevValue(result);
    setOperation(null);
  };

  const addToHistory = (entry:any) => {
    // @ts-ignore
    setHistory([...history, entry]);
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
  };

  const handleClearEntry = () => {
    setDisplay('0');
  };

  const handleBackspace = () => {
    if (display.length === 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleMemoryOperation = (op:any) => {
    const currentDecimalValue = parseFloat(convertBase(display, base, 10));

    switch (op) {
      case 'MC':
        setMemory(0);
        setMemoryActive(false);
        break;
      case 'MS':
        setMemory(currentDecimalValue);
        setMemoryActive(true);
        break;
      case 'MR':
        const convertedMemory = convertBase(memory.toString(10), 10, base);
        setDisplay(convertedMemory);
        break;
      case 'M+':
        setMemory(memory + currentDecimalValue);
        setMemoryActive(true);
        break;
      default:
        return;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (/^[0-9A-Fa-f.]+$/.test(text)) {
        setDisplay(text.toUpperCase());
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const renderDigitButtons = () => {
    return digits.split('').map((digit) => (
        <button
            key={digit}
            onClick={() => handleDigitClick(digit)}
            title={`Ввести цифру ${digit}`}
        >
          {digit}
        </button>
    ));
  };

  return (
      <div className="calculator-container">
        <div className="menu-bar">
          <div className="menu">
            <span>Правка</span>
            <div className="menu-content">
              <button onClick={handleCopy}>Копировать</button>
              <button onClick={handlePaste}>Вставить</button>
            </div>
          </div>
          <div className="menu">
            <span>Настройка</span>
            <div className="menu-content">
              <label>
                <input
                    type="checkbox"
                    checked={integerMode}
                    onChange={() => {
                      setIntegerMode(!integerMode)
                      // if(['A','B','C','D','E','F'].some(char=>String(display).includes(char))){
                      //   if(Number(String(display).split(".")[1].substring(0,1))>base/2 || )
                      // }else{
                      //   // @ts-ignore
                      //   setDisplay(Math.round(Number(display)))
                      //   }
                      let res = convertBase(display,base,10)
                      // @ts-ignore
                      res = Math.round(Number(res))
                      res = convertBase(String(res),10,base)
                      setDisplay(res)
                      }
                    }
                />
                Целочисленный режим
              </label>
              <div className="base-selector">
                Основание системы:
                <input
                    type="number"
                    min="2"
                    max="16"
                    value={base}
                    onChange={(e) =>{
                      setOldBase(base)
                      setBase(Math.min(16, Math.max(2, parseInt(e.target.value) || 2)))}
                    }
                />
              </div>
            </div>
          </div>
          <div className="menu">
            <span onClick={() => setShowAbout(!showAbout)}>Справка</span>
          </div>
        </div>

        {showAbout && (
            <div className="about-modal">
              <div className="about-content">
                <h2>О программе</h2>
                <p>Калькулятор p-ичных чисел</p>
                <p>Бедарев</p>
                <button onClick={() => setShowAbout(false)}>Закрыть</button>
              </div>
            </div>
        )}

        <div className="calculator">
          <div className="display">{display}</div>

          <div className="memory-panel">
            <span>{memoryActive ? 'M' : ''}</span>
            <button onClick={() => handleMemoryOperation('MC')} title="Очистить память">MC</button>
            <button onClick={() => handleMemoryOperation('MR')} title="Восстановить из памяти">MR</button>
            <button onClick={() => handleMemoryOperation('MS')} title="Сохранить в память">MS</button>
            <button onClick={() => handleMemoryOperation('M+')} title="Добавить к памяти">M+</button>
          </div>

          <div className="keypad">
            <div className="digits">
              {renderDigitButtons()}
              <button onClick={handlePointClick} disabled={integerMode} title="Десятичная точка">
                {point}
              </button>
            </div>

            <div className="operations">
              <button onClick={() => handleOperationClick('+')} title="Сложение">+</button>
              <button onClick={() => handleOperationClick('-')} title="Вычитание">-</button>
              <button onClick={() => handleOperationClick('*')} title="Умножение">*</button>
              <button onClick={() => handleOperationClick('/')} title="Деление">/</button>
              <button onClick={calculateResult} title="Вычислить результат">=</button>
            </div>

            <div className="functions">
              <button onClick={() => handleFunctionClick('Sqr')} title="Возвести в квадрат">Sqr</button>
              <button onClick={() => handleFunctionClick('Rev')} title="Обратное значение">Rev</button>
            </div>

            <div className="controls">
              <button onClick={handleClear} title="Очистить всё">C</button>
              <button onClick={handleClearEntry} title="Очистить текущее значение">CE</button>
              <button onClick={handleBackspace} title="Удалить последний символ">←</button>
            </div>
          </div>

          <div className="history">
            <h3>История вычислений</h3>
            <ul>
              {history.map((item, index) => (
                  <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
  );
}

export default App;