import {DEFAULT_PRESETS} from '../../constants/presets';

describe('DEFAULT_PRESETS', () => {
  test('has 10 preset items', () => {
    expect(DEFAULT_PRESETS).toHaveLength(10);
  });

  test('all presets have required fields', () => {
    DEFAULT_PRESETS.forEach(preset => {
      expect(preset).toHaveProperty('id');
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('icon');
      expect(preset).toHaveProperty('category');
      expect(preset).toHaveProperty('mode');
      expect(preset.defaultPlayers).toBeGreaterThanOrEqual(2);
    });
  });

  test('all preset IDs are unique', () => {
    const ids = DEFAULT_PRESETS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(DEFAULT_PRESETS.length);
  });

  test('modes are valid', () => {
    const validModes = ['max', 'min', 'rounds', 'darts'];
    DEFAULT_PRESETS.forEach(preset => {
      expect(validModes).toContain(preset.mode);
    });
  });

  test('categories are valid', () => {
    const validCategories = ['cards', 'table', 'sports', 'other'];
    DEFAULT_PRESETS.forEach(preset => {
      expect(validCategories).toContain(preset.category);
    });
  });

  test('rounds mode presets have targetRounds and roundTargetScore', () => {
    const roundsPresets = DEFAULT_PRESETS.filter(p => p.mode === 'rounds');
    roundsPresets.forEach(preset => {
      expect(preset).toHaveProperty('targetRounds');
      expect(preset).toHaveProperty('roundTargetScore');
      expect(preset.targetRounds).toBeGreaterThan(0);
      expect(preset.roundTargetScore).toBeGreaterThan(0);
    });
  });

  test('non-rounds mode presets have targetScore', () => {
    const nonRoundsPresets = DEFAULT_PRESETS.filter(p => p.mode !== 'rounds');
    nonRoundsPresets.forEach(preset => {
      expect(preset).toHaveProperty('targetScore');
      expect(preset.targetScore).toBeGreaterThan(0);
    });
  });

  test('all presets have incrementValues', () => {
    DEFAULT_PRESETS.forEach(preset => {
      expect(preset).toHaveProperty('incrementValues');
      expect(Array.isArray(preset.incrementValues)).toBe(true);
      expect(preset.incrementValues.length).toBeGreaterThan(0);
    });
  });

  test('player count is within valid range', () => {
    const MIN_PLAYERS = 2;
    const MAX_PLAYERS = 8;
    DEFAULT_PRESETS.forEach(preset => {
      expect(preset.defaultPlayers).toBeGreaterThanOrEqual(MIN_PLAYERS);
      expect(preset.defaultPlayers).toBeLessThanOrEqual(MAX_PLAYERS);
    });
  });
});
