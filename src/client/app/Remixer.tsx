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
  [key: number]: any
}

interface writeBufferObj {
  [key: number]: Uint8Array
}


const BUFFER_WRITE_SIZE  = 1024 * 44;
const BUFFER_HEADER_SIZE = 1024 * 44;
const TOTAL_BUFFER_SIZE = 79312; // in kb this should be dynamicall calculated later
const TOTAL_TRACK_DURATION = 230; // secs

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
    trackSourceNodes: trackSourceNode
    totalTimeScheduled: startTimer
    writeBuffer: writeBufferObj
    bufferPosition: startTimer
    headerBuffer: any[]
    progress: trackSourceNode
    startBufferTime: number

    constructor(props: any) {
        super(props);
        this.state = {
            showTracks: false,
            noOfLayers: 0,
            layers: [],
            id: null,
            genre: 'hiphop',
            duration: 30,
            type: 'remix-1',
            loaded: {}
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
        this.writeBuffer = {}
        this.bufferPosition = {}
        this.progress = {}
        this.startBufferTime = 0
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
      this.startBufferTime = performance.now()
    }

    collectBuffers = (chunk: Uint8Array, index: number) => {
      let {audioCtx} = this.props;
      let {duration } = this.state;
        // Convert PCM data stream from server to float32array which is used by web audio
        let d2 = new DataView(chunk.buffer);
        let floatAudioData = new Float32Array(d2.byteLength / Float32Array.BYTES_PER_ELEMENT);
        for (let jj = 0; jj < floatAudioData.length; ++jj) {
          floatAudioData[jj] = d2.getFloat32(jj * Float32Array.BYTES_PER_ELEMENT, true);
        }

        let buffer = audioCtx.createBuffer(2, floatAudioData.length, SAMPLE_RATE*2);

        buffer.copyToChannel( floatAudioData, 0 );
        buffer.copyToChannel( floatAudioData, 1 );
        //buffer.getChannelData(0).set(floatAudioData);
        //buffer.getChannelData(1).set(floatAudioData);

        this.trackBuffer[index].push(buffer)
        this.trackBufferCache[index].push(buffer)
        
        this.totalTimeScheduled[index] += buffer.duration;
        //console.log("TRACK DURATION for ", index, " is now", this.totalTimeScheduled[index] )
        if(this.totalTimeScheduled[index] > 5 && !this.trackScheduledStatus[index]) { // until it caches 5 sec of content
          this.trackScheduledStatus[index] = true
          this.scheduleBuffers(index)
        }
          
    }

    hasStarted = () => {
      console.log("CALLING ++++++++", this.started)
      return this.started
    }

    scheduleBuffers = (index: number, decodedData?: any) => {
      let {audioCtx} = this.props;
      let {duration} = this.state;
      let self = this;
      if(!this.started) {
        this.initialiseStartTime()
      }

      let currentTrackStartTime = this.startTimerObj[index]
      
      let firstInBuffer = this.trackBuffer[index][0];
      if(firstInBuffer ) {
        
        let bufferDuration = firstInBuffer.duration; 
        while((currentTrackStartTime + bufferDuration < currentTrackStartTime + this.lookAhead)  && currentTrackStartTime <= duration ) {
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

    _readIntoBuffer = (decimalArray: Uint8Array, done: boolean, index: number) => {
      let value = decimalArray
      if(this.headerBuffer[index]) {
        this.collectBuffers(value, index)
        return;
      }

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
          bufferPos = 0;
          this.headerBuffer[index] = true;
          this.collectBuffers(value, index)
        }
      }

      this.bufferPosition[index] = bufferPos;
    }

    getProgress(index: number): number {
      let {duration} = this.state;
      this.progress[index] = (this.startTimerObj[index] / duration)*100
      
      return this.progress[index]
    }

    displayTracks = (type: string) =>{
        let {genre, duration, loaded} = this.state;
        let {audioCtx} = this.props;
        let self: Remixer = this
        fetch(`http://localhost:8080/api/track/meta?genre=${genre}&duration=${duration}&type=${type}`).then(res => res.json()).then(data=>{
            let {layers} = data;
            let rafStarted = false
            layers.forEach((index: number) => {
              loaded[index] = false
            })
            this.setState({
              noOfLayers: layers.length,
              showTracks: true,
              layers,
              loaded
            })
            
            layers.map((layer: any, index: number) => { 
                this.trackBuffer[index] = []
                this.trackBufferCache[index] = []
                this.trackDuration[index] = 0
                this.trackScheduledStatus[index] = false
                this.headerBuffer[index] = false
                this.trackSourceNodes[index] = false
                this.totalTimeScheduled[index] = 0;
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
                              //self.trackSourceNodes[index] = true;
                              loaded[index] = true
                              //console.log(`DONE LOADING for ${index} total kb`, (self.totalTimeScheduled[index]/60), " and the total kb is", self.trackDuration[index]/1024)
                              for(let key in self.trackSchedulers) {
                                window.clearTimeout(self.trackSchedulers[key])
                              }
                              self.setState({
                                loaded
                              })
                              return;
                            }
                            // Enqueue the next data chunk into our target stream
                            if(!value) return
                            controller.enqueue(value); 
                            self._readIntoBuffer(value, done, index)
                           //window.setTimeout(() => self._readIntoBuffer(value, done, index));
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
        let {showTracks, layers, id, type, loaded, duration} = this.state;
        //console.log("PROGRESS IS", progress)
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
                               return <AudioTrack hasStarted={this.hasStarted} duration={duration} getProgress={this.getProgress.bind(this, index)} type={type} showControls={true} loaded={loaded[index]} source={sourceUrl} autoPlay={false} index={index} />

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