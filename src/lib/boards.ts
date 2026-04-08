import type { BoardDef } from "./types";

export const boards: BoardDef[] = [
  {
    id: "heltec_v3",
    name: "Heltec V3",
    mcu: "ESP32-S3",
    radio: "SX1262",
    family: "esp32s3",
    flashMethod: "web-serial",
    assetPattern: "donglora-heltec_v3-v{version}.bin",
    notes: "Native USB CDC-ACM (hardware mod may be required on some units)",
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
    id: "heltec_v3_uart",
    name: "Heltec V3 (UART)",
    mcu: "ESP32-S3",
    radio: "SX1262",
    family: "esp32s3",
    flashMethod: "download-only",
    assetPattern: "donglora-heltec_v3_uart-v{version}.bin",
    notes:
      "Uses CP2102 USB-to-UART bridge. Web flashing is unreliable — download the .bin and flash with espflash CLI.",
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
