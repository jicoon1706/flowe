/**
 * Tests for the notifications service (src/services/notifications.ts).
 *
 * This service backs the "notifications (in-app + OS banner)" feature: every
 * add/edit/delete of a transaction, asset, or liability calls notify(), which
 * must (a) fire an OS banner and (b) write an in-app row — without ever throwing
 * back into the action that triggered it.
 *
 * The module keeps a cached `permissionGranted` flag at module scope, so each
 * test re-imports the module fresh via jest.resetModules() to start clean.
 */

// --- Mocks ------------------------------------------------------------------

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notif-id')),
  AndroidImportance: { HIGH: 4 },
}));

jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-123' } } })),
    },
  },
}));

jest.mock('@/src/repositories/notifications.repository', () => ({
  notificationsRepository: {
    create: jest.fn(() => Promise.resolve({ ok: true, data: {} })),
  },
}));

// --- Helpers ----------------------------------------------------------------

const Notifications = require('expo-notifications');
const { supabase } = require('@/src/lib/supabase');
const { notificationsRepository } = require('@/src/repositories/notifications.repository');

/** Re-import the service with a clean module-level permission cache. */
function loadService() {
  let svc: typeof import('@/src/services/notifications');
  jest.isolateModules(() => {
    svc = require('@/src/services/notifications');
  });
  return svc!;
}

/** Force the mocked Platform.OS for the next loadService() call. */
function setPlatform(os: 'ios' | 'android') {
  require('react-native').Platform.OS = os;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Restore default happy-path resolutions cleared above.
  Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Notifications.scheduleNotificationAsync.mockResolvedValue('notif-id');
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  notificationsRepository.create.mockResolvedValue({ ok: true, data: {} });
  setPlatform('ios');
});

// --- formatRM ---------------------------------------------------------------

describe('formatRM()', () => {
  it('formats a whole number with two decimals and a thousands separator', () => {
    const { formatRM } = loadService();
    expect(formatRM(1234.5)).toBe('RM 1,234.50');
  });

  it('formats zero', () => {
    const { formatRM } = loadService();
    expect(formatRM(0)).toBe('RM 0.00');
  });

  it('formats large values with grouping', () => {
    const { formatRM } = loadService();
    expect(formatRM(1000000)).toBe('RM 1,000,000.00');
  });

  it('keeps two decimals for fractional amounts', () => {
    const { formatRM } = loadService();
    expect(formatRM(9.9)).toBe('RM 9.90');
  });
});

// --- setupNotifications -----------------------------------------------------

describe('setupNotifications()', () => {
  it('registers the Android channel on Android', async () => {
    setPlatform('android');
    const { setupNotifications } = loadService();
    await setupNotifications();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'default',
      expect.objectContaining({ name: 'Default', lightColor: '#C5FF00' }),
    );
  });

  it('does not register a channel on iOS', async () => {
    setPlatform('ios');
    const { setupNotifications } = loadService();
    await setupNotifications();
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  it('returns true when permission is already granted (no re-request)', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    const { setupNotifications } = loadService();
    const granted = await setupNotifications();
    expect(granted).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requests permission when not yet granted', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    const { setupNotifications } = loadService();
    const granted = await setupNotifications();
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(granted).toBe(true);
  });

  it('returns false when permission is denied', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const { setupNotifications } = loadService();
    const granted = await setupNotifications();
    expect(granted).toBe(false);
  });
});

// --- presentLocalNotification -----------------------------------------------

describe('presentLocalNotification()', () => {
  it('schedules an immediate banner when permission is granted', async () => {
    const { presentLocalNotification } = loadService();
    await presentLocalNotification('Title', 'Body');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: { title: 'Title', body: 'Body' },
      trigger: null,
    });
  });

  it('lazily requests permission when the cache is empty', async () => {
    const { presentLocalNotification } = loadService();
    await presentLocalNotification('Title', 'Body');
    // Cache started null -> setupNotifications() runs to populate it.
    expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
  });

  it('does not schedule a banner when permission is denied', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const { presentLocalNotification } = loadService();
    await presentLocalNotification('Title', 'Body');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('never throws even if scheduling fails', async () => {
    Notifications.scheduleNotificationAsync.mockRejectedValue(new Error('boom'));
    const { presentLocalNotification } = loadService();
    await expect(presentLocalNotification('Title', 'Body')).resolves.toBeUndefined();
  });
});

