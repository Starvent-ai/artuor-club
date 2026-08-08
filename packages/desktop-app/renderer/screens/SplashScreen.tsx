import { useEffect, useState } from "react";
import "./splash-screen.css";

const SPLASH_DURATION_MS = 4000;

interface SplashScreenProps {
  onFinished: () => void;
}

export function SplashScreen({ onFinished }: SplashScreenProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setIsFadingOut(true), SPLASH_DURATION_MS - 400);
    const finishTimer = window.setTimeout(onFinished, SPLASH_DURATION_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onFinished]);

  return (
    <div className={isFadingOut ? "splash-screen splash-screen--fade-out" : "splash-screen"}>
      <img className="splash-screen__logo" src="../assets/logo.png" alt="کلاب آرتور" />
      <p className="splash-screen__tagline">از یک ایده تا یک محصول جهانی با Starvnt</p>
    </div>
  );
}
