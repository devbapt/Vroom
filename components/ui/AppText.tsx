import { Text, TextProps } from 'react-native';

const FONT_MAP = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
} as const;

type Weight = keyof typeof FONT_MAP;

interface AppTextProps extends TextProps {
  weight?: Weight;
}

export default function AppText({ weight = 'regular', style, ...rest }: AppTextProps) {
  return <Text style={[{ fontFamily: FONT_MAP[weight] }, style]} {...rest} />;
}
