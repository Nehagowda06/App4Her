import * as Device from "expo-device";
import * as Network from "expo-network";

type QuickScanResult = {
  networks: string[];
  bluetoothDevices: string[];
  suspicious: boolean;
  warning: string | null;
};

const unknownPatterns = ["unknown", "unnamed", "unavailable"];

const hasUnknownPattern = (value: string) =>
  unknownPatterns.some((pattern) => value.toLowerCase().includes(pattern));

export const roomSafetyService = {
  async runQuickScan(): Promise<QuickScanResult> {
    const networks: string[] = [];
    const bluetoothDevices: string[] = [];
    let suspicious = false;

    try {
      const networkState = await Network.getNetworkStateAsync();
      const ipAddress = await Network.getIpAddressAsync();
      networks.push(
        `Connection: ${networkState.isConnected ? "Connected" : "Disconnected"}`
      );
      networks.push(`Type: ${networkState.type}`);
      networks.push(`IP: ${ipAddress}`);

      if (!networkState.isConnected || networkState.type === Network.NetworkStateType.UNKNOWN) {
        suspicious = true;
      }
    } catch {
      networks.push("Network scan unavailable");
      suspicious = true;
    }

    try {
      const deviceLabel = Device.deviceName || Device.modelName || "Unknown device";
      bluetoothDevices.push(deviceLabel);

      if (hasUnknownPattern(deviceLabel)) {
        suspicious = true;
      }
    } catch {
      bluetoothDevices.push("Bluetooth scan unavailable in current mode");
      suspicious = true;
    }

    return {
      networks,
      bluetoothDevices,
      suspicious,
      warning: suspicious
        ? "Unknown devices detected. Inspect surroundings."
        : null
    };
  }
};
