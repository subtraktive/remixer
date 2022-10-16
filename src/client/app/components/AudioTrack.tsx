import React, { RefObject } from 'react';

import styles from "./audiotrack.css";

interface progressObj {
    [key: number]: number
}

type audioTrackProps = {
    source: string,
    showControls: boolean,
    autoPlay: boolean,
    index: number,
    type: string,
    progress: progressObj
}


class AudioTrack extends React.Component<audioTrackProps> {

    progressRef: RefObject<HTMLElement>
    bufferRef: RefObject<HTMLElement>

    constructor(props: audioTrackProps){
        super(props);
        this.progressRef = React.createRef();
        this.bufferRef = React.createRef();
    }

    render(): React.ReactNode {
        const {index, source, autoPlay, showControls, type, progress} = this.props
        return (
            <div className={styles.layers}>
                {/* <audio preload={"metadata"} id={`audio-${index}`} src={source} autoPlay={autoPlay} controls={showControls} /> */}
                <div className={styles.buffered}>
                    <span ref={this.bufferRef} style={{'width': `${progress}%` }} id={styles.bufferedAmount}></span>
                </div>
                <div className={styles.progress}>
                    <span ref={this.progressRef} style={{'width': `${progress}%` }} id={styles.progressAmount}></span>
                </div>
            </div>
        )
    }
}

export default AudioTrack