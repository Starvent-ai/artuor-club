import { useEffect, useState } from "react";
import "./settings-screen.css";
import type {
  BackupHistoryEntryDto,
  StaffOptionDto,
  TableTypeDto,
  TableDto,
  DeviceDto,
  DeviceControllerRateDto,
} from "../../preload/index";
import { formatJalaliDateTimeLabel } from "../utils/formatJalaliDateTime";


export function SettingsScreen() {
  const [isPasswordSet, setIsPasswordSet] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupHistoryEntryDto[]>([]);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [isBackupBusy, setIsBackupBusy] = useState(false);

  const [staffList, setStaffList] = useState<StaffOptionDto[]>([]);
  const [newStaffName, setNewStaffName] = useState("");

  const [tableTypes, setTableTypes] = useState<TableTypeDto[]>([]);
  const [tables, setTables] = useState<TableDto[]>([]);
  const [newTableTypeName, setNewTableTypeName] = useState("");
  const [newTableTypeRate, setNewTableTypeRate] = useState("");
  const [newTableName, setNewTableName] = useState("");
  const [newTableTypeId, setNewTableTypeId] = useState("");

  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState<"ps4" | "ps5">("ps5");
  const [ps4Rates, setPs4Rates] = useState<DeviceControllerRateDto[]>([]);
  const [ps5Rates, setPs5Rates] = useState<DeviceControllerRateDto[]>([]);

  function refreshStaffList() {
    window.arthurClub.listAllActiveStaff().then(setStaffList);
  }

  function refreshTableSetup() {
    window.arthurClub.listTableTypes().then(setTableTypes);
    window.arthurClub.listTables().then(setTables);
  }

  function refreshDeviceSetup() {
    window.arthurClub.listDevices().then(setDevices);
    window.arthurClub.listDeviceControllerRates("ps4").then(setPs4Rates);
    window.arthurClub.listDeviceControllerRates("ps5").then(setPs5Rates);
  }

  useEffect(() => {
    refreshStaffList();
    refreshTableSetup();
    refreshDeviceSetup();
  }, []);

  async function addStaff() {
    if (newStaffName.trim().length === 0) {
      return;
    }
    await window.arthurClub.createStaff({ fullName: newStaffName.trim() });
    setNewStaffName("");
    refreshStaffList();
  }

  async function deactivateStaffMember(staffId: string) {
    await window.arthurClub.deactivateStaff(staffId);
    refreshStaffList();
  }

  async function addTableType() {
    const rate = Number(newTableTypeRate);
    if (newTableTypeName.trim().length === 0 || !Number.isFinite(rate) || rate <= 0) {
      return;
    }
    await window.arthurClub.createTableType({ name: newTableTypeName.trim(), hourlyRate: rate });
    setNewTableTypeName("");
    setNewTableTypeRate("");
    refreshTableSetup();
  }

  async function updateTableTypeRate(id: string, hourlyRate: number) {
    await window.arthurClub.updateTableTypeRate({ id, hourlyRate });
    refreshTableSetup();
  }

  async function addTable() {
    if (newTableName.trim().length === 0 || newTableTypeId.length === 0) {
      return;
    }
    await window.arthurClub.createTable({ name: newTableName.trim(), tableTypeId: newTableTypeId });
    setNewTableName("");
    refreshTableSetup();
  }

  async function deactivateTableItem(tableId: string) {
    await window.arthurClub.deactivateTable(tableId);
    refreshTableSetup();
  }

  async function addDevice() {
    if (newDeviceName.trim().length === 0) {
      return;
    }
    await window.arthurClub.createDevice({ name: newDeviceName.trim(), deviceType: newDeviceType });
    setNewDeviceName("");
    refreshDeviceSetup();
  }

  async function deactivateDeviceItem(deviceId: string) {
    await window.arthurClub.deactivateDevice(deviceId);
    refreshDeviceSetup();
  }

  async function updateControllerRate(deviceType: "ps4" | "ps5", controllerCount: number, hourlyRate: number) {
    await window.arthurClub.setDeviceControllerRate({ deviceType, controllerCount, hourlyRate });
    refreshDeviceSetup();
  }

  function refreshBackupHistory() {
    window.arthurClub.listBackupHistory().then(setBackupHistory);
  }

  useEffect(() => {
    refreshBackupHistory();
  }, []);

  async function createBackup() {
    setIsBackupBusy(true);
    setBackupMessage(null);
    const result = await window.arthurClub.createManualBackup();
    setIsBackupBusy(false);

    if (result.status === "success") {
      setBackupMessage("بکاپ با موفقیت ذخیره شد");
      refreshBackupHistory();
    } else if (result.status === "failed") {
      setBackupMessage("تهیهٔ بکاپ با خطا مواجه شد");
      refreshBackupHistory();
    }
  }

  async function restoreBackup() {
    const confirmed = window.confirm(
      "بازیابی بکاپ، اطلاعات فعلی را جایگزین می‌کند و برنامه مجدداً راه‌اندازی می‌شود. ادامه می‌دهید؟"
    );
    if (!confirmed) {
      return;
    }
    setIsBackupBusy(true);
    await window.arthurClub.restoreBackup();
  }

  useEffect(() => {
    window.arthurClub.getSecurityStatus().then((status) => {
      setIsPasswordSet(status.isPasswordSet);
    });
  }, []);

  async function submit() {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage("رمز جدید و تکرار آن یکسان نیستند");
      return;
    }

    if (newPassword.length === 0 || securityQuestion.trim().length === 0 || securityAnswer.trim().length === 0) {
      setErrorMessage("همهٔ فیلدها باید تکمیل شوند");
      return;
    }

    setIsSubmitting(true);

    try {
      await window.arthurClub.setSecurityCredential({
        currentPassword: isPasswordSet ? currentPassword : undefined,
        newPassword,
        securityQuestion: securityQuestion.trim(),
        securityAnswer,
      });
      setIsPasswordSet(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSecurityQuestion("");
      setSecurityAnswer("");
      setSuccessMessage("تغییرات با موفقیت ذخیره شد");
    } catch {
      setErrorMessage("رمز عبور فعلی نادرست است");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="settings-screen">
      <div className="settings-screen__header">
        <h1 className="settings-screen__title">تنظیمات</h1>
      </div>

      <div className="settings-screen__content">
        <section className="settings-screen__section">
          <h2 className="settings-screen__section-title">رمز عبور و سؤال امنیتی</h2>

          {isPasswordSet && (
            <input
              type="password"
              className="settings-screen__input"
              placeholder="رمز عبور فعلی"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          )}

          <input
            type="password"
            className="settings-screen__input"
            placeholder={isPasswordSet ? "رمز عبور جدید" : "رمز عبور"}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <input
            type="password"
            className="settings-screen__input"
            placeholder="تکرار رمز عبور"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <input
            className="settings-screen__input"
            placeholder="سؤال امنیتی"
            value={securityQuestion}
            onChange={(event) => setSecurityQuestion(event.target.value)}
          />
          <input
            className="settings-screen__input"
            placeholder="پاسخ سؤال امنیتی"
            value={securityAnswer}
            onChange={(event) => setSecurityAnswer(event.target.value)}
          />

          {errorMessage && <p className="settings-screen__error">{errorMessage}</p>}
          {successMessage && <p className="settings-screen__success">{successMessage}</p>}

          <button
            type="button"
            className="settings-screen__save-button"
            onClick={submit}
            disabled={isSubmitting}
          >
            ذخیره تغییرات
          </button>
        </section>

        <section className="settings-screen__section">
          <h2 className="settings-screen__section-title">پشتیبان‌گیری</h2>

          <div className="settings-screen__backup-actions">
            <button
              type="button"
              className="settings-screen__save-button"
              onClick={createBackup}
              disabled={isBackupBusy}
            >
              تهیهٔ بکاپ دستی
            </button>
            <button
              type="button"
              className="settings-screen__restore-button"
              onClick={restoreBackup}
              disabled={isBackupBusy}
            >
              بازیابی از بکاپ
            </button>
          </div>

          {backupMessage && <p className="settings-screen__success">{backupMessage}</p>}

          <div className="settings-screen__backup-history">
            {backupHistory.length === 0 && (
              <p className="settings-screen__backup-empty">هنوز بکاپی ثبت نشده است</p>
            )}
            {backupHistory.map((entry) => (
              <div key={entry.id} className="settings-screen__backup-row">
                <span>{entry.type === "manual" ? "دستی" : "خودکار"}</span>
                <span>{entry.status === "success" ? "موفق" : "ناموفق"}</span>
                <span>{formatJalaliDateTimeLabel(entry.createdAt)}</span>
                <span>{entry.filePath}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-screen__section">
          <h2 className="settings-screen__section-title">مدیریت پرسنل</h2>

          <div className="settings-screen__list">
            {staffList.map((staff) => (
              <div key={staff.id} className="settings-screen__list-row">
                <span>{staff.fullName}</span>
                <button
                  type="button"
                  className="settings-screen__remove-button"
                  onClick={() => deactivateStaffMember(staff.id)}
                >
                  غیرفعال‌سازی
                </button>
              </div>
            ))}
            {staffList.length === 0 && (
              <p className="settings-screen__backup-empty">پرسنلی ثبت نشده است</p>
            )}
          </div>

          <div className="settings-screen__inline-form">
            <input
              className="settings-screen__input"
              placeholder="نام پرسنل جدید"
              value={newStaffName}
              onChange={(event) => setNewStaffName(event.target.value)}
            />
            <button type="button" className="settings-screen__save-button" onClick={addStaff}>
              افزودن پرسنل
            </button>
          </div>
        </section>

        <section className="settings-screen__section">
          <h2 className="settings-screen__section-title">مدیریت میزهای بیلیارد</h2>

          <div className="settings-screen__list">
            {tableTypes.map((type) => (
              <div key={type.id} className="settings-screen__list-row">
                <span>{type.name}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="settings-screen__rate-input"
                  defaultValue={type.hourlyRate}
                  onBlur={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value) && value > 0) {
                      updateTableTypeRate(type.id, value);
                    }
                  }}
                />
              </div>
            ))}
          </div>

          <div className="settings-screen__inline-form">
            <input
              className="settings-screen__input"
              placeholder="نام نوع میز (مثلاً بیلیارد)"
              value={newTableTypeName}
              onChange={(event) => setNewTableTypeName(event.target.value)}
            />
            <input
              type="text"
              inputMode="numeric"
              className="settings-screen__input"
              placeholder="نرخ ساعتی (تومان)"
              value={newTableTypeRate}
              onChange={(event) => setNewTableTypeRate(event.target.value)}
            />
            <button type="button" className="settings-screen__save-button" onClick={addTableType}>
              افزودن نوع میز
            </button>
          </div>

          <div className="settings-screen__list">
            {tables.map((table) => (
              <div key={table.id} className="settings-screen__list-row">
                <span>{table.name}</span>
                <span>{table.status === "free" ? "آزاد" : "در حال بازی"}</span>
                <button
                  type="button"
                  className="settings-screen__remove-button"
                  onClick={() => deactivateTableItem(table.id)}
                >
                  غیرفعال‌سازی
                </button>
              </div>
            ))}
            {tables.length === 0 && (
              <p className="settings-screen__backup-empty">میزی ثبت نشده است</p>
            )}
          </div>

          <div className="settings-screen__inline-form">
            <input
              className="settings-screen__input"
              placeholder="نام میز (مثلاً میز ۱)"
              value={newTableName}
              onChange={(event) => setNewTableName(event.target.value)}
            />
            <select
              className="settings-screen__input"
              value={newTableTypeId}
              onChange={(event) => setNewTableTypeId(event.target.value)}
            >
              <option value="">انتخاب نوع میز</option>
              {tableTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <button type="button" className="settings-screen__save-button" onClick={addTable}>
              افزودن میز
            </button>
          </div>
        </section>

        <section className="settings-screen__section">
          <h2 className="settings-screen__section-title">مدیریت دستگاه‌های PS</h2>

          <div className="settings-screen__list">
            {devices.map((device) => (
              <div key={device.id} className="settings-screen__list-row">
                <span>{device.name}</span>
                <span>{device.deviceType.toUpperCase()}</span>
                <span>{device.status === "free" ? "آزاد" : "در حال استفاده"}</span>
                <button
                  type="button"
                  className="settings-screen__remove-button"
                  onClick={() => deactivateDeviceItem(device.id)}
                >
                  غیرفعال‌سازی
                </button>
              </div>
            ))}
            {devices.length === 0 && (
              <p className="settings-screen__backup-empty">دستگاهی ثبت نشده است</p>
            )}
          </div>

          <div className="settings-screen__inline-form">
            <input
              className="settings-screen__input"
              placeholder="نام دستگاه (مثلاً PS ۱)"
              value={newDeviceName}
              onChange={(event) => setNewDeviceName(event.target.value)}
            />
            <select
              className="settings-screen__input"
              value={newDeviceType}
              onChange={(event) => setNewDeviceType(event.target.value as "ps4" | "ps5")}
            >
              <option value="ps4">PS4</option>
              <option value="ps5">PS5</option>
            </select>
            <button type="button" className="settings-screen__save-button" onClick={addDevice}>
              افزودن دستگاه
            </button>
          </div>

          <h3 className="settings-screen__subsection-title">نرخ ساعتی به ازای تعداد دسته — PS4</h3>
          <div className="settings-screen__rate-grid">
            {[1, 2, 3, 4].map((count) => (
              <div key={count} className="settings-screen__rate-cell">
                <span>{count} دسته</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="settings-screen__rate-input"
                  defaultValue={ps4Rates.find((rate) => rate.controllerCount === count)?.hourlyRate ?? 0}
                  onBlur={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value) && value >= 0) {
                      updateControllerRate("ps4", count, value);
                    }
                  }}
                />
              </div>
            ))}
          </div>

          <h3 className="settings-screen__subsection-title">نرخ ساعتی به ازای تعداد دسته — PS5</h3>
          <div className="settings-screen__rate-grid">
            {[1, 2, 3, 4].map((count) => (
              <div key={count} className="settings-screen__rate-cell">
                <span>{count} دسته</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="settings-screen__rate-input"
                  defaultValue={ps5Rates.find((rate) => rate.controllerCount === count)?.hourlyRate ?? 0}
                  onBlur={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value) && value >= 0) {
                      updateControllerRate("ps5", count, value);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