// --- notify -----------------------------------------------------------------

describe('notify()', () => {
  const params = {
    type: 'liability' as const,
    emoji: '💸',
    message: 'Loan added',
    sub_text: 'RM 1,000.00',
    related_entity_id: 'liab-1',
  };

  it('fires the OS banner with "<emoji> <message>" as the title', async () => {
    const { notify } = loadService();
    await notify(params);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: { title: '💸 Loan added', body: 'RM 1,000.00' },
      trigger: null,
    });
  });

  it('records the in-app row with the resolved user id and mapped fields', async () => {
    const { notify } = loadService();
    await notify(params);
    expect(notificationsRepository.create).toHaveBeenCalledWith({
      user_id: 'user-123',
      type: 'liability',
      emoji: '💸',
      message: 'Loan added',
      sub_text: 'RM 1,000.00',
      is_read: false,
      related_entity_id: 'liab-1',
    });
  });

  it('uses an empty body when sub_text is omitted', async () => {
    const { notify } = loadService();
    await notify({ type: 'asset', emoji: '📈', message: 'Asset added' });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: { title: '📈 Asset added', body: '' },
      trigger: null,
    });
  });

  it('skips the in-app row when there is no authenticated user', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const { notify } = loadService();
    await notify(params);
    expect(notificationsRepository.create).not.toHaveBeenCalled();
  });

  it('still fires the banner even when the user lookup yields nothing', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const { notify } = loadService();
    await notify(params);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it('never throws when recording the in-app row fails', async () => {
    notificationsRepository.create.mockRejectedValue(new Error('db down'));
    const { notify } = loadService();
    await expect(notify(params)).resolves.toBeUndefined();
  });

  it('never throws when the user lookup fails', async () => {
    supabase.auth.getUser.mockRejectedValue(new Error('no session'));
    const { notify } = loadService();
    await expect(notify(params)).resolves.toBeUndefined();
  });
});

// --- Expo Go: OS notifications disabled ------------------------------------
//
// In Expo Go (SDK 53+) merely importing expo-notifications auto-registers a
// device push-token listener that logs a noisy error, so the service must skip
// the module entirely: OS banners become a no-op while in-app rows are still
// recorded. jest.setup.ts globally mocks isRunningInExpoGo() to false; this
// block flips it to true for the duration.

describe('Expo Go (OS notifications unsupported)', () => {
  const expo = require('expo');

  beforeEach(() => {
    expo.isRunningInExpoGo.mockReturnValue(true);
  });

  afterEach(() => {
    expo.isRunningInExpoGo.mockReturnValue(false);
  });

  it('setupNotifications() returns false without touching expo-notifications', async () => {
    setPlatform('android');
    const { setupNotifications } = loadService();
    const granted = await setupNotifications();
    expect(granted).toBe(false);
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('presentLocalNotification() is a no-op (no banner scheduled)', async () => {
    const { presentLocalNotification } = loadService();
    await presentLocalNotification('Title', 'Body');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('notify() still records the in-app row even though no banner fires', async () => {
    const { notify } = loadService();
    await notify({
      type: 'asset',
      emoji: '📈',
      message: 'Asset added',
      sub_text: 'RM 1,000.00',
      related_entity_id: 'asset-1',
    });
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(notificationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        type: 'asset',
        message: 'Asset added',
      }),
    );
  });

  it('notify() never throws in Expo Go', async () => {
    const { notify } = loadService();
    await expect(
      notify({ type: 'asset', emoji: '📈', message: 'Asset added' }),
    ).resolves.toBeUndefined();
  });
});
