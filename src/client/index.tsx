console.log("SOME fest")
import React from 'react';
import * as ReactDOM from 'react-dom';
import Remixer from './app/Remixer';

const audioCtx = new AudioContext();



ReactDOM.render(<Remixer audioCtx={audioCtx} />, document.getElementById('root'));