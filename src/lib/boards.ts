import type { BoardDef } from "./types";

export const boards: BoardDef[] = [
  {
    id: "elecrow_thinknode_m2",
    name: "ELECROW ThinkNode-M2",
    mcu: "ESP32-S3",
    radio: "SX1262",
    family: "esp32s3",
    flashMethod: "web-serial",
    assetPattern: "donglora-elecrow_thinknode_m2-v{version}.bin",
    notes:
      "Elecrow Meshtastic handset with SH1106 OLED. Flashes over the built-in CP2102 USB-to-UART bridge — no native USB, so clients connect via serial (BLE planned).",
  },
  {
    id: "heltec_v3_uart",
    name: "Heltec V3 (UART) — stock",
    mcu: "ESP32-S3",
    radio: "SX1262",
    family: "esp32s3",
    flashMethod: "web-serial",
    assetPattern: "donglora-heltec_v3_uart-v{version}.bin",
    notes:
      "Default Heltec V3 hardware — pick this one if you bought a stock V3. Flashes over the board's CP2102 USB-to-UART bridge. Clients connect via serial (BLE planned), not native USB.",
  },
  {
    id: "heltec_v3",
    name: "Heltec V3 (USB CDC) — modded",
    mcu: "ESP32-S3",
    radio: "SX1262",
    family: "esp32s3",
    flashMethod: "web-serial",
    assetPattern: "donglora-heltec_v3-v{version}.bin",
    notes:
      "Only choose this if you've hardware-modded your V3 for native USB CDC-ACM. Most stock V3s should use the UART variant above.",
  },
  {
    id: "heltec_v4",
    name: "Heltec V4",
    mcu: "ESP32-S3",
    radio: "SX1262",
    family: "esp32s3",
    flashMethod: "web-serial",
    assetPattern: "donglora-heltec_v4-v{version}.bin",
  },
  {
    id: "rak_wisblock_4631",
    name: "RAK WisBlock 4631",
    mcu: "nRF52840",
    radio: "SX1262",
    family: "nrf52840",
    flashMethod: "uf2",
    assetPattern: "donglora-rak_wisblock_4631-v{version}.uf2",
  },
  {
    id: "wio_tracker_l1",
    name: "Wio Tracker L1",
    mcu: "nRF52840",
    radio: "SX1262",
    family: "nrf52840",
    flashMethod: "uf2",
    assetPattern: "donglora-wio_tracker_l1-v{version}.uf2",
  },
  {
    id: "waveshare_rp2040_lora",
    name: "Waveshare RP2040-LoRa",
    mcu: "RP2040",
    radio: "SX1262",
    family: "rp2040",
    flashMethod: "uf2",
    assetPattern: "donglora-waveshare_rp2040_lora-v{version}.uf2",
  },
];

export function getAssetName(board: BoardDef, version: string): string {
  return board.assetPattern.replace("{version}", version);
}

import type { ReleaseAsset } from "./types";

export interface AssetUrls {
  /** For <a download> links */
  downloadUrl: string;
  /** For fetch() in browser — proxied to avoid CORS */
  fetchUrl: string;
}

export function findAsset(
  board: BoardDef,
  version: string,
  assets: ReleaseAsset[],
): AssetUrls | undefined {
  const expected = getAssetName(board, version);
  const asset = assets.find((a) => a.name === expected);
  if (!asset) return undefined;
  return { downloadUrl: asset.downloadUrl, fetchUrl: asset.fetchUrl };
}
