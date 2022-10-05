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
            duration: 30,
            type: 'remix-1'
        }
    }

    displayTracks = (type: string) =>{
        let {genre, duration} = this.state;
        fetch(`http://localhost:8080/api/track/meta?genre=${genre}&duration=${duration}&type=${type}`).then(res => res.json()).then(data=>{
            console.log("Got data",data)
            let {layers} = data;
            layers.map((layer: any, index: number) => {
                console.log("LAYER IS", layer);
                fetch(`http://localhost:8080/api/stream/${layer}`).then((response:any) => {
                    const reader = response.body.getReader();
                    return new ReadableStream({
                      start(controller) {
                        return pump();
                        function pump() {
                          return reader.read().then((data: any) => {
                            const {done, value} = data
                            // When no more data needs to be consumed, close the stream
                            //console.log("GETTING VALUE", value, " awith done ", done)
                            if (done) {
                                console.log("DONE")
                              controller.close();
                              return;
                            }
                            // Enqueue the next data chunk into our target stream
                            controller.enqueue(value);
                            return pump();
                          });
                        }
                      }
                    })
                  }).then((stream) => new Response(stream))
                  .then((response) => response.blob())
                  .then((blob) => URL.createObjectURL(blob))
                  .then((url) => {
                    layers[index] = url
                    console.log("the layer now is", layers)
                    this.setState({
                        layers
                    })
                    //console.log(image.src = url)
                  })
                  .catch((err) => console.error(err));
            })
            this.setState({
                showTracks: true,
                //clayers: data.layers,
                id: data.id,
                type
            }) 
        })
        
    }


    render() {
        let {showTracks, layers, id, type} = this.state;

        return (<div>
                { showTracks ? 
                (<div>
                    
                    <div data-id={id}>
                        {
                            layers.map((layer: string, index: number) => {
                                let sourceUrl = layer;
                                // if(type == "remix-1"){
                                //     sourceUrl = `/api/stream/${layer}`
                                // }
                                console.log("SOURCE URI IS", sourceUrl)
                                return <AudioTrack type={type} showControls={true} source={sourceUrl} autoPlay={true} index={index} />

                                //return <AudioTrack type={type} showControls={true} source={sourceUrl} autoPlay={true} index={index} />
                                //return <audio id={`layer-${index}`} autoPlay={true} controls src={`/api/stream/${layer}`}>`TRACK-${index}`</audio>
                            })
                        }
                    </div>
                    <div>
                        {/* <AudioTrack showControls={true} source={`/audio/DRUMS_FULL.wav`} autoPlay={true} index={10001} /> */}
                    </div>
                </div>) : 
                <div>
                    <div onClick={() => this.displayTracks('remix-1')}>REMIX 1</div>
                    <div onClick={() => this.displayTracks('remix-2')}>REMIX 2</div>
                </div>
    }
            </div>)
    }

}

export default Remixer;