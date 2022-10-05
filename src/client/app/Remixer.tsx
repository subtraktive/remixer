import React from 'react';
import AudioTrack from './components/AudioTrack';


class Remixer extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
        this.state = {
            showTracks: false,
            noOfLayers: 0,
            layers: [],
            id: null,
            genre: 'hiphop',
            duration: 30
        }
    }

    displayTracks = () =>{
        let {genre, duration} = this.state;
        fetch(`http://localhost:8080/api/track/meta?genre=${genre}&duration=${duration}`).then(res => res.json()).then(data=>{
            console.log("Got data",data)
            this.setState({
                showTracks: true,
                layers: data.layers,
                id: data.id
            }) 
        })
        
    }


    render() {
        let {showTracks, layers, id} = this.state;
        return (<div>
                { showTracks ? 
                (<div>
                    
                    <div data-id={id}>
                        {
                            layers.map((layer: string, index: number) => {
                                return <AudioTrack showControls={true} source={layer} autoPlay={true} index={index} />
                                //return <audio id={`layer-${index}`} autoPlay={true} controls src={`/api/stream/${layer}`}>`TRACK-${index}`</audio>
                            })
                        }
                    </div>
                    <div>
                        {/* <AudioTrack showControls={true} source={`/audio/DRUMS_FULL.wav`} autoPlay={true} index={10001} /> */}
                    </div>
                </div>) : 
                <div onClick={this.displayTracks}>REMIX</div>
    }
            </div>)
    }

}

export default Remixer;