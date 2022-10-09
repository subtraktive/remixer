import React from 'react';
import AudioTrack from './components/AudioTrack';
import MasterOutput from './components/audioprocessor';

export const SAMPLE_RATE = 44100

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
    startTime: number

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
        this.startTime = 0
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
      //console.log("GETTING FLOAT DATA", floatAudioData.length, "For the init chunks", this.trackSampleLength[index])
      this.fullTrackBuffer[index].push(floatAudioData)
      this.trackBuffer[index].push(floatAudioData)
      console.log(`The queue length for ${index}`, this.trackBuffer[index].length, " and total chunk length", this.trackSampleLength[index])
      //console.log("MINBUFFER COUNT IS", minBufferCount, " and our internal buffer is", this.trackBuffer[index].length, "trackbuffer", this.trackBuffer[index] )
      if(this.trackSampleLength[index] > minBufferCount && !this.playing[index]) {
        this.playing[index] = true
        console.log("**********************PLAY*************************")
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
      console.log("====================================================== CHUNKLENGTH IN CB IS", chunkLength)
      let frequency = 220.0;
      // for (let sampleIndex = 0; sampleIndex <= processor.computeSamplesCount; ++sampleIndex) {
      //         let currentSeconds = (sampleIndex + processor.currentSamplesOffset) / processor.sampleRate;
        
      //         //For a sine wave.
      //         processor.channels[0][sampleIndex] = 0.005 * Math.sin(currentSeconds * 2.0 * Math.PI * frequency);
        
      //         //Copy the right channel from the left channel.
      //         processor.channels[1][sampleIndex] = processor.channels[0][sampleIndex];
      //       }
      for (let sampleIndex = 0; sampleIndex <= processor.computeSamplesCount; sampleIndex = sampleIndex + chunkLength) {

        //processor.audioBuffer.copyToChannel(buffer[sampleIndex], 1, 0 )
        console.log("THE ARG IS ==========", buffer[sampleIndex])
        if(buffer[sampleIndex]) {
          processor.audioBuffer.copyToChannel(buffer[sampleIndex], 1, 0)
          processor.audioBuffer.copyToChannel(buffer[sampleIndex], 0, 0)
        }
        // processor.channels[0][sampleIndex] = buffer[sampleIndex]
        // processor.channels[1][sampleIndex] = processor.channels[0][sampleIndex] 
      }
      this.trackBuffer[index].splice(0, processor.computeSamplesCount)
    }

    playAllQueuedBuffers(index: number){
      let {audioCtx} = this.props;
      this.startTime = 0;
      let len = this.trackBuffer[index].length;
      let floatData;
      while (typeof (floatData = this.trackBuffer[index].shift()) !== 'undefined') {
        console.log("THE LENGTH IS ", this.trackBuffer[index].length)
      //}
      //for(let i = 0; i < len; i++) {
        //len = this.trackBuffer[index].length;
       //let floatData = this.trackBuffer[index][i]
        // let d2 = new DataView(data.buffer);

        // let floatData = new Float32Array(d2.byteLength / Float32Array.BYTES_PER_ELEMENT);
        // for (let jj = 0; jj < floatData.length; ++jj) {
        //   floatData[jj] = d2.getFloat32(jj * Float32Array.BYTES_PER_ELEMENT, true);
        // }
        //console.log("LENGTH IS", floatData.length)
        let buffer = audioCtx.createBuffer(2, floatData.length, SAMPLE_RATE*2);
        buffer.getChannelData(0).set(floatData);
        buffer.getChannelData(1).set(floatData);

        let source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(this.startTime);
        
        this.startTime +=  buffer.duration;
      }
      //this.playing[index] = false;
    }

    displayTracks = (type: string) =>{
        let {genre, duration} = this.state;
        let {audioCtx} = this.props;
        let self: Remixer = this
        fetch(`http://localhost:8080/api/track/meta?genre=${genre}&duration=${duration}&type=${type}`).then(res => res.json()).then(data=>{
            console.log("Got data",data)
            let {layers} = data;
            layers.map((layer: any, index: number) => { 
                console.log("LAYER IS", layer);
                this.audioProcessor[index] = new MasterOutput(this.samplesCallback, audioCtx, index)

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
                            //console.log("GETTING VALUE", value, " awith done ", done, " and length of each ", value.length)
                            controller.enqueue(value);  
                            self.queueAudioBuffer(value, index)
                           

                              // let d2 = new DataView(value.buffer);

                              // let floatData = new Float32Array(d2.byteLength / Float32Array.BYTES_PER_ELEMENT);
                              // for (let jj = 0; jj < floatData.length; ++jj) {
                              //   floatData[jj] = d2.getFloat32(jj * Float32Array.BYTES_PER_ELEMENT, true);
                              // }
                              // console.log("LENGTH IS", floatData.length)
                              // let buffer = audioCtx.createBuffer(2, floatData.length, SAMPLE_RATE*2);
                              // buffer.getChannelData(0).set(floatData);
                              // buffer.getChannelData(1).set(floatData);
                              // let source = audioCtx.createBufferSource();
                              // source.buffer = buffer;
                              // source.connect(audioCtx.destination);
                              // source.start(self.startTime);
                              
                              // self.startTime += buffer.duration;


                            // let arrayBuffer = new ArrayBuffer(value.length)
                            // var bufferView = new Uint8Array(arrayBuffer)
                            // for(let i = 0; i < value.length; i++) {
                            //   bufferView[i] = value[i]
                            // }
                            // audioCtx.decodeAudioData(arrayBuffer, function(buffer: any) {
                            //   console.log("GETTING BUFFER", buffer )
                            //   var source = audioCtx.createBufferSource();
                            //   source.buffer = buffer;
                            //   source.connect(audioCtx.destination);
                      
                            //   source.start(self.startTime);
                            //   self.startTime += buffer.duration;
                            // });
                            //}
                            //self.queueAudioBuffer(value, index);
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
                    <div onClick={() => this.displayTracks('remix-1')}>REMIX 1</div>
                    <div onClick={() => this.displayTracks('remix-2')}>REMIX 2</div>
                </div>
    }
            </div>)
    }

}

export default Remixer;