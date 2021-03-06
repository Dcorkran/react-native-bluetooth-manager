//
//  CentralEventHandler.swift
//  ReactNativeBluetooth
//

import Foundation
import CoreBluetooth

enum BluetoothState {
    case Unknown
    case Resetting
    case Unsupported
    case Unauthorized
    case PoweredOff
    case PoweredOn
}

class CentralEventHandler: NSObject, CBCentralManagerDelegate {
    private var onStateChange: (BluetoothState -> Void)?
    private var onDeviceDiscovered: (CBPeripheral -> Void)?
    private var onDeviceConnected: (CBPeripheral -> Void)?
    private var onDeviceConnectedOnce: (CBPeripheral -> Void)?
    private var onDeviceDisconnected: (CBPeripheral -> Void)?

    func onStateChange(handler: BluetoothState -> Void) -> Void {
        self.onStateChange = handler
    }

    func onDeviceDiscovered(handler: CBPeripheral -> Void) -> Void {
        self.onDeviceDiscovered = handler
    }

    func onDeviceConnected(handler: CBPeripheral -> Void) -> Void {
        self.onDeviceConnected = handler
    }

    func onDeviceDisconnected(handler: CBPeripheral -> Void) -> Void {
        self.onDeviceDisconnected = handler
    }

    /**
     *  Waits to check powered on state and handles other cases.
     */
    @objc func centralManagerDidUpdateState(central: CBCentralManager) {
        guard let callback = onStateChange else {
            print("State changed but no callback registered \(central.state)")
            return
        }

        switch central.state {
        case .Unknown:
            callback(BluetoothState.Unknown)
            break
        case .Resetting:
            callback(BluetoothState.Resetting)
            break
        case .Unsupported:
            callback(BluetoothState.Unsupported)
            break
        case .Unauthorized:
            callback(BluetoothState.Unauthorized)
            break
        case .PoweredOff:
            callback(BluetoothState.PoweredOff)
            break
        case .PoweredOn:
            callback(BluetoothState.PoweredOn)
        }
    }

    /**
     *  Handles the case where a peripheral is discovered.
     */
    @objc func centralManager(central: CBCentralManager, didDiscoverPeripheral peripheral: CBPeripheral,
                              advertisementData: [String : AnyObject], RSSI: NSNumber) {
        print("Discovered \(peripheral.name) at \(RSSI)")

        guard let callback = onDeviceDiscovered else {
            print("Device discovered but no callback registered.")
            return
        }

        callback(peripheral)
    }

    /**
     *  Handles the case where a peripheral is connected.
     */
    func centralManager(central: CBCentralManager, didConnectPeripheral peripheral: CBPeripheral) {
        print("Peripheral Connected", peripheral.name)

        guard let callback = onDeviceConnected else {
            print("Peripheral connected but no callback registered.", peripheral.name)
            return
        }

        callback(peripheral)
    }

    /**
     *  Handles the case where a peripheral is disconnected.
     */
    func centralManager(central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: NSError?) {
        print("Peripheral Disconnected")

        guard let callback = onDeviceDisconnected else {
            print("Peripheral disconnected but no callback registered.", peripheral.name)
            return
        }

        callback(peripheral)
    }
}
