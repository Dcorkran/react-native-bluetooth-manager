import React, { PropTypes } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, TouchableOpacity, Alert} from 'react-native';
import TopBar from '../components/TopBar';
import ServiceList from '../components/ServiceList';
import Bluetooth from 'react-native-bluetooth';
import { getAppState, setAppState } from '../lib/GlobalState';

const DeviceDetail = React.createClass({
  propTypes: {
    navigator: PropTypes.func.isRequired,
  },

  getInitialState() {
    const { selectedDevice, isConnected, services } = getAppState();
    this.unsubscribe = () => {};

    return {
      device: selectedDevice,
      error: null,
      services: services || [],
      isConnected: isConnected || false,
      connectionInProgress: false,
    };
  },

  componentWillMount() {
  },

  componentWillUnmount() {
    this.unsubscribe();
  },

  disconnect() {
    this.setState({
      isConnected: false,
      connectionInProgress: true,
    });

    const { disconnectSubscription } = getAppState();
    disconnectSubscription();

    Bluetooth.disconnect(this.state.device)
    .then(() => {
      setAppState({
        isConnected: false,
        disconnectSubscription: () => {}
      });

      this.setState({
        isConnected: false,
        connectionInProgress: false,
        services: [],
      });
    });
  },

  showDisconnectAlert() {
    Alert.alert(
      'Disconnection',
      'Device connection lost'
    );
  },

  connect() {
    if (this.state.isConnected) {
      this.disconnect();
      return;
    }

    setAppState({ isConnected: false });

    this.setState({
      isConnected: false,
      connectionInProgress: true,
    });

    Bluetooth.connect(this.state.device)
    .then(() => {

      const listenForDisconnect = () => {
        const { disconnectSubscription } = getAppState();
        disconnectSubscription && disconnectSubscription();

        setAppState({
          isConnected: false,
          disconnectSubscription: () => {},
        });

        this.showDisconnectAlert();
        this.props.navigator("DeviceDiscovery");
      };

      const disconnectSubscription =
        Bluetooth.deviceDidDisconnect(this.state.device, listenForDisconnect);

      setAppState({
        isConnected: true,
        disconnectSubscription: disconnectSubscription,
      });

      this.setState({
        isConnected: true,
        connectionInProgress: false,
      });

      return Bluetooth.discoverServices(this.state.device, null, service => {
        this.setState({
          services: [...this.state.services, service]
        });
      });
    })
    .then(unsubscribe => this.unsubscribe = unsubscribe)
    .catch(error => {
      this.setState({
        error: error.message,
      });
    });
  },

  serviceSelected(service) {
    setAppState({
      selectedService: service,
      services: this.state.services,
    });

    this.props.navigator('ServiceDetail');
  },

  goBack() {
    const { disconnectSubscription, isConnected } = getAppState();

    if (isConnected) {
      disconnectSubscription && disconnectSubscription();
      Bluetooth.disconnect(this.state.device);
    }

    setAppState({
      selectedDevice: null,
      isConnected: false,
      disconnectSubscription: () => {},
      services: [],
    });

    this.props.navigator('DeviceDiscovery');
  },

  renderError() {
    if (this.state.error == null) return null;

    return (<Text style={styles.errorText}>{this.state.error}</Text>);
  },

  renderStatus() {
    if (this.state.connectionInProgress) {
      return <ActivityIndicator animating={true} />;
    }

    return (
      <View style={styles.statusContainer}>
        <TouchableOpacity onPress={this.connect}>
          <Text style={styles.statusText}>{this.state.isConnected ? 'Disconnect' : 'Connect'}</Text>
        </TouchableOpacity>
      </View>
    );
  },

  renderServiceLabel() {
    if (!this.state.isConnected) return null;

    return <Text style={styles.labelText}>Services</Text>;
  },

  render() {
    return (
      <View style={styles.container}>
        <TopBar
          headerText={"Device - " + this.state.device.name}
          backAction={ this.goBack } />
        {this.renderError()}
        {this.renderStatus()}
        {this.renderServiceLabel()}
        <View style={styles.listContainer}>
          <ServiceList services={this.state.services} selectService={this.serviceSelected} />
        </View>
      </View>
    );
  },
});

const styles = StyleSheet.create({
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 5,
    padding: 5,
  },
  statusText: {
    fontSize: 20,
    color: '#00AFEE',
  },
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  labelText: {
    fontSize: 20,
    color: 'grey',
    marginLeft: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
});

export default DeviceDetail;
