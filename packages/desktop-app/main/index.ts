import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
import { createAppDatabaseConnection } from "./database";
import { registerStaffHandlers } from "./ipc/staffHandlers";
import { registerTableHandlers } from "./ipc/tableHandlers";
import { registerOpenTabHandlers } from "./ipc/openTabHandlers";
import { registerBuffetHandlers } from "./ipc/buffetHandlers";
import { registerSecurityHandlers } from "./ipc/securityHandlers";
import { registerReportHandlers } from "./ipc/reportHandlers";
import { registerBackupHandlers } from "./ipc/backupHandlers";
import { registerPsHandlers } from "./ipc/psHandlers";
import { registerTransactionHandlers } from "./ipc/transactionHandlers";
import { registerLedgerHandlers } from "./ipc/ledgerHandlers";

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    backgroundColor: "#0a0a0d",
    icon: join(__dirname, "..", "..", "..", "assets", "icon.png"),
    webPreferences: {
      preload: join(__dirname, "..", "preload", "index.js"),
    },
  });

  window.loadFile(join(__dirname, "..", "..", "renderer", "index.html"));

  window.once("ready-to-show", () => {
    window.show();
  });

  return window;
}

app.whenReady().then(() => {
  const databaseFilePath = join(app.getPath("userData"), "arthur-club.db");
  const connection = createAppDatabaseConnection(databaseFilePath);
  registerStaffHandlers(ipcMain, connection);
  registerTableHandlers(ipcMain, connection);
  registerOpenTabHandlers(ipcMain, connection);
  registerBuffetHandlers(ipcMain, connection);
  registerSecurityHandlers(ipcMain, connection);
  registerReportHandlers(ipcMain, connection);
  registerBackupHandlers(ipcMain, connection, databaseFilePath);
  registerPsHandlers(ipcMain, connection);
  registerTransactionHandlers(ipcMain, connection);
  registerLedgerHandlers(ipcMain, connection);
  mainWindow = createMainWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
  }
});
