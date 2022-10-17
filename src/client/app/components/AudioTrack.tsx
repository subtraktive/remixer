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
    getProgress: (no: number) => number,
    loaded: boolean,
    duration: number,
    hasStarted: Function
}

type audioState = {
    progress: number,
    playHead: number
}


class AudioTrack extends React.Component<audioTrackProps, audioState> {

    progressRef: RefObject<HTMLElement>
    bufferRef: RefObject<HTMLElement>
    raf: any
    playRAF: any
    

    constructor(props: audioTrackProps){
        super(props);
        this.state = {
            progress: 0,
            playHead: 0
        }
        this.progressRef = React.createRef();
        this.bufferRef = React.createRef();
        this.raf = null
        this.playRAF  = null
    }

    componentDidMount(): void {
        if(!this.props.loaded) {
            this.raf = window.requestAnimationFrame(this.updateBufferProgress)
        }
        this.playRAF = window.requestAnimationFrame(this.updatePlayHead)
    }

    updateBufferProgress = () => {
        let {index, getProgress, loaded} = this.props;
        if(!loaded) {
            let progress = getProgress(index)
            this.setState({
                progress
            })
            this.raf  = window.requestAnimationFrame(this.updateBufferProgress)
        } else {
            window.cancelAnimationFrame(this.raf)
        }
    }

    updatePlayHead = () => {
        let {duration, hasStarted} = this.props;
        let {playHead} = this.state;
        let now = performance.now();
        console.log("HAS STARTED???", hasStarted())
        if(playHead < duration*1000) {
            if(hasStarted()) {
                playHead += now - playHead
                this.setState({
                    playHead
                })
            }
            this.playRAF  = window.requestAnimationFrame(this.updatePlayHead)
        } else {
            window.cancelAnimationFrame(this.playRAF)
        }
    }

    render(): React.ReactNode {
        const {index, source, autoPlay, showControls, type, getProgress, loaded, duration} = this.props
        const {progress, playHead} = this.state;
        const playProgress = (playHead/(duration*1000))*100
        return (
            <div className={styles.layers}>
                {/* <audio preload={"metadata"} id={`audio-${index}`} src={source} autoPlay={autoPlay} controls={showControls} /> */}
                <div className={styles.buffered}>
                    <span ref={this.bufferRef} style={{'width': `${progress}%` }} id={styles.bufferedAmount}></span>
                </div>
                <div className={styles.progress}>
                    <span ref={this.progressRef} style={{'width': `${playProgress}%` }} id={styles.progressAmount}></span>
                </div>
            </div>
        )
    }
}

export default AudioTrack