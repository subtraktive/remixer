import e from 'express';
import React from 'react';
import { buffer } from 'stream/consumers';
import AudioTrack from './components/AudioTrack';
import styles from "./remixer.css";

export const SAMPLE_RATE = 44100

interface lenObjType{
  [key: number]: number
}

interface startTimer {
  [key: number]: number
}

interface trackScheduled {
  [key: number]: boolean
}

interface trackSourceNode {
  [key: number]: any[]
}

interface writeBufferObj {
  [key: number]: Uint8Array
}


const BUFFER_WRITE_SIZE  = 1024 * 44;
const BUFFER_HEADER_SIZE = 1024 * 44;


class Remixer extends React.Component<any, any> {

    trackBuffer: any[]
    trackBufferCache: any[] // used to store all chunks consumed, which can be used later
    lookAhead: number
    schedulerFreq: number
    startTimerObj: startTimer
    started: boolean
    trackSchedulers: startTimer
    trackDuration: startTimer
    trackScheduledStatus: trackScheduled
    worker: Worker
    trackSourceNodes: trackSourceNode
    totalTimeScheduled: startTimer
    writeBuffer: writeBufferObj
    bufferPosition: startTimer
    headerBuffer: any[]

    constructor(props: any) {
        super(props);
        this.state = {
            showTracks: false,
            noOfLayers: 0,
            layers: [],
            id: null,
            genre: 'hiphop',
            duration: 30,
            type: 'remix-1'
        }
        this.trackBuffer = []
        this.lookAhead = 200 //100 ms
        this.schedulerFreq = 30 // ms
        this.startTimerObj = {}
        this.started = false
        this.trackSchedulers = {}
        this.trackDuration = {}
        this.trackBufferCache = []
        this.headerBuffer = []
        this.trackScheduledStatus = {}
        this.trackSourceNodes = {}
        this.totalTimeScheduled = {}
        this.worker = new Worker('../worker-decoder.js');
        this.worker.onerror = event => {
          this._onWorkerError({ error: event.message });
        };
        this.worker.onmessage = this._onWorkerMessage.bind(this);  //new Worker('../worker-decoder.js')
        this.writeBuffer = {}
        this.bufferPosition = {}
        console.log("CREATED WORKEr", this.worker)
    }

    initialiseStartTime = () =>{
      let {noOfLayers} = this.state;
      let {audioCtx} = this.props;
      let startTime = audioCtx.currentTime + 0.5;
      for(let i = 0; i < noOfLayers; i++) {
        this.startTimerObj[i] = startTime
        this.totalTimeScheduled[i] = 0;
      }
      this.started = true;
    }

    _onWorkerMessage = (event: any) => {
      const {decoded, sessionId, trackIndex} = event.data;
      //console.log("GETTING BACK DECODED DATA @@@@@@@@@@@@@@@@@@@@@@@@@@@", decoded)
      if (decoded.channelData) {
        this.scheduleDecodedBuffers(decoded, trackIndex);
      }
    }

    _onWorkerError = (e: any) => {
      console.error("WORKER ERROR ========", e.error)
    }

    _decode({ bytes, done, trackIndex} : any) {
      //console.log("POST DECODE", bytes.buffer)
      this.worker.postMessage({ decode: bytes, trackIndex });
    }

    captureHeaders = (chunk: Uint8Array, index: number) => {
      let chunkLength = chunk.length;
      let minLen = Math.min(chunkLength, BUFFER_HEADER_SIZE)  
      if(!this.headerBuffer[index]){
        this.headerBuffer[index] = new Uint8Array(BUFFER_HEADER_SIZE)
      }
      return true
    }

    collectBuffers = (chunk: Uint8Array, index: number) => {
      let {audioCtx} = this.props;
        // Convert PCM data stream from server to float32array which is used by web audio
        let d2 = new DataView(chunk.buffer);
        //console.log("THE BYTE LENGTH IS", d2.byteLength)
        let floatAudioLeftData = new Float32Array(d2.byteLength / Float32Array.BYTES_PER_ELEMENT);
        let floatAudioRightData = new Float32Array(d2.byteLength / Float32Array.BYTES_PER_ELEMENT);

        let floatAudioData = new Float32Array(d2.byteLength / Float32Array.BYTES_PER_ELEMENT);
        for (let jj = 0; jj < floatAudioData.length; ++jj) {
          // if(jj%2 == 0) {
          //   floatAudioLeftData[jj] = d2.getFloat32(jj * Float32Array.BYTES_PER_ELEMENT, true);
          // } else {
          //   floatAudioRightData[jj] = d2.getFloat32(jj * Float32Array.BYTES_PER_ELEMENT, true);
          // }

          floatAudioData[jj] = d2.getFloat32(jj * Float32Array.BYTES_PER_ELEMENT, true);
        }

        let buffer = audioCtx.createBuffer(2, floatAudioData.length, SAMPLE_RATE*2);

        buffer.copyToChannel( floatAudioData, 0 );
        buffer.copyToChannel( floatAudioData, 1 );
        //buffer.getChannelData(0).set(floatAudioData);
        //buffer.getChannelData(1).set(floatAudioData);

        this.trackBuffer[index].push(buffer)
        this.trackBufferCache[index].push(buffer)
        this.trackDuration[index] += buffer.duration;
      
        //console.log("TRACK DURATION for ", index, " is now", this.trackDuration[index] )
        if(this.trackDuration[index] > 5 && !this.trackScheduledStatus[index]) { // until it caches 5 sec of content
          this.trackScheduledStatus[index] = true
          console.log("SCHEDULING BIFFER")
          this.scheduleBuffers(index)
        }
          
    }

    decodeBuffers = (bufferChunk: any, index: number ) => {
      // let d2 = new DataView(bufferChunk.buffer);
      // let floatAudioData = new Float32Array(d2.byteLength / Float32Array.BYTES_PER_ELEMENT);
      // for (let jj = 0; jj < floatAudioData.length; ++jj) {
      //     floatAudioData[jj] = d2.getFloat32(jj * Float32Array.BYTES_PER_ELEMENT, true);
      // }
      //console.log("DECODING ====================", bufferChunk)
      this.trackBuffer[index].push(bufferChunk )
      this.trackBufferCache[index].push(bufferChunk )
      

      if(this.trackBuffer[index].length > 30) {
       // console.log("SENDING TO ENCODE DATA ++++++++++++++++++++", bufferChunk)
        //this._decode({bytes: bufferChunk.buffer, done: false, trackIndex: index})
        this.scheduleBuffers(index)
      }
    }

    

    scheduleDecodedBuffers = ({ channelData, length, numberOfChannels, sampleRate }: any, trackIndex: number) => {
      const { audioCtx } = this.props;
      const audioSrc = audioCtx.createBufferSource(),
            audioBuffer = audioCtx.createBuffer(numberOfChannels, length, sampleRate);

        audioSrc.onended = () => {
            this.trackSourceNodes[trackIndex].shift();
            // this._abEnded++;
            // this._updateState();
        };

        // adding also ensures onended callback is fired in Safari
        if(!this.trackSourceNodes[trackIndex]) {
          this.trackSourceNodes[trackIndex].push(audioSrc);
        }
        

        for (let c = 0; c < numberOfChannels; c++) {
          if (audioBuffer.copyToChannel) {
              audioBuffer.copyToChannel(channelData[c], c);
          } else {
              let toChannel = audioBuffer.getChannelData(c);
              for (let i = 0; i < channelData[c].byteLength; i++) {
                  toChannel[i] = channelData[c][i];
              }
          }
      }

      if(!this.started) {
        this.initialiseStartTime()
      }

      audioSrc.buffer = audioBuffer;
      audioSrc.connect(audioCtx.destination);
      let currentTrackStartTime = this.startTimerObj[trackIndex]
      const startAt = this.startTimerObj[trackIndex] + this.totalTimeScheduled[trackIndex];
      // if (audioCtx.currentTime >= startAt) {
      //     this._skips++;
      //     this._updateState();
      // }
      audioSrc.start(startAt);

      this.totalTimeScheduled[trackIndex] += audioBuffer.duration;


    }

    scheduleBuffers = (index: number, decodedData?: any) => {
      let {audioCtx} = this.props;
      let self = this;
      if(!this.started) {
        this.initialiseStartTime()
      }
      if(index == 1) {
        console.log("########################### scheduling  track 1")
      } else {
        console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%% scheduling  track 2")
      }
      let currentTrackStartTime = this.startTimerObj[index]
      let firstInBuffer = this.trackBuffer[index][0];
      if(firstInBuffer) {
        let bufferDuration = firstInBuffer.duration; 
        while(currentTrackStartTime + bufferDuration < currentTrackStartTime + this.lookAhead) {
          firstInBuffer = this.trackBuffer[index].shift()
          if(!firstInBuffer) {
            break;
          }
          bufferDuration = firstInBuffer.duration;
          let bufferSource = audioCtx.createBufferSource();
          bufferSource.buffer = firstInBuffer;
          bufferSource.connect(audioCtx.destination)
          bufferSource.start(currentTrackStartTime)
          this.startTimerObj[index] += bufferDuration
          currentTrackStartTime = this.startTimerObj[index]
        }
        this.trackSchedulers[index] = window.setTimeout(() => {
          self.scheduleBuffers(index)
        }, self.schedulerFreq)
      } else {
        window.clearTimeout(this.trackSchedulers[index])
        // this timeout allows for buffers to get collected
        this.trackSchedulers[index] = window.setTimeout(() => self.scheduleBuffers(index), 500)
      }
    }

    headerComplete = (arr: Uint8Array, index: number) => {
      //start processing from here
      this.collectBuffers(arr, index)
    }

    _readIntoBuffer = (decimalArray: Uint8Array, done: boolean, index: number) => {
      let value = decimalArray
      if(this.headerBuffer[index]) {
        //console.log("SHOULD RETURN +========================*$$$$$$$$$WWWWWWW&&&&&&&&&&&&&&&&&")
        this.collectBuffers(value, index)
        return;
      }
      // convert decimal to hex and test 
      // let value =  decimalArray.map((d:number) => {
      //   let s = (+d).toString(16);
      //   if(s.length < 2) {
      //       s = '0' + s;
      //   }
      //   return s;
      // });//  decimal.toString(16))
      //console.log("POST CONVERTION ==================", value )
      if(!this.writeBuffer[index]) {
        this.writeBuffer[index] = new Uint8Array(BUFFER_WRITE_SIZE)
      }
      if(!this.bufferPosition[index]) {
        this.bufferPosition[index] = 0;
      }

      const src = value,
      srcLen = src.byteLength,
      bufferLen = this.writeBuffer[index].byteLength;
      let srcStart = 0,
        bufferPos = this.bufferPosition[index];

         //srcStart < srcLen
         //console.log("THE DIFFI S", bufferLen - bufferPos);
      while (srcStart < srcLen  && !this.headerBuffer[index]) {
        const len = Math.min(bufferLen - bufferPos, srcLen - srcStart);
        const end = srcStart + len;
        this.writeBuffer[index].set(src.subarray(srcStart, end), bufferPos);
        srcStart += len;
        bufferPos += len;
        if (bufferPos === bufferLen) {
          console.log("FILLED ######## WITH $$$$$$$$$$$%%%%%%% ", bufferPos, " and the header data", this.writeBuffer[index].slice(0, end))
            bufferPos = 0;
            this.headerBuffer[index] = true;
            this.collectBuffers(value, index)
            //this.headerComplete(value, index);
            //this.decodeBuffers(this.writeBuffer[index].slice(0, end), index)
            //this._flushBuffer({ end: Infinity, done, request });
        }
      }

      this.bufferPosition[index] = bufferPos;
    }

    displayTracks = (type: string) =>{
        let {genre, duration} = this.state;
        let {audioCtx} = this.props;
        let self: Remixer = this
        fetch(`http://localhost:8080/api/track/meta?genre=${genre}&duration=${duration}&type=${type}`).then(res => res.json()).then(data=>{
            let {layers} = data;
            this.setState({
              noOfLayers: layers.length
            })
            
            layers.map((layer: any, index: number) => { 
                this.trackBuffer[index] = []
                this.trackBufferCache[index] = []
                this.trackDuration[index] = 0
                this.trackScheduledStatus[index] = false
                let count = 0;
                this.headerBuffer[index] = false
                fetch(`http://localhost:8080/api/stream/${layer}`).then((response:any) => {
                    const reader = response.body.getReader();
                    return new ReadableStream({
                      start(controller) {
                        return pump();
                        function pump() {
                          return reader.read().then((data: any) => {
                            const {done, value} = data
                            // When no more data needs to be consumed, close the stream
                            if (done) {
                              controller.close();
                              console.log(`DONE LOADING for ${index} total kb`, (self.trackDuration[index]/1024))
                              for(let key in self.trackSchedulers) {
                                //self.scheduleBuffers(index)
                                window.clearTimeout(self.trackSchedulers[key])
                              }
                              return;
                            }
                            // Enqueue the next data chunk into our target stream
                            if(!value) return
                            controller.enqueue(value); 
                            //self.collectBuffers(value.buffer, index)
                            self._readIntoBuffer(value, done, index)
                           //window.setTimeout(() => self._readIntoBuffer(value, done, index));
                            count++;
                            if(count == 1) {
                              //console.log("THE first chunk got is ========= ", value)
                            } else {
                              //console.log("THE OTHER CHUNKS ++++++++++++++++++++++++++++++++++", value)
                            }
                            //self.decodeBuffers(value.buffer, index)
                            // audioCtx.decodeAudioData(value.buffer).then((decodedData: any) => {
                            //   // use the decoded data here only headers will come here
                            //   console.log("GETTING DECODED DATA", decodedData, " for hcunk", value.buffer, " and value =========",value )
                            // }, (err: any) => {
                            //   console.log("SOME ERROR IN DECODING", err)
                            //   // only collect data and not header perhaps ???s
                             

                            // }); 
                            
                            //console.log("THE VALLUE GOT IS", value, " and the buffer is", value.buffer)
                            
                            
                            return pump();
                          });
                        }
                      }
                    })
                  }).then((stream) => new Response(stream))
                  .then((response) => response.blob())
                  .then((blob) => URL.createObjectURL(blob))
                  .then((url) => {
                    layers[index] = url
                    this.setState({
                        layers
                    })
                  })
                  .catch((err) => {
                    console.error("SOME ERROR", err)
                  });
            })
            this.setState({
                showTracks: true,
                id: data.id,
                type
            }) 
        })
        
    }


    render() {
        let {showTracks, layers, id, type} = this.state;

        return (<div>
                { showTracks ? 
                (<div>
                    
                    <div data-id={id}>
                        {
                            layers.map((layer: string, index: number) => {
                                let sourceUrl = layer;
                                // if(type == "remix-1"){
                                //     sourceUrl = `/api/stream/${layer}`
                                // }
                               //return <AudioTrack type={type} showControls={true} source={sourceUrl} autoPlay={true} index={index} />

                                //return <AudioTrack type={type} showControls={true} source={sourceUrl} autoPlay={false} index={index} />
                                //return <audio id={`layer-${index}`} autoPlay={true} controls src={`/api/stream/${layer}`}>`TRACK-${index}`</audio>
                            })
                        }
                    </div>
                    <div>
                        {/* <AudioTrack showControls={true} source={`/audio/DRUMS_FULL.wav`} autoPlay={true} index={10001} /> */}
                    </div>
                </div>) : 
                <div>
                    <div className={styles.remixBtn} onClick={() => this.displayTracks('remix-1')}>REMIX </div>
                    {/* <div onClick={() => this.displayTracks('remix-2')}>REMIX 2</div> */}
                </div>
    }
            </div>)
    }

}

export default Remixer;