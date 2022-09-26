import React from 'react';
import AudioTrack from './components/AudioTrack';


class Remixer extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
        this.state = {
            showTracks: false,
            noOfTracks: 2
        }
    }

    displayTracks = () => this.setState({showTracks: true}) 

    render() {
        let {showTracks} = this.state;
        return (<div>
                { showTracks ? 
                (<div>
                    <audio id="track1" autoPlay={true} controls src="/api/stream/1">TRACK1</audio>
                    <audio id="track2" autoPlay={true} controls src="/api/stream/2">TRACK2</audio>
                </div>) : 
                <div onClick={this.displayTracks}>REMIX</div>
    }
            </div>)
    }

}

export default Remixer;