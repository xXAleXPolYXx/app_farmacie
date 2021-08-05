import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonModal,
  IonButton,
  IonFooter,
  IonImg,
  IonFab,
  IonFabButton,
  IonIcon,
  IonLabel,
  IonToast,
  IonList,
  IonItem,
} from '@ionic/react'

import stringManager from '../../utility/stringManager'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  MapConsumer,
  GeoJSON,
  LayersControl,
} from 'react-leaflet'

import {dismissLocationModal} from '../../redux/actions'
import classes from './Map.module.css'

import LocationMarkers from '../../components/location/LocationMarkers'
import LocationModal from '../../components/location/LocationModal'

import { Geolocation } from '@capacitor/geolocation'
import circoscrizioni from '../../data/circoscrizioni.json'
import quartieri from '../../data/quartieri.json'

import sponsor from '../../assets/img/sponsor.jpg'
import { locateSharp } from 'ionicons/icons'

const url='http://3.142.202.105:7484'

export class Map extends Component {
  
  state = {
    mapContainer: false,
    farmacie:{},
    quartieri:{},
    circoscrizioni: {},
    center:[45.438351, 10.99171],
    mapCont:null,
    gpsError:false,
  }

  async componentDidMount() {
    try {
    
    const res = await Geolocation.getCurrentPosition()
    this.center=[res.coords.latitude, res.coords.longitude]

    } catch (e) {
        this.setState({ gpsError: true })
    }

    this.GetFarmacie()
    if (this.state.mapContainer) return

    setTimeout(() => {
      this.setState({ mapContainer: true })
    }, 500)
  }

  GetFarmacie(){
    fetch(url+'/get/farmacie', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      this.setState({farmacie : data})
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  //ON EACH METHODS
  OnEachQuartiere = (quartiere, layer) =>{
    layer.bindPopup(stringManager.titleCase(quartiere.properties.quartiere))
  }

  OnEachCircoscrizione = (paese, layer) =>{
    layer.bindPopup(stringManager.titleCase(paese.properties.circoscriz))
  }

  componentDidCatch() {
    this.setState({gpsError:true})
  }

  render() {
    const { zoom, locationClicked, showModal } = this.props.map

    const centerPosition = () => {
      console.log(this.center)
      if(this.center)
        this.state.mapCont.flyTo(this.center)
      if(typeof this.center==='undefined')
        this.setState({ gpsError: true })
    }
    if(this.state.gpsError)
      return (
        <IonPage>
          <IonHeader>
            <IonToolbar>
            <IonTitle>Farmacie a Verona</IonTitle>
            </IonToolbar>
            </IonHeader>
            <IonContent>
            <IonList>
            <IonItem>
            <IonLabel className="ion-text-wrap">Errore nell'avvio dell'applicazione</IonLabel>
            </IonItem>
            <IonItem>
            <IonLabel className="ion-text-wrap">Assicurarsi che il Geolocalizzazione 
            e la connessione internet siano attive</IonLabel>
            </IonItem>
            </IonList>
          </IonContent>
        </IonPage>
      )
    else
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Farmacie a Verona</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent id="content" fullscreen>
          <IonModal isOpen={showModal} backdropDismiss={false}>   
            { locationClicked && ( <LocationModal loc={locationClicked}/> )}
            <IonButton onClick={() => this.props.dismissLocationModal()}>
              Chiudi
            </IonButton>
          </IonModal>
          
          {this.state.mapContainer && (
            <MapContainer
              className={classes.mapContainer}
              center={this.center}
              zoom={zoom}
              whenCreated={mapCont => this.setState({ mapCont })}
            >

            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Mappa base">
                <TileLayer
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>   
              <LayersControl.BaseLayer name="Circoscrizioni">
                <GeoJSON key='circoscrizioni' data={circoscrizioni.features} onEachFeature={this.OnEachCircoscrizione} />
              </LayersControl.BaseLayer>      
              <LayersControl.BaseLayer name="Quartieri">
                <GeoJSON key='quartieri' data={quartieri.features} onEachFeature={this.OnEachQuartiere} />
              </LayersControl.BaseLayer>
            </LayersControl> 


              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapConsumer>
                {map => {
                  map.setView(this.center)
                  return null
                }}
              </MapConsumer>
              <Marker position={this.center}>
                <Popup>Tu sei qui</Popup>
              </Marker>
              <LocationMarkers myloc={this.state.farmacie.features}/>
            </MapContainer>
          )}

          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => centerPosition()}>
              <IonIcon icon={locateSharp} />
            </IonFabButton>
          </IonFab>
        </IonContent>

        <IonFooter>
            <IonImg src={sponsor}
            style={{maxWidth: "500px" , margin: "auto"}}
            />
        </IonFooter>
        <IonToast
        isOpen={this.state.gpsError}
        color="danger"
        onDidDismiss={() => 
          this.setState({ gpsError: false })}
        message="Problema di caricamento mappa. Il GPS è attivo?"
        buttons={[
          {
            text: 'OK',
            role: 'cancel',
            handler: () => {
              this.setState({ gpsError: false })
            }
          }
        ]}
      />
    </IonPage>
    
    )
  }
}
const mapStateToProps = state => ({
  map: state.map,
})

const mapDispatchToProps = {dismissLocationModal}

export default connect(mapStateToProps, mapDispatchToProps)(Map)
