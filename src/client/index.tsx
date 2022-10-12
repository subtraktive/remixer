console.log("SOME fest")
import React from 'react';
import * as ReactDOM from 'react-dom';
import Remixer from './app/Remixer';

import { SAMPLE_RATE } from './app/Remixer';

const audioCtx = new AudioContext({
    sampleRate: SAMPLE_RATE
});



ReactDOM.render(<Remixer audioCtx={audioCtx} />, document.getElementById('root'));