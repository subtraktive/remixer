import React from 'react';
import AudioTrack from './components/AudioTrack';
import MasterOutput from './components/audioprocessor';
import SoundBuffer from './Soundbuffer';

export const SAMPLE_RATE = 44100

interface lenObjType{
  [key: number]: number
}

const convertFloat32toUInt8 = (buffer: any) => {  // incoming data is an ArrayBuffer
  let incomingData = new Uint8Array(buffer); // create a uint8 view on the ArrayBuffer
  let i:number, l = incomingData.length; // length, we need this for the loop
  let outputData = new Float32Array(incomingData.length); // create the Float32Array for output
  for (i = 0; i < l; i++) {
      outputData[i] = (incomingData[i] - 128) / 128.0; // convert audio to float
  }
  return outputData; // return the Float32Array
}

//convert UInt8Array to Float32Array
const convertUnsignedToFloat = (incomingData: any) => { // incoming data is a UInt8Array
  let i: number, l = incomingData.length;
  let outputData = new Float32Array(incomingData.length);
  for (i = 0; i < l; i++) {
      outputData[i] = (incomingData[i] - 128) / 128.0;
  }
  return outputData;
}

class Remixer extends React.Component<any, any> {

    trackBuffer: any[]
    audioProcessor: any[]
    fullTrackBuffer: any[]
    trackSampleLength: any[]
    playing: any[]
    startTime1: number
    startTime2: number

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
        this.fullTrackBuffer = []
        this.audioProcessor = []
        this.trackSampleLength = []
        this.playing = []
        this.startTime1 = 0
        this.startTime2 = 0
    }

    streamAudio = () => {
      let { duration} = this.state;
      let {audioCtx} = this.props;
      const buffer = audioCtx.createBuffer(2, SAMPLE_RATE*duration, SAMPLE_RATE);
      const source = audioCtx.createBufferSource();
      // set the buffer in the AudioBufferSourceNode
      source.buffer = buffer;
      // connect the AudioBufferSourceNode to the
      // destination so we can hear the sound
      source.connect(audioCtx.destination);
      // start the source playing
      source.start();
    }

    endBufferStream = () => {

    }

    queueAudioBuffer = (chunks: Uint8Array, index: number) => {
      //let floatAudioData = convertUnsignedToFloat(chunks);
      var d2 = new DataView(chunks.buffer);

      var floatAudioData = new Float32Array(d2.byteLength / Float32Array.BYTES_PER_ELEMENT);
      for (var jj = 0; jj < floatAudioData.length; ++jj) {
        floatAudioData[jj] = d2.getFloat32(jj * Float32Array.BYTES_PER_ELEMENT, true);
      }

      let chunkLength = floatAudioData.length
     // console.log("CHUNK LENGTH IS", chunkLength)
      let audioProcessor = this.audioProcessor[index];
      const minBufferCount = audioProcessor.getTotalBufferSampleCount();
      let trackBuffer = this.trackBuffer[index]
      let fullTrackBuffer = this.fullTrackBuffer[index]
      if(!this.trackBuffer[index]) {
        this.trackBuffer[index] = []
      }
      if(!this.fullTrackBuffer[index]) {
        this.fullTrackBuffer[index] = []
      }
      if(!this.trackSampleLength[index]) {
        this.trackSampleLength[index] = 0
      }
      this.trackSampleLength[index] += chunkLength
      this.fullTrackBuffer[index].push(floatAudioData)
      this.trackBuffer[index].push(floatAudioData)
      console.log(`The queue length for ${index}`, this.trackBuffer[index].length, " and total chunk length", this.trackSampleLength[index])
      if(this.trackSampleLength[index] > minBufferCount) { //!this.playing[index]
        //this.playing[index] = true 
       // audioProcessor.startPlaying()
       this.playAllQueuedBuffers(index)
      }
       
    }

    samplesCallback = (index: number) => {
      const processor = this.audioProcessor[index] 
      const buffer = this.trackBuffer[index]
      let chunkLength = buffer.length || 1;
      if(!buffer || buffer.length <= 0) {
        console.log("END PLAYING")
        this.audioProcessor[index].stopPlaying()
      }

      for (let sampleIndex = 0; sampleIndex <= processor.computeSamplesCount; sampleIndex = sampleIndex + chunkLength) {

        console.log("THE ARG IS ==========", buffer[sampleIndex])
        if(buffer[sampleIndex]) {
          processor.audioBuffer.copyToChannel(buffer[sampleIndex], 1, 0)
          processor.audioBuffer.copyToChannel(buffer[sampleIndex], 0, 0)
        }
      }
      this.trackBuffer[index].splice(0, processor.computeSamplesCount)
    }

    // Important to schedule multiple tracks to the same time, else the buffers get mixed up and won't play simulatenously
    // Thats why we're setting track 0 and track1 to play at the same time here, write better logic to update it dynamically
    playAllQueuedBuffers(index: number){
      let {audioCtx} = this.props;
      //this.startTime = 0;
      let len = this.trackBuffer[index].length;
      while (this.trackBuffer[index].length) {
        console.log("THE LENGTH IS ", this.trackBuffer[index].length, " with index", index)
        let floatData1 = this.trackBuffer[0].shift()
        let floatData2 = this.trackBuffer[1].shift()
        if(!floatData1 || !floatData2) return
   
        let buffer1 = audioCtx.createBuffer(2, floatData1.length, SAMPLE_RATE*2);
        let buffer2 = audioCtx.createBuffer(2, floatData2.length, SAMPLE_RATE*2);
        buffer1.getChannelData(0).set(floatData1);
        buffer1.getChannelData(1).set(floatData1);
        buffer2.getChannelData(0).set(floatData2);
        buffer2.getChannelData(1).set(floatData2);

        let source1 = audioCtx.createBufferSource();
        let source2 = audioCtx.createBufferSource();
        source1.buffer = buffer1;
        source2.buffer = buffer2;
        source1.connect(audioCtx.destination);
        source2.connect(audioCtx.destination);
        if(this.startTime1 == 0 && this.startTime2 == 0) {
          this.startTime1 = this.startTime2 = audioCtx.currentTime + 0.1;
        }
        source1.start(this.startTime1);
        source2.start(this.startTime2);
        
        this.startTime1 +=  source1.buffer.duration;
        this.startTime2 +=  source2.buffer.duration;
      }

      
    }

    displayTracks = (type: string) =>{
        let {genre, duration} = this.state;
        let {audioCtx} = this.props;
        let self: Remixer = this
        fetch(`http://localhost:8080/api/track/meta?genre=${genre}&duration=${duration}&type=${type}`).then(res => res.json()).then(data=>{
            console.log("Got data",data)
            let {layers} = data;
            let lenObj: lenObjType = {}
          
            layers.map((layer: any, index: number) => { 
                console.log("LAYER IS", layer);
                //this.audioProcessor[index] = new SoundBuffer(audioCtx, SAMPLE_RATE, 10, true) // new MasterOutput(this.samplesCallback, audioCtx, index)
                let len1 = 0;
                let len2 = 0;
                lenObj[index] = 0;
                self.trackBuffer[index] = []
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
                                //console.log("DONE", self.fullTrackBuffer[index].length)
                              controller.close();
                              //self.audioProcessor[index].stopPlaying()
                              //self.endBufferStream()
                             //self.playAllQueuedBuffers(index)
                             console.log("++++++++++++++++++++++++++++++++++++======================END",self.trackBuffer[index].length)
                              return;
                            }
                            // Enqueue the next data chunk into our target stream
                            if(!value) return
                            controller.enqueue(value);  

                            var d2 = new DataView(value.buffer);
                            var floatAudioData = new Float32Array(d2.byteLength / Float32Array.BYTES_PER_ELEMENT);
                            for (var jj = 0; jj < floatAudioData.length; ++jj) {
                              floatAudioData[jj] = d2.getFloat32(jj * Float32Array.BYTES_PER_ELEMENT, true);
                            }


                            self.trackBuffer[index].push(floatAudioData)
                            lenObj[index] += floatAudioData.length;
                            // Find a better way to queue all buffers and then schedule them to play
                            if(self.trackBuffer[0].length > 10 && self.trackBuffer[1].length > 10) { // Hardcoded for now will be changed later
                              self.playAllQueuedBuffers(index)
                            }
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
                    console.log("the layer now is", layers)
                    this.setState({
                        layers
                    })
                    //console.log(image.src = url)
                  })
                  .catch((err) => {
                    console.error("SOME ERROR", err)
                  });
            })
            this.setState({
                showTracks: true,
                //clayers: data.layers,
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
                                console.log("SOURCE URI IS", sourceUrl)
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