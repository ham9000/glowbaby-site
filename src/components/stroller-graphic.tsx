type StrollerGraphicProps = {
  className?: string;
  width?: number;
  height?: number;
};

export function StrollerGraphic({
  className,
  width = 640,
  height = 520,
}: StrollerGraphicProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 520"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="Glowbaby Stroller Light concept: a compact light mounted below the stroller basket casts a soft colorful glow outward, around, and down onto the ground; a separate controller sits alongside"
      fill="none"
    >
      <ellipse cx="315" cy="460" rx="235" ry="23" fill="#050309" opacity=".3" />
      {[1, 0.88, 0.76, 0.64, 0.52, 0.4].map((scale) => (
        <g key={scale}>
          <ellipse cx="310" cy="418" rx={178 * scale} ry={40 * scale} fill="#b695ff" opacity=".035" />
          <ellipse cx="269" cy="421" rx={130 * scale} ry={34 * scale} fill="#19bff2" opacity=".035" />
          <ellipse cx="354" cy="421" rx={136 * scale} ry={36 * scale} fill="#f5b4a4" opacity=".025" />
          <ellipse cx="311" cy="445" rx={135 * scale} ry={30 * scale} fill="#b695ff" opacity=".025" />
          <ellipse cx="312" cy="465" rx={205 * scale} ry={34 * scale} fill="#a57aff" opacity=".055" />
          <ellipse cx="255" cy="466" rx={130 * scale} ry={25 * scale} fill="#19bff2" opacity=".055" />
          <ellipse cx="370" cy="466" rx={112 * scale} ry={25 * scale} fill="#f5b4a4" opacity=".055" />
        </g>
      ))}

      <path
        d="M140 158 167 157 232 267 455 411"
        stroke="#6e657e"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="204" cy="419" r="39" fill="#16121f" stroke="#625b70" strokeWidth="8" />
      <circle cx="455" cy="415" r="28" fill="#16121f" stroke="#625b70" strokeWidth="7" />
      <path d="m217 337 184 5-26 56H245Z" fill="#272032" stroke="#61546f" strokeWidth="3" />
      <path d="m231 349 152 3-16 33H252Z" fill="#41324f" />
      <path d="m252 357 113 2-9 15h-95Z" fill="#5a466b" opacity=".45" />

      <path
        d="m163 205 285 215M279 284 170 426"
        stroke="#b8aec9"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m169 209 262 198M273 291l-89 119"
        stroke="#f0eaf8"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".65"
      />
      <path
        d="m210 179 40 111 92 9 53 43-31 9-45-26-91-6-49-122Z"
        fill="#8c7b9f"
        stroke="#c7b6d8"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="m218 188 33 94c5 14 12 19 28 20l54 2-17 13-75-5-43-114Z"
        fill="#d8c8e6"
      />
      <path d="m262 284 73 4 16 16-70-2c-11 0-16-5-19-18Z" fill="#f5b4a4" />
      <path
        d="m325 267 39-3c10-1 18 7 18 16v15"
        stroke="#d8cddd"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path d="m366 347 35-3" stroke="#d7cce2" strokeWidth="10" strokeLinecap="round" />

      <path
        d="M180 198c-2-57 32-113 97-120 61-7 111 33 137 103l-24 29-74-8-73 12Z"
        fill="#c5b6ef"
        stroke="#ece4ff"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M181 194c13-62 50-99 96-108-31 30-49 67-50 123Z" fill="#e5dcfb" />
      <path d="M278 83c24 20 49 63 55 119l57 8 24-29c-26-69-75-109-136-98Z" fill="#a68fd4" />
      <path d="M278 84c24 21 48 66 55 116" stroke="#e5dcfb" strokeWidth="2" opacity=".7" />
      <path d="m181 198 62 16 73-12 74 8 24-29" stroke="#f5efff" strokeWidth="5" strokeLinecap="round" />
      <path
        d="m178 233-52-101H91"
        stroke="#c4b9d4"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M89 132h34" stroke="#35303e" strokeWidth="20" strokeLinecap="round" />
      <path d="M90 127h27" stroke="#6f647c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="277" cy="286" r="13" fill="#50425f" stroke="#d9cde7" strokeWidth="3" />
      <circle cx="277" cy="286" r="4" fill="#c9bce1" />

      <rect x="303" y="395" width="16" height="12" rx="3" fill="#776a87" />
      <rect x="279" y="402" width="64" height="22" rx="9" fill="#211a2d" stroke="#a99bbc" strokeWidth="2" />
      <path d="M290 408h42" stroke="#70617f" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="311" cy="422" rx="25" ry="5" fill="#c8dcff" />
      <ellipse cx="302" cy="422" rx="15" ry="4" fill="#b0f1ff" />
      <ellipse cx="321" cy="422" rx="13" ry="4" fill="#f5d6ec" />
      <ellipse cx="311" cy="423" rx="13" ry="2" fill="#f2f6ff" />

      <circle cx="170" cy="430" r="43" fill="#18141f" stroke="#c0b6ce" strokeWidth="9" />
      <circle cx="170" cy="430" r="29" stroke="#564b63" strokeWidth="2" />
      <circle cx="170" cy="430" r="10" fill="#a295b3" />
      <circle cx="440" cy="426" r="32" fill="#18141f" stroke="#c0b6ce" strokeWidth="8" />
      <circle cx="440" cy="426" r="20" stroke="#564b63" strokeWidth="2" />
      <circle cx="440" cy="426" r="8" fill="#a295b3" />

      <ellipse cx="541" cy="448" rx="52" ry="10" fill="#050309" opacity=".3" />
      <rect x="494" y="353" width="94" height="77" rx="20" fill="#19141f" stroke="#9685ad" strokeWidth="2" />
      <path d="M509 361h62c5 0 9 4 9 9" stroke="#c9b8df" strokeWidth="2" opacity=".45" strokeLinecap="round" />
      <circle cx="574" cy="368" r="4" fill="#82e7b0" />
      <path
        d="M546 380a13 13 0 1 0 2 20v-9h-11"
        stroke="#e5dcfb"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="529" y="421" width="24" height="7" rx="3.5" fill="#08060c" stroke="#655775" />
    </svg>
  );
}
