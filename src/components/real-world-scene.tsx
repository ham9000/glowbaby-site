import { useId } from "react";
import { StrollerGraphic } from "@/components/stroller-graphic";

type RealWorldSceneProps = {
  scene: "evening-walk" | "park-path" | "family-event";
  className?: string;
};

const scenes = {
  "evening-walk": {
    label:
      "Concept illustration: an adult pushes a stroller along a neighborhood pavement at dusk, past houses with lit windows. A white-rimmed disc below the basket casts cyan, purple, and peach light outward and down onto the pavement.",
    sky: "#302243",
    horizon: "#9b6d87",
    stroller: "translate(308 210) scale(.76)",
    caregiver: "translate(298 213)",
    coat: "#aaa0cb",
  },
  "park-path": {
    label:
      "Concept illustration: a caregiver pushes a stroller on a winding park path among trees, a bench, and path markers after sunset. A white-rimmed disc below the basket casts cyan, purple, and peach light outward and down onto the path.",
    sky: "#111e30",
    horizon: "#506776",
    stroller: "translate(376 202) scale(.78)",
    caregiver: "translate(367 206)",
    coat: "#86b7bd",
  },
  "family-event": {
    label:
      "Concept illustration: an adult pushes a stroller along a path beside an outdoor family gathering, with string lights, bunting, and people in the distance. A white-rimmed disc below the basket casts cyan, purple, and peach light outward and down onto the ground.",
    sky: "#211832",
    horizon: "#785064",
    stroller: "translate(250 228) scale(.74)",
    caregiver: "translate(239 230)",
    coat: "#d3a69f",
  },
} as const;

function Window({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="34" height="46" rx="3" fill="#efb69e" opacity=".76" />
      <path d="M17 1v44M1 24h32" stroke="#514051" strokeWidth="4" />
      <path d="M-4 49h42" stroke="#a0879e" strokeWidth="4" />
    </g>
  );
}

function Neighborhood() {
  return (
    <g>
      <circle cx="781" cy="95" r="40" fill="#e9cecc" opacity=".07" />
      <circle cx="781" cy="95" r="21" fill="#ecd3d0" opacity=".9" />
      <path d="M0 277 79 234l80 24 101-51 93 54 112-31 107 36 108-48 91 34 112-29 77 30v171H0Z" fill="#4c3a59" />
      <path d="M30 206 151 119l120 87" fill="#352a42" stroke="#9c7f9c" strokeWidth="5" strokeLinejoin="round" />
      <path d="M51 206h199v180H51Z" fill="#695367" />
      <path d="M175 141v-39h26v58" fill="#695367" />
      <path d="M50 206h201v15H50Z" fill="#34283f" opacity=".45" />
      <Window x={80} y={239} />
      <Window x={181} y={239} />
      <rect x="132" y="309" width="39" height="77" rx="3" fill="#382c46" />
      <rect x="143" y="319" width="17" height="27" rx="2" fill="#efb69e" opacity=".65" />
      <circle cx="161" cy="358" r="2" fill="#d6bfd9" />
      <path d="M121 385h60l9 13h-78Z" fill="#9a8197" />
      <path d="m677 210 118-77 124 77" fill="#31273f" stroke="#967691" strokeWidth="5" strokeLinejoin="round" />
      <path d="M696 209h206v177H696Z" fill="#58465e" />
      <Window x={723} y={244} />
      <Window x={839} y={244} />
      <Window x={839} y={314} />
      <rect x="767" y="311" width="39" height="75" rx="3" fill="#31263e" />
      <path d="M756 385h61l10 13h-81Z" fill="#91798f" />
      <path d="M278 360h387M278 384h387" stroke="#9c849c" strokeWidth="6" />
      {[286, 330, 374, 418, 462, 506, 550, 594, 638].map((x) => (
        <path key={x} d={`M${x} 344v54`} stroke="#88728e" strokeWidth="7" strokeLinecap="round" />
      ))}
      <path d="M0 397v-45c24-24 46-16 58 5 30-11 55 3 59 40ZM884 398c-6-25 8-45 33-40 5-26 29-28 43-18v58Z" fill="#2c3040" />
      <path d="M0 402h960v79H0Z" fill="#242330" />
      <path d="M0 432h960" stroke="#a68a9d" strokeWidth="9" />
      <path d="M0 442h960v198H0Z" fill="#393343" />
      <path d="M0 452h960M0 576h960M99 443 18 640M330 443l-35 197M679 443l52 197M855 443l103 197" stroke="#746579" strokeWidth="2" opacity=".43" />
      <path d="M904 432V218m-28 0h53l-7-29h-38Z" stroke="#322938" strokeWidth="8" strokeLinejoin="round" />
      <path d="M884 194h36v22h-36Z" fill="#f5c6a6" />
      <circle cx="902" cy="207" r="31" fill="#f5c6a6" opacity=".08" />
      <path d="m891 432-30 9h85l-30-9" fill="#211e2a" />
      <path d="m70 513 43-1m709 98 47-2" stroke="#afa0b1" strokeWidth="3" strokeLinecap="round" opacity=".25" />
    </g>
  );
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-10 20-6-142H9L15 20Z" fill="#332d3c" />
      <path d="m1-88-44-56m47 33 41-66" stroke="#514657" strokeWidth="9" strokeLinecap="round" />
      <path d="M-9-121c-50 17-92-12-85-47-22-35 8-77 40-75-3-44 58-62 82-30 49-13 81 28 64 57 45 44 7 97-43 89-16 19-41 22-58 6Z" fill="#243b43" />
      <path d="M-89-193c-4-26 15-48 37-47-1-34 45-51 70-32-32-1-45 17-43 42-33-6-51 12-64 37Z" fill="#547279" opacity=".55" />
      <path d="M31-264c38-3 68 32 54 63 33 32 17 62-11 72 11-28-5-42-25-51 14-32 8-60-18-84Z" fill="#1c2d38" />
      <path d="m-6-128 10 17" stroke="#7a8890" strokeWidth="3" strokeLinecap="round" opacity=".45" />
    </g>
  );
}

function Park() {
  return (
    <g>
      <circle cx="668" cy="85" r="27" fill="#dbe7e3" opacity=".12" />
      <path d="M680 66a23 23 0 1 0 3 38 24 24 0 0 1-3-38Z" fill="#dbe7e3" />
      <path d="M0 285c115-91 208-26 319-37 116-13 140-56 248-50 125 8 209 108 393 29v222H0Z" fill="#314750" />
      <path d="M0 345c171-95 331 24 489-27 201-65 286-24 471-5v327H0Z" fill="#22353c" />
      <path d="M766 304c-151 44-39 95-179 116C411 446 273 464 149 640h755c-147-135-317-141-283-189 34-45 79-54 97-80 17-23 10-46 63-67Z" fill="#50505b" />
      <path d="M766 304c-151 44-39 95-179 116C411 446 273 464 149 640" stroke="#869397" strokeWidth="5" opacity=".63" />
      <path d="M781 304c-53 21-46 44-63 67-18 26-63 35-97 80-34 48 136 54 283 189" stroke="#8b9b9e" strokeWidth="4" opacity=".4" />
      <path d="m715 335-12 8m-14 23-3 14m-21 22-25 11M320 595l-36 33" stroke="#c6c2c9" strokeWidth="4" strokeLinecap="round" opacity=".38" />
      <Tree x={106} y={408} scale={1.14} />
      <Tree x={832} y={382} scale={1.06} />
      <Tree x={928} y={380} scale={0.72} />
      <Tree x={515} y={331} scale={0.56} />
      <g transform="translate(196 332)">
        <path d="M4 46v36m120-36v36M-4 16h135M-4 34h135" stroke="#252330" strokeWidth="7" strokeLinecap="round" />
        <path d="M-4 13h135M-4 30h135" stroke="#9a8991" strokeWidth="9" strokeLinecap="round" />
        <path d="M-13 50h151l-9 11H-4Z" fill="#776879" />
        <path d="M0 46V22m127 24V22" stroke="#49404f" strokeWidth="6" />
      </g>
      <g transform="translate(745 362)">
        <rect width="11" height="47" rx="3" fill="#151f2a" />
        <rect x="1" y="4" width="9" height="8" rx="2" fill="#d5e6d6" opacity=".78" />
        <ellipse cx="5" cy="48" rx="17" ry="4" fill="#14222a" />
      </g>
      <g transform="translate(785 442)">
        <rect width="15" height="61" rx="4" fill="#151f2a" />
        <rect x="2" y="5" width="11" height="11" rx="2" fill="#d5e6d6" opacity=".85" />
        <ellipse cx="7" cy="63" rx="25" ry="6" fill="#14222a" />
      </g>
      <path d="m34 511 13 38 8-53 14 48 23-25m751 57 12 38 12-55 9 49 20-25M68 603l20 37 9-51 13 43 16-23" stroke="#658080" strokeWidth="4" strokeLinecap="round" opacity=".58" />
      <path d="m162 455 8 19 14-6m652-69 10 14 12-8" stroke="#9c8aab" strokeWidth="4" strokeLinecap="round" opacity=".7" />
    </g>
  );
}

function DistantGuest({ x, y, coat, scale = 1 }: { x: number; y: number; coat: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="111" rx="21" ry="5" fill="#1c1b28" opacity=".5" />
      <path d="m-9 71-4 37m20-37 9 37" stroke="#302839" strokeWidth="11" strokeLinecap="round" />
      <path d="M-13 34q13-9 26 0l6 42h-39Z" fill={coat} />
      <path d="m-12 40-13 33m37-33 15 26" stroke={coat} strokeWidth="9" strokeLinecap="round" />
      <circle cy="16" r="13" fill="#c39687" />
      <path d="M-13 18c-7-23 23-25 27-7-11-2-15-3-22-9l-2 18Z" fill="#312936" />
    </g>
  );
}

function FamilyEvent() {
  const bulbs = [
    [82, 133], [203, 163], [331, 184], [463, 194],
    [592, 190], [721, 173], [850, 145],
  ];

  return (
    <g>
      <path d="M0 280c95-57 167-20 246-5 100 20 178-33 272-32 171 1 237 66 442 2v204H0Z" fill="#3d3447" />
      <path d="M0 362c157-32 304 19 442-2 211-34 305 38 518-8v288H0Z" fill="#30373e" />
      <path d="M73 110v291M884 108v294" stroke="#89737e" strokeWidth="8" strokeLinecap="round" />
      <path d="M0 103q480 188 960 0" stroke="#27232e" strokeWidth="4" />
      {bulbs.map(([x, y]) => (
        <g key={x}>
          <path d={`M${x} ${y - 10}v11`} stroke="#27232e" strokeWidth="3" />
          <circle cx={x} cy={y + 5} r="22" fill="#f3ba94" opacity=".08" />
          <circle cx={x} cy={y + 5} r="10" fill="#f3ba94" opacity=".15" />
          <circle cx={x} cy={y + 5} r="5" fill="#f8d4b0" />
        </g>
      ))}
      <path d="M73 113q405 91 811 0" stroke="#c6a5ae" strokeWidth="2" opacity=".65" />
      <path d="m148 128 37 7-25 29Z" fill="#c397b5" />
      <path d="m238 143 37 5-24 29Z" fill="#dfaa99" />
      <path d="m331 153 37 3-22 31Z" fill="#87b8bb" />
      <path d="m425 157 37 1-19 33Z" fill="#b29ad6" />
      <path d="m520 157 37-2-17 34Z" fill="#dfaa99" />
      <path d="m615 151 37-4-15 35Z" fill="#87b8bb" />
      <path d="m710 141 37-6-13 34Z" fill="#c397b5" />
      <path d="m800 127 37-7-12 35Z" fill="#dfaa99" />
      <DistantGuest x={119} y={280} coat="#a98cab" scale={0.95} />
      <DistantGuest x={179} y={315} coat="#b5b797" scale={0.62} />
      <DistantGuest x={705} y={276} coat="#9a8db7" />
      <DistantGuest x={832} y={273} coat="#92b7b2" scale={1.04} />
      <DistantGuest x={890} y={310} coat="#d0a092" scale={0.68} />
      <g transform="translate(704 343)">
        <path d="M5 0v58m135-58v58" stroke="#292630" strokeWidth="8" />
        <path d="M-14-10h169l13 20H-24Z" fill="#b998aa" />
        <path d="M-24 10h192v24c-20-8-29 8-49 0-23-9-30 10-52 1-27-11-34 9-56 0-12-5-23-4-35 1Z" fill="#a689a0" />
        <path d="M61-10v46" stroke="#ddbdc2" strokeWidth="3" opacity=".5" />
        <path d="M24-17h27l-4 7H28Z" fill="#d2c0cf" />
        <rect x="109" y="-30" width="13" height="20" rx="3" fill="#e3c1ab" />
        <circle cx="115" cy="-30" r="5" fill="#f7d5b2" />
      </g>
      <path d="M0 430c270-29 593-15 960 29v181H0Z" fill="#4a3e4c" />
      <path d="M0 430c270-29 593-15 960 29" stroke="#a48a99" strokeWidth="5" opacity=".65" />
      <path d="M0 563c304-27 633-17 960 18M138 419 47 640M432 417l-23 223M714 435l66 205" stroke="#9b8094" strokeWidth="2" opacity=".24" />
      <path d="m15 384 8 35 13-21m899 33 8-38 8 24" stroke="#91a28c" strokeWidth="4" strokeLinecap="round" opacity=".6" />
      <path d="m777 550 7 3m-62 57 8-4m-639-92 9 2" stroke="#d7afbc" strokeWidth="3" strokeLinecap="round" opacity=".4" />
    </g>
  );
}

