export type BoardFamily = "esp32s3" | "nrf52840";
export type FlashMethod = "web-serial" | "uf2" | "download-only";

export interface BoardDef {
  id: string;
  name: string;
  mcu: string;
  radio: string;
  family: BoardFamily;
  flashMethod: FlashMethod;
  assetPattern: string;
  notes?: string;
}

export interface Release {
  tag: string;
  version: string;
  name: string;
  date: string;
  body: string;
  assets: ReleaseAsset[];
  prerelease: boolean;
}

export interface ReleaseAsset {
  name: string;
  /** browser_download_url — for <a download> links (human-facing, redirects) */
  downloadUrl: string;
  /** Proxy URL — for fetch() in the browser (avoids CORS issues with GitHub) */
  fetchUrl: string;
  size: number;
}

export type FlashState =
  | "idle"
  | "board-selected"
  | "version-selected"
  | "connecting"
  | "downloading"
  | "flashing"
  | "done"
  | "error";

export interface FlashProgress {
  phase: string;
  percent: number;
  message: string;
}
