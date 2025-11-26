// src/components/LoginGraphic.tsx
const LoginGraphic = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: 'skewX(15deg)', /* 反向倾斜以抵消父容器的倾斜 */
    }}
  >
    <svg
      width="60%"
      height="60%"
      viewBox="0 0 800 800"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1890ff', stopOpacity: 0.8 }} />
          <stop
            offset="100%"
            style={{ stopColor: '#40a9ff', stopOpacity: 0.6 }}
          />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop
            offset="0%"
            style={{ stopColor: '#bfbfbf', stopOpacity: 0.3 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: '#f0f0f0', stopOpacity: 0.5 }}
          />
        </linearGradient>
      </defs>
      {/* Abstract shapes */}
      <path
        d="M200 200 Q400 50, 600 200 T 700 400"
        stroke="url(#grad2)"
        strokeWidth="3"
        fill="transparent"
      />
      <path
        d="M100 600 Q300 750, 500 600 T 750 500"
        stroke="url(#grad2)"
        strokeWidth="3"
        fill="transparent"
      />

      {/* Main animated path */}
      <path
        d="M150 400 C 300 200, 500 600, 650 400"
        stroke="url(#grad1)"
        strokeWidth="15"
        fill="transparent"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dasharray"
          from="0,1000"
          to="1000,0"
          dur="5s"
          repeatCount="indefinite"
        />
      </path>

      {/* Pulsing circles */}
      <circle cx="150" cy="400" r="15" fill="#1890ff">
        <animate
          attributeName="r"
          values="15;20;15"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="650" cy="400" r="15" fill="#40a9ff">
        <animate
          attributeName="r"
          values="15;20;15"
          dur="2s"
          begin="1s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="400" cy="400" r="10" fill="rgba(24, 144, 255, 0.5)">
        <animate
          attributeName="cx"
          values="300;500;300"
          dur="10s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  </div>
)

export default LoginGraphic
