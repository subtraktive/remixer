import { SAMPLE_RATE } from "../Remixer";

class MasterOutput {

    computeSamplesCallback: any;
    onComputeTimeoutBound: any;
    audioContext: AudioContext;
    sampleRate: any;
    channelCount: number;
    totalBufferDuration: number;
    computeDuration: number;
    bufferDelayDuration: number;
    totalSamplesCount: number;
    computeDurationMS: number;
    computeSamplesCount: number;
    buffersToKeep: number;
    audioBufferSources: (AudioBufferSourceNode|null)[];
    computeSamplesTimeout: any;
    audioContextStartOffset: any;
    lastTimeoutTime: any;
    currentBufferTime: number;
    currentSamplesOffset: number;
    audioBuffer: any;
    channels: (Float32Array)[];
    trackIndex: number;

    constructor(computeSamplesCallback: Function, context: AudioContext, index: number) {
      this.computeSamplesCallback = computeSamplesCallback.bind(this);
      this.onComputeTimeoutBound = this.onComputeTimeout.bind(this);
      this.trackIndex = index
      this.audioContext = context;
      this.sampleRate = SAMPLE_RATE;
      this.channelCount = 2;
  
      this.totalBufferDuration = 5;
      this.computeDuration = 1;
      this.bufferDelayDuration = 0.1;
  
      this.totalSamplesCount = this.totalBufferDuration * this.sampleRate;
      this.computeDurationMS = this.computeDuration * 1000.0;
      this.computeSamplesCount = this.computeDuration * this.sampleRate;
      this.buffersToKeep = Math.ceil((this.totalBufferDuration + 2.0 * this.bufferDelayDuration) /
        this.computeDuration);
  
      this.audioBufferSources = [];
      this.computeSamplesTimeout = null;
      this.currentBufferTime = 0
      this.currentSamplesOffset = 0;
      this.channels = [];
    }

    getTotalBufferSampleCount() {
      return this.totalBufferDuration * this.sampleRate
    }
  
    startPlaying() {
      if (this.audioBufferSources.length > 0) {
        this.stopPlaying();
      }
      //console.log("WHAT IS THE CONTXT HERE _______________________________", this.audioContext)
      //Start computing indefinitely, from the beginning.
      let audioContextTimestamp = this.audioContext.getOutputTimestamp();
      this.audioContextStartOffset = audioContextTimestamp.contextTime;
      this.lastTimeoutTime = audioContextTimestamp.performanceTime;
      for (this.currentBufferTime = 0.0; this.currentBufferTime < this.totalBufferDuration;
        this.currentBufferTime += this.computeDuration) {
        this.bufferNext();
      }
      this.onComputeTimeoutBound();
    }
  
    onComputeTimeout() {
      this.bufferNext();
      this.currentBufferTime += this.computeDuration;
  
      //Readjust the next timeout to have a consistent interval, regardless of computation time.
      let nextTimeoutDuration = 2.0 * this.computeDurationMS - (performance.now() - this.lastTimeoutTime) - 1;
      this.lastTimeoutTime = performance.now();
      this.computeSamplesTimeout = setTimeout(this.onComputeTimeoutBound, nextTimeoutDuration);
    }
  
    bufferNext() {
      this.currentSamplesOffset = this.currentBufferTime * this.sampleRate;
  
      //Create an audio buffer, which will contain the audio data.
      this.audioBuffer = this.audioContext.createBuffer(this.channelCount, this.computeSamplesCount,
        this.sampleRate);
  
      //Get the audio channels, which are float arrays representing each individual channel for the buffer.
      this.channels = [];
      for (let channelIndex = 0; channelIndex < this.channelCount; ++channelIndex) {
        this.channels.push(this.audioBuffer.getChannelData(channelIndex));
      }
  
      //Compute the samples.
      this.computeSamplesCallback(this.trackIndex);
  
      //Creates a lightweight audio buffer source which can be used to play the audio data. Note: This can only be
      //started once...
      let audioBufferSource: AudioBufferSourceNode = this.audioContext.createBufferSource();
      //Set the audio buffer.
      audioBufferSource.buffer = this.audioBuffer;
      //Connect it to the output.
      audioBufferSource.connect(this.audioContext.destination);
      console.log("CONNECT TO SPEAKER")
      //Start playing when the audio buffer is due.
      audioBufferSource.start(this.audioContextStartOffset + this.currentBufferTime + this.bufferDelayDuration);
      while (this.audioBufferSources.length >= this.buffersToKeep) {
        this.audioBufferSources.shift();
      }
      this.audioBufferSources.push(audioBufferSource);
    }
  
    stopPlaying() {
      console.log("STOP PLAYING CACLLED")
      if (this.audioBufferSources.length > 0) {
        for (let audioBufferSource of this.audioBufferSources) {
          audioBufferSource && audioBufferSource.stop();
        }
        this.audioBufferSources = [];
        clearInterval(this.computeSamplesTimeout);
        this.computeSamplesTimeout = null;
      }
    }

    // processAudio(buffer) {
    //   for (let sampleIndex = 0; sampleIndex <= buffer.length ; ++sampleIndex) {
    //     //For a sine wave.
    //     this.channels[0][sampleIndex] = buffer[sampleIndex]
    //     //Copy the right channel from the left channel.
    //     this.channels[1][sampleIndex] = this.channels[0][sampleIndex];
    //   }
    // }
  }
  
  // window.onload = function() {
  //   let masterOutput = new MasterOutput(function() {
  //     //Populate the audio buffer with audio data.
  //     let currentSeconds;
  //     let frequency = 220.0;
  //     for (let sampleIndex = 0; sampleIndex <= this.computeSamplesCount; ++sampleIndex) {
  //       currentSeconds = (sampleIndex + this.currentSamplesOffset) / this.sampleRate;
  
  //       //For a sine wave.
  //       this.channels[0][sampleIndex] = 0.005 * Math.sin(currentSeconds * 2.0 * Math.PI * frequency);
  
  //       //Copy the right channel from the left channel.
  //       this.channels[1][sampleIndex] = this.channels[0][sampleIndex];
  //     }
  //   });
  //   masterOutput.startPlaying();
  // };

  export default MasterOutput