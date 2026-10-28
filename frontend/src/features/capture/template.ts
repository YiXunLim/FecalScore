/**
 * The sample template drawn over the camera.
 *
 * It is drawn in a 390 × 844 "design box" (a typical phone screen) and scaled
 * to fit any screen, always centered. To change the shape, edit the numbers below.
 *
 *            ___
 *           /   \    <- oval tip   (TIP_WIDTH × TIP_HEIGHT)
 *          |     |
 *           \   /
 *            | |     <- stick      (STICK_WIDTH, down to STICK_BOTTOM)
 *            | |
 */

export const DESIGN_WIDTH = 390;
export const DESIGN_HEIGHT = 844;

const CENTER_X = DESIGN_WIDTH / 2;
const TIP_CENTER_Y = 316; // middle of the oval tip
const TIP_WIDTH = 100;
const TIP_HEIGHT = 260;
const STICK_WIDTH = 54;
const STICK_BOTTOM = 659;

/** Builds the outline: up the left side of the stick, over the oval tip, down the right side. */
function buildPath(): string {
  const rx = TIP_WIDTH / 2;
  const ry = TIP_HEIGHT / 2;
  const left = CENTER_X - STICK_WIDTH / 2;
  const right = CENTER_X + STICK_WIDTH / 2;
  // Where the stick's sides meet the oval
  const dx = STICK_WIDTH / 2 / rx;
  const joinY = TIP_CENTER_Y + ry * Math.sqrt(1 - dx * dx);
  const r = (n: number) => Math.round(n * 10) / 10;
  return [
    `M${r(left)} ${r(STICK_BOTTOM)}`,
    `L${r(left)} ${r(joinY)}`,
    `A${rx} ${ry} 0 1 1 ${r(right)} ${r(joinY)}`,
    `L${r(right)} ${r(STICK_BOTTOM)}`,
    'Z',
  ].join(' ');
}

export const TEMPLATE_PATH = buildPath();

/** Small cross marking the center of the tip. */
export const TIP_CENTER = { x: CENTER_X, y: TIP_CENTER_Y };

/** Extra space kept around the template when cropping the photo for the model (in design units). */
export const CROP_PADDING = 12;
