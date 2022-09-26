import React from 'react';


const Remixer = () => {
    return (<div>
            <h2>REMIXER COMPONENT WILL BE COOL</h2>
            <div>
                <audio id="track1" controls src="/api/stream/1">TRACK1</audio>
                <audio id="track2" controls src="/api/stream/2">TRACK2</audio>
            </div>
        </div>)

}

export default Remixer;