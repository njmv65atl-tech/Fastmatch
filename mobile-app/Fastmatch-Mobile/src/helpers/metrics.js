import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
// Change these based on your design (usually Figma/Sketch artboard size)
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

/**
 * scale: Used for width, margin, padding, left, right, icons.
 */
const scale = (size) => (width / guidelineBaseWidth) * size;

/**
 * verticalScale: Used for height, top, bottom, line-height.
 */
const verticalScale = (size) => (height / guidelineBaseHeight) * size;

/**
 * moderateScale: Used for font-size and border-radius.
 * It allows you to control the resize factor (default is 0.5).
 */
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export { scale, verticalScale, moderateScale };