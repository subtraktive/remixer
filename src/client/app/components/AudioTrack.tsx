import React from 'react';

type audioTrackProps = {
    source: string,
    id: string,
    play: boolean,
    mute: boolean
}

const AudioTrack = ({source, id, play, mute}: audioTrackProps) => {
    return (
        <audio id={id} src={source} />
    )
}

export default AudioTrack