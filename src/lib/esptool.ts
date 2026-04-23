import type { FlashProgress } from "./types";

export type EspChipFamily = "esp32" | "esp32s3";

export function isWebSerialSupported(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

export interface FlashCallbacks {
  onProgress: (progress: FlashProgress) => void;
  onLog: (message: string) => void;
}

interface FlashSession {
  transport: InstanceType<Awaited<ReturnType<typeof loadEsptool>>["Transport"]>;
  loader: InstanceType<Awaited<ReturnType<typeof loadEsptool>>["ESPLoader"]>;
}

async function loadEsptool() {
  const mod = await import("esptool-js");
  return { ESPLoader: mod.ESPLoader, Transport: mod.Transport };
}

function chipFamilyLabel(family: EspChipFamily): string {
  return family === "esp32s3" ? "ESP32-S3" : "ESP32";
}

function isChipCompatible(detected: string, expected: EspChipFamily): boolean {
  if (expected === "esp32s3") return detected.includes("ESP32-S3");
  // Classic ESP32: esptool-js reports "ESP32". Exclude S2/S3/C3/C6/H2/P4 variants.
  return /^ESP32(?![-\s]?(S|C|H|P)\d)/i.test(detected);
}

export async function connect(
  callbacks: FlashCallbacks,
  expectedChip: EspChipFamily,
): Promise<FlashSession> {
  if (!isWebSerialSupported()) {
    throw new Error("Web Serial API is not supported in this browser. Use Chrome, Edge, or Opera.");
  }

  const { ESPLoader, Transport } = await loadEsptool();

  callbacks.onLog("Requesting serial port...");
  const port = await navigator.serial.requestPort();

  callbacks.onLog("Opening connection...");
  const transport = new Transport(port, true);

  const loader = new ESPLoader({
    transport,
    baudrate: 460800,
    romBaudrate: 115200,
    terminal: {
      clean: () => {},
      writeLine: (data: string) => callbacks.onLog(data),
      write: (data: string) => {
        if (data.trim()) callbacks.onLog(data.trim());
      },
    },
  });

  const expectedLabel = chipFamilyLabel(expectedChip);
  callbacks.onLog(`Connecting to ${expectedLabel}...`);
  callbacks.onProgress({ phase: "Connecting", percent: 0, message: "Detecting chip..." });
  await loader.main();

  const chip = loader.chip.CHIP_NAME;
  callbacks.onLog(`Detected: ${chip}`);

  if (!isChipCompatible(chip, expectedChip)) {
    await transport.disconnect();
    throw new Error(`Expected ${expectedLabel} but detected ${chip}. Make sure you selected the correct board.`);
  }

  return { transport, loader };
}

export async function flash(
  session: FlashSession,
  firmware: Uint8Array,
  callbacks: FlashCallbacks,
): Promise<void> {
  callbacks.onLog("Reading flash ID...");
  await session.loader.flashId();

  callbacks.onLog("Preparing to flash...");
  callbacks.onProgress({ phase: "Flashing", percent: 0, message: "Erasing flash..." });

  // Pass firmware as Uint8Array directly — NOT as a binary string.
  // pako's deflate() treats string input as UTF-8 text, which corrupts
  // every byte > 0x7F (e.g. 0xE9 becomes 0xC3 0xA9). Uint8Array is
  // handled as raw bytes.
  const fileArray = [
    {
      data: firmware,
      address: 0x0,
    },
  ];

  await session.loader.writeFlash({
    fileArray,
    flashSize: "keep",
    flashMode: "keep",
    flashFreq: "keep",
    eraseAll: false,
    compress: true,
    reportProgress: (_fileIndex: number, written: number, total: number) => {
      const percent = Math.round((written / total) * 100);
      callbacks.onProgress({
        phase: "Flashing",
        percent,
        message: `${formatBytes(written)} / ${formatBytes(total)}`,
      });
    },
    calculateMD5Hash: (_image: string) => undefined,
  } as never);

  callbacks.onLog("Verifying and finalizing...");
  callbacks.onProgress({ phase: "Finishing", percent: 100, message: "Verifying flash..." });
  await session.loader.after("hard_reset" as never);
  callbacks.onLog("Hard reset complete.");
}

export async function disconnect(session: FlashSession): Promise<void> {
  try {
    await session.transport.disconnect();
  } catch {
    // Best effort
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