function Caregiver({ transform, coat }: { transform: string; coat: string }) {
  return (
    <g transform={transform}>
      <ellipse cx="0" cy="339" rx="73" ry="10" fill="#15111e" opacity=".4" />
      <path d="m-16 176-9 83-25 64" stroke="#332c44" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m15 179 9 74 25 70" stroke="#494056" strokeWidth="27" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m-28 252-24 72m78-72 24 70" stroke="#b29fb9" strokeWidth="3" strokeLinecap="round" opacity=".32" />
      <path d="m-60 320 22 3 2 10-1 7h-47c-5-9 10-14 24-20Z" fill="#d5c6d6" />
      <path d="m37 320 23-2 9 11 17 6v7H39Z" fill="#e0cfdb" />
      <path d="M-13 47 16 45l20 15 1 71-8 57c-21 10-43 8-61 0l9-66-4-57Z" fill={coat} />
      <path d="m-12 48 5 36 18-2 5-37" fill="#ece0e6" opacity=".65" />
      <path d="M-9 86v98m28-58 10 3" stroke="#f0e3f1" strokeWidth="2" opacity=".48" />
      <path d="m-17 72-18 55 10 35" stroke={coat} strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m-26 155 3 10" stroke="#dba994" strokeWidth="12" strokeLinecap="round" />
      <path d="m21 73 28 39 25-17" stroke={coat} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m27 77 23 27 21-13" stroke="#f5e2ed" strokeWidth="3" strokeLinecap="round" opacity=".43" />
      <path d="m72 96 12-1" stroke="#dba994" strokeWidth="12" strokeLinecap="round" />
      <path d="M-4 34v15c5 6 13 5 17-1l-2-15" fill="#bd8c80" />
      <path d="M-16 14c0-25 36-26 38-4l-1 18c-3 19-22 23-32 6Z" fill="#dfb29e" />
      <path d="M-17 22c-11-18-3-35 15-35 19-2 27 9 25 22-13 1-20-3-26-11l-5 27Z" fill="#342736" />
      <circle cx="-17" cy="-4" r="12" fill="#342736" />
      <path d="M-15 0c3-8 13-12 22-8" stroke="#78566b" strokeWidth="3" strokeLinecap="round" />
      <path d="m20 19 5 6-6 2" fill="#dfb29e" />
    </g>
  );
}

export function RealWorldScene({ scene, className }: RealWorldSceneProps) {
  const id = useId();
  const setting = scenes[scene];
  const sky = `${id}-sky`;
  const glow = `${id}-glow`;
  const beam = `${id}-beam`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 960 640"
      width={960}
      height={640}
      className={className}
      role="img"
      aria-label={setting.label}
      fill="none"
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="440" gradientUnits="userSpaceOnUse">
          <stop stopColor={setting.sky} />
          <stop offset="1" stopColor={setting.horizon} />
        </linearGradient>
        <radialGradient id={glow}>
          <stop stopColor="#cebcff" stopOpacity=".76" />
          <stop offset=".3" stopColor="#ac83f4" stopOpacity=".5" />
          <stop offset=".66" stopColor="#8671c3" stopOpacity=".24" />
          <stop offset="1" stopColor="#8671c3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={beam} x1="311" y1="414" x2="311" y2="488" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d3c4ff" stopOpacity=".38" />
          <stop offset="1" stopColor="#ac83f4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="960" height="640" fill={`url(#${sky})`} />
      <g fill="#e4ddec">
        <circle cx="129" cy="72" r="2" opacity=".6" />
        <circle cx="358" cy="96" r="1.5" opacity=".65" />
        <circle cx="548" cy="47" r="2" opacity=".55" />
        <circle cx="891" cy="72" r="1.5" opacity=".7" />
        <circle cx="618" cy="125" r="1.5" opacity=".5" />
      </g>
      {scene === "evening-walk" && <Neighborhood />}
      {scene === "park-path" && <Park />}
      {scene === "family-event" && <FamilyEvent />}
      <Caregiver transform={setting.caregiver} coat={setting.coat} />
      <g transform={setting.stroller} aria-hidden="true">
        <ellipse cx="311" cy="469" rx="264" ry="71" fill={`url(#${glow})`} />
        <path d="m266 414-126 65q171 51 342 0L356 414Z" fill={`url(#${beam})`} />
        <StrollerGraphic showController={false} />
      </g>
    </svg>
  );
}
