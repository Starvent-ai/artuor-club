import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { App } from "./App";
import type { EntryScreenData } from "../preload/index";

function Bootstrap() {
  const [entryScreenData, setEntryScreenData] = useState<EntryScreenData | null>(null);

  useEffect(() => {
    window.arthurClub.getEntryScreenData().then(setEntryScreenData);
  }, []);

  if (!entryScreenData) {
    return null;
  }

  return (
    <App
      entryScreen={entryScreenData.entryScreen}
      staffOptions={entryScreenData.staffOptions}
      onStaffSelected={(staffId) => {
        window.arthurClub.setCurrentStaff(staffId);
      }}
    />
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<Bootstrap />);
}
