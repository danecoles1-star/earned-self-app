import "./BootSplash.css";

const ARC_TOP = "M 352 432 A 256 256 0 0 1 848 450";
const ARC_BOTTOM = "M 352 574 A 256 256 0 0 0 848 592";
const STEP = "M 352 562 H 506 V 506 H 684 V 450 H 848";

export function BootSplash() {
  return (
    <div className="boot-splash" role="status" aria-label="Opening your session">
      <svg
        className="boot-mark"
        viewBox="300 210 600 600"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id="boot-step-gradient"
            gradientUnits="userSpaceOnUse"
            x1="352"
            y1="0"
            x2="848"
            y2="0"
          >
            <stop offset="0" stopColor="#F1F3F0" />
            <stop offset="0.3" stopColor="#7FA3B1" />
            <stop offset="0.5" stopColor="#E65A3A" />
            <stop offset="0.7" stopColor="#7FA3B1" />
            <stop offset="1" stopColor="#F1F3F0" />
          </linearGradient>
        </defs>
        <path
          className="boot-draw boot-arc-top"
          pathLength={100}
          d={ARC_TOP}
          fill="none"
          stroke="#F1F3F0"
          strokeWidth={34}
          strokeLinecap="round"
        />
        <path
          className="boot-draw boot-arc-bottom"
          pathLength={100}
          d={ARC_BOTTOM}
          fill="none"
          stroke="#F1F3F0"
          strokeWidth={34}
          strokeLinecap="round"
        />
        <path
          className="boot-draw boot-step"
          pathLength={100}
          d={STEP}
          fill="none"
          stroke="url(#boot-step-gradient)"
          strokeWidth={34}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="boot-wordmark" aria-hidden="true">
        <span>Earned</span>
        <b>Self</b>
      </div>
    </div>
  );
}
