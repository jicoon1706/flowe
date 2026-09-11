/**
 * Which parts of the app are usable before the user has unlocked it.
 *
 * Flowe no longer walls the whole app behind the PIN on launch: recording a
 * payment is the thing people open the app to do in a hurry, and a lock screen
 * in front of it is what makes them put it off. So the home screen (with every
 * balance masked) and the add-transaction form stay reachable; everything
 * else — history, cash flow, accounts, settings — asks for the PIN the moment
 * it's opened.
 *
 * Matched on the expo-router pathname, so a nested screen ('/home/accounts')
 * is locked even though it's reached from an open one.
 */
const OPEN_WHILE_LOCKED = ['/', '/add-transaction'];

export function isOpenWhileLocked(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  return OPEN_WHILE_LOCKED.includes(path);
}
