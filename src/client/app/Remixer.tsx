import React from 'react';
import AudioTrack from './components/AudioTrack';

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
        this.trackScheduledStatus = {}
    }

    initialiseStartTime() {
      let {noOfLayers} = this.state;
      let {audioCtx} = this.props;
      let startTime = audioCtx.currentTime + 0.5;
      for(let i = 0; i < noOfLayers; i++) {
        this.startTimerObj[i] = startTime
      }
      this.started = true;
    }

    collectBuffers(chunk: Uint8Array, index: number) {
      let {audioCtx} = this.props;

      // Convert PCM data stream from server to float32array which is used by web audio
      let d2 = new DataView(chunk);
      let floatAudioData = new Float32Array(d2.byteLength / Float32Array.BYTES_PER_ELEMENT);
      for (let jj = 0; jj < floatAudioData.length; ++jj) {
        floatAudioData[jj] = d2.getFloat32(jj * Float32Array.BYTES_PER_ELEMENT, true);
      }

      let buffer = audioCtx.createBuffer(2, floatAudioData.length, SAMPLE_RATE*2);
      buffer.getChannelData(0).set(floatAudioData);
      buffer.getChannelData(1).set(floatAudioData);

      this.trackBuffer[index].push(buffer)
      this.trackBufferCache[index].push(buffer)
      this.trackDuration[index] += buffer.duration;
      //console.log("TRACK DURATION for ", index, " is now", this.trackDuration[index] )
      if(this.trackDuration[index] > 5 && !this.trackScheduledStatus[index]) { // until it caches 5 sec of content
        this.trackScheduledStatus[index] = true
        this.scheduleBuffers(index)
      }
    }

    scheduleBuffers(index: number) {
      let {audioCtx} = this.props;
      if(!this.started) {
        this.initialiseStartTime()
      }
      let currentTrackStartTime = this.startTimerObj[index]
      let firstInBuffer = this.trackBuffer[index][0];

      if(firstInBuffer) {
        let bufferDuration = firstInBuffer.duration; 
        while(currentTrackStartTime + bufferDuration < currentTrackStartTime + this.lookAhead) {
          firstInBuffer = this.trackBuffer[index].shift()
          if(!firstInBuffer) break;
          bufferDuration = firstInBuffer.duration;
          let bufferSource = audioCtx.createBufferSource();
          bufferSource.buffer = firstInBuffer;
          bufferSource.connect(audioCtx.destination)
          bufferSource.start(currentTrackStartTime)
          this.startTimerObj[index] += bufferDuration
          currentTrackStartTime = this.startTimerObj[index]
        }
        this.trackSchedulers[index] = window.setTimeout(() => this.scheduleBuffers(index), this.schedulerFreq)
      } else {
        window.clearTimeout(this.trackSchedulers[index])
        // this timeout allows for buffers to get collected
        this.trackSchedulers[index] = window.setTimeout(() => this.scheduleBuffers(index), 500)
      }
    }

    displayTracks = (type: string) =>{
        let {genre, duration} = this.state;
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
                              
                              for(let key in self.trackSchedulers) {
                                window.clearTimeout(self.trackSchedulers[key])
                              }
                              return;
                            }
                            // Enqueue the next data chunk into our target stream
                            if(!value) return
                            controller.enqueue(value);  
                            self.collectBuffers(value.buffer, index)
                            
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

                                //return <AudioTrack type={type} showControls={true} source={sourceUrl} autoPlay={true} index={index} />
                                //return <audio id={`layer-${index}`} autoPlay={true} controls src={`/api/stream/${layer}`}>`TRACK-${index}`</audio>
                            })
                        }
                    </div>
                    <div>
                        {/* <AudioTrack showControls={true} source={`/audio/DRUMS_FULL.wav`} autoPlay={true} index={10001} /> */}
                    </div>
                </div>) : 
                <div>
                    <div onClick={() => this.displayTracks('remix-1')}>REMIX </div>
                    {/* <div onClick={() => this.displayTracks('remix-2')}>REMIX 2</div> */}
                </div>
    }
            </div>)
    }

}

export default Remixer;