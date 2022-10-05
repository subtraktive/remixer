import React, { RefObject } from 'react';

import styles from "./audiotrack.css";

type audioTrackProps = {
    source: string,
    showControls: boolean,
    autoPlay: boolean,
    index: number,
    type: string
}


class AudioTrack extends React.Component<audioTrackProps> {

    progressRef: RefObject<HTMLElement>
    bufferRef: RefObject<HTMLElement>

    constructor(props: audioTrackProps){
        super(props);
        this.progressRef = React.createRef();
        this.bufferRef = React.createRef();
        this.onDownload = this.onDownload.bind(this)
        this.updateTime = this.updateTime.bind(this)
    }

    onDownload(e: any){
        //console.log("the duration got is", e)
        const audioFile = e.target
        const duration = audioFile.duration;
        const bufferRef = this.bufferRef.current
        const buffered = audioFile.buffered
        console.log("GET META DATA", audioFile)
        // if (typeof (audioFile.buffered) !== 'undefined' && audioFile.buffered.length > 0) {
        //     const z = (audioFile.buffered.end(0) / duration) * 100;
        //     console.log("THE Z VALUE OF BUFFER IS", z)
        // }
        // //console.log("ON DOWNLOAD", duration, " and biffere length", buffered.length, 'and start', buffered.start(0), " and end", buffered.end(0) )
        // if (duration > 0 && duration !== Infinity) {
        //   for (let i = 0; i < audioFile.buffered.length; i++) {
        //     console.log("WIDTH CALCUATION ????", (audioFile.buffered.end(audioFile.buffered.length - 1 - i) * 100) / duration)
        //     if (
        //       audioFile.buffered.start(audioFile.buffered.length - 1 - i) <
        //       audioFile.currentTime
        //     ) {
        //         console.log("UPDATE????")
        //         if(bufferRef) {
        //             bufferRef.style.width = `${
        //                 (audioFile.buffered.end(audioFile.buffered.length - 1 - i) * 100) / duration
        //               }%`;
        //         }
             
        //       break;
        //     }
        //   }
        // }
    }

    updateTime(e: any){
        const audioFile = e.target
        const duration = audioFile.duration;
        const progressRef = this.progressRef.current
        const buffered = audioFile.buffered
        const bufferRef = this.bufferRef.current
        console.log("The data ", e)
        //console.log("================ON DOWNLOAD", duration, " and biffere length", buffered.length, 'and start', buffered.start(0), " and end", buffered.end(0) )
        
       // console.log("the update time getting called 4 times per sec", duration)
        if (duration > 0 && progressRef) {
            progressRef.style.width = `${
                audioFile.currentTime / duration * 100
            }%`;
        }

        if (typeof (audioFile.buffered) !== 'undefined' && audioFile.buffered.length > 0 && bufferRef) {
            const z = (audioFile.buffered.end(0) / duration) * 100;
            console.log("THE Z VALUE OF BUFFER IS", z)
            bufferRef.style.width = `${z}%`;
        }
    }

    canPlay(e: any) {
        console.log("CAN PLAY AUDIO ---------------------------")
    }

    onTimeChange(e: any) {
        console.log("DURATION CHANGED EVENT ?????????????????? ===============")
    }

    render(): React.ReactNode {
        const {index, source, autoPlay, showControls, type} = this.props
        return (
            <div className={`styles.layers.concat(styles.layer-${index})`}>
                <audio onDurationChange={this.onTimeChange} preload={"metadata"} onCanPlay={this.canPlay} onTimeUpdate={this.updateTime} onLoadedData={this.onDownload} id={`audio-${index}`} src={source} autoPlay={autoPlay} controls={showControls} />
                <div className={styles.buffered}>
                    <span ref={this.bufferRef} id={styles.bufferedAmount}></span>
                </div>
                <div className={styles.progress}>
                    <span ref={this.progressRef} id={styles.progressAmount}></span>
                </div>
            </div>
        )
    }
}

// const AudioTrack = ({source,showControls, autoPlay, index}: audioTrackProps) => {

    
//     console.log("RENDER")
   
   
// }

export default AudioTrack