import { env } from '../../config/env';

/** saucedemo accounts; all of them share one password. */
export const USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
  /** Same catalogue, deliberately broken visuals — used to prove the screenshot comparison catches changes. */
  visual: 'visual_user',
} as const;

export type Username = (typeof USERS)[keyof typeof USERS];

export const PASSWORD = env.ui.password;

export const INVALID_PASSWORD = 'wrong_password';

/** A valid username with different letter case: usernames are case-sensitive. */
export const USERNAME_WRONG_CASE = 'Standard_User';

/** The placeholder picture visual_user gets instead of the real product image. */
export const BROKEN_IMAGE_MARKER = 'sl-404';
