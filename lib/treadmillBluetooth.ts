// Fitness Machine Service (FTMS) - standard Bluetooth SIG profile.
// Many console-based cardio machines (incl. some curved treadmills) broadcast
// this so apps like Zwift/Wahoo can read live data. It is NOT guaranteed that
// every treadmill model implements it - this is a best-effort "nice to have".
// The manual distance field in the UI is always the source of truth fallback.

const FTMS_SERVICE = 0x1826;
const TREADMILL_DATA_CHARACTERISTIC = 0x2acd;

export interface TreadmillReading {
  totalDistanceMeters: number | null;
}

function parseTreadmillData(value: DataView): TreadmillReading {
  let offset = 0;
  const flags = value.getUint16(offset, true);
  offset += 2;

  const speedAbsent = flags & 0x1; // bit0: 0 = speed present, 1 = absent (per spec)
  if (!speedAbsent) offset += 2; // instantaneous speed (uint16)

  const avgSpeedPresent = flags & 0x2;
  if (avgSpeedPresent) offset += 2;

  const totalDistancePresent = flags & 0x4;
  let totalDistanceMeters: number | null = null;
  if (totalDistancePresent) {
    const b0 = value.getUint8(offset);
    const b1 = value.getUint8(offset + 1);
    const b2 = value.getUint8(offset + 2);
    totalDistanceMeters = b0 | (b1 << 8) | (b2 << 16);
    offset += 3;
  }

  return { totalDistanceMeters };
}

export class TreadmillBluetoothSession {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  public latestDistance: number | null = null;
  public onReading: ((reading: TreadmillReading) => void) | null = null;

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(): Promise<void> {
    if (!navigator.bluetooth) throw new Error('เบราว์เซอร์นี้ไม่รองรับ Web Bluetooth');
    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [FTMS_SERVICE] }],
    });

    if (!this.device.gatt) throw new Error('อุปกรณ์นี้ไม่รองรับ GATT');
    const server = await this.device.gatt.connect();
    const service = await server.getPrimaryService(FTMS_SERVICE);
    this.characteristic = await service.getCharacteristic(TREADMILL_DATA_CHARACTERISTIC);

    await this.characteristic.startNotifications();
    this.characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
      const target = event.target as unknown as { value: DataView };
      const reading = parseTreadmillData(target.value);
      if (reading.totalDistanceMeters !== null) {
        this.latestDistance = reading.totalDistanceMeters;
      }
      this.onReading?.(reading);
    });
  }

  disconnect() {
    this.device?.gatt?.disconnect();
  }
}
