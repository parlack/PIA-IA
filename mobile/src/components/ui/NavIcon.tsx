/**
 * Iconos editoriales del menu lateral en mobile.
 *
 * SVG lineales monocromaticos, paridad con el componente web `NavIcon.vue`.
 * Heredan el color desde la prop `color`.
 */
import Svg, { Path, Circle, Rect } from 'react-native-svg'

export type NavIconName =
  | 'summary'
  | 'vaccines'
  | 'allergies'
  | 'aefi'
  | 'inbox'
  | 'dependents'
  | 'medical-unit'
  | 'my-info'
  | 'admin'
  | 'logout'
  | 'qr'
  | 'profile'

interface Props {
  name:   NavIconName
  size?:  number
  color?: string
}

export function NavIcon({ name, size = 20, color = '#1C1B17' }: Props) {
  const stroke = color
  const strokeWidth = 1.6

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'summary' && (
        <>
          <Path d="M6 3h9l4 4v14H6z" stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M15 3v4h4" stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M9 12h7" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M9 16h5" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
      {name === 'vaccines' && (
        <>
          <Path d="M16.5 4.5L20 8" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M14 7l3 3" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M13 8l-7 7v3h3l7-7z" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Path d="M9.5 14.5l2 2" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
      {name === 'allergies' && (
        <>
          <Path d="M12 3l10 17H2z" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Path d="M12 10v5" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Circle cx={12} cy={17.5} r={0.6} fill={stroke} />
        </>
      )}
      {name === 'aefi' && (
        <>
          <Path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z"
                stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Path d="M9.5 11h2v-2h1v2h2v1h-2v2h-1v-2h-2z" fill={stroke} />
        </>
      )}
      {name === 'inbox' && (
        <>
          <Rect x={3} y={6} width={18} height={13} rx={1}
                stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M3 7l9 7 9-7" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </>
      )}
      {name === 'dependents' && (
        <>
          <Circle cx={9} cy={8} r={3} stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M3 20c0-3 3-5 6-5s6 2 6 5" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Circle cx={17} cy={9} r={2.4} stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M14 20c0-2 2-3.5 4-3.5 1.5 0 3 1 3 3"
                stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
      {name === 'medical-unit' && (
        <>
          <Rect x={3} y={9} width={18} height={12} stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M9 9V3h6v6" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
          <Path d="M11 14h2v2h2v-2h2v-2h-2v-2h-2v2h-2z" fill={stroke} />
        </>
      )}
      {name === 'my-info' && (
        <>
          <Circle cx={12} cy={8} r={4} stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
                stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
      {name === 'admin' && (
        <>
          <Circle cx={12} cy={12} r={3} stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
                stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
      {name === 'logout' && (
        <>
          <Path d="M9 3H5v18h4" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
          <Path d="M16 8l4 4-4 4" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
          <Path d="M20 12H10" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
      {name === 'qr' && (
        <>
          <Rect x={3}  y={3}  width={7} height={7} stroke={stroke} strokeWidth={strokeWidth} />
          <Rect x={14} y={3}  width={7} height={7} stroke={stroke} strokeWidth={strokeWidth} />
          <Rect x={3}  y={14} width={7} height={7} stroke={stroke} strokeWidth={strokeWidth} />
          <Rect x={5.5}  y={5.5}  width={2} height={2} fill={stroke} />
          <Rect x={16.5} y={5.5}  width={2} height={2} fill={stroke} />
          <Rect x={5.5}  y={16.5} width={2} height={2} fill={stroke} />
          <Path d="M14 14h3v3M20 14v3M14 18v3M17 20h4" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle cx={12} cy={8} r={4} stroke={stroke} strokeWidth={strokeWidth} />
          <Path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
                stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        </>
      )}
    </Svg>
  )
}
