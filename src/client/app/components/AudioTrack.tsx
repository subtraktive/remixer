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
    }

    render(): React.ReactNode {
        const {index, source, autoPlay, showControls, type} = this.props
        return (
            <div className={`styles.layers.concat(styles.layer-${index})`}>
                <audio preload={"metadata"} id={`audio-${index}`} src={source} autoPlay={autoPlay} controls={showControls} />
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

export default AudioTrack