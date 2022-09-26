import React from 'react';

type audioTrackProps = {
    source: string,
    id: string
}

const AudioTrack = ({source, id}: audioTrackProps) => {
    return (
        <audio id={id} src={source} />
    )
}

export default AudioTrack